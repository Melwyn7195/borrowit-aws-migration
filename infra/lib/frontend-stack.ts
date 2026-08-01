import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

/**
 * The React build, the user uploads, and the API, all served from one
 * CloudFront distribution.
 *
 * Neither bucket is public. CloudFront reaches them through Origin Access
 * Control, which is what lets the uploads bucket stay locked down while product
 * images are still readable in a browser.
 *
 * The API is here rather than being called directly on the load balancer
 * because two things make a separate API origin unworkable:
 *
 *   1. The ALB is HTTP only - there is no domain to put an ACM certificate on -
 *      and a page served over HTTPS cannot call an http:// endpoint. The
 *      browser blocks it as mixed content before the request is even sent.
 *   2. userController sets the session cookie with sameSite: 'strict'. On a
 *      cross-site API the browser drops that cookie, so login appears to
 *      succeed and every request after it is anonymous.
 *
 * Routing the API through the same distribution makes it same-origin, which
 * fixes both at once and removes the need for CORS entirely.
 */
export class FrontendStack extends cdk.Stack {
  public readonly webBucket: s3.Bucket;
  public readonly uploadsBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly distributionUrl: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Where the API lives. AppStack publishes the load balancer's DNS name to
    // this parameter; reading it here rather than importing it keeps the
    // dependency one-way, so `cdk destroy BorrowitApp` still works.
    //
    // This used to be a bare `-c albDns=...` context flag, which was a trap:
    // any deploy of this stack that forgot the flag silently dropped the
    // `/api/*` behaviours, and the symptom was every API call returning HTTP
    // 200 with the SPA shell rather than an error. Reading it from Parameter
    // Store means the routing survives a plain `cdk deploy BorrowitFrontend`.
    //
    // Resolved at synth time on purpose - see the comment on the parameter in
    // AppStack for why a deploy-time reference would be worse.
    const albDnsParameter = '/borrowit/alb-dns';

    // Context still wins, for two cases: `-c albDns=none` skips the API
    // behaviours on a from-scratch bootstrap, when AppStack does not exist yet
    // and the parameter cannot be read; and an explicit value overrides a stale
    // cached lookup without waiting on `npm run wire`.
    const override = this.node.tryGetContext('albDns');

    let albDns: string | undefined;
    if (override) {
      albDns = override === 'none' ? undefined : String(override);
    } else {
      const looked = ssm.StringParameter.valueFromLookup(this, albDnsParameter);
      // The context provider hands back a placeholder on the first pass, before
      // the CLI has actually resolved the parameter. Treating that as a real
      // hostname would synthesize an origin pointing at nothing.
      albDns = looked.startsWith('dummy-value-for-') ? undefined : looked;
    }

    this.webBucket = new s3.Bucket(this, 'WebBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const apiBehaviors: Record<string, cloudfront.BehaviorOptions> = {};

    if (albDns) {
      // HTTP_ONLY because the load balancer has no certificate. This hop runs
      // inside AWS between the edge and the ALB; the browser half of the
      // connection is still HTTPS, which is what the secure cookie flag and the
      // mixed-content rule actually care about.
      const apiOrigin = new origins.HttpOrigin(String(albDns), {
        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        httpPort: 80,
        // The ALB health check already decides what is reachable. Keep the edge
        // from sitting on a slow origin any longer than the API's own timeouts.
        readTimeout: cdk.Duration.seconds(30),
      });

      const apiBehavior: cloudfront.BehaviorOptions = {
        origin: apiOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        // POST/PUT/DELETE all have to reach the origin - this is a write API,
        // not a read-through cache.
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        // Never cache an authenticated API response at a shared edge. Two users
        // hitting /api/users/me must not see each other's answer.
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        // Forwards cookies, query strings and headers to the origin. The
        // session cookie is the whole authentication mechanism, so anything
        // less than ALL_VIEWER logs every request out.
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
      };

      apiBehaviors['/api/*'] = apiBehavior;
      // Reaching the readiness probe through the edge is what tells you the
      // whole chain works, not just the load balancer.
      apiBehaviors['/health'] = apiBehavior;
      // Swagger UI. `/api-docs*` also covers the assets it loads from
      // /api-docs/. It does not overlap /api/* - that pattern needs the slash.
      apiBehaviors['/api-docs*'] = apiBehavior;
      // The email verification and password reset pages are static files in
      // the API's public/ directory, not routes in the SPA build. They carry a
      // .html extension, so the SPA function below deliberately leaves them
      // alone and the default behaviour would look them up in the web bucket
      // and answer 403. Routing them to the ALB is what makes the link in a
      // verification email resolve at all. Being same-origin with /api/* is
      // also what lets those pages call the API on a relative path instead of
      // an absolute host the browser would block as mixed content.
      apiBehaviors['/verify-email*'] = apiBehavior;
      apiBehaviors['/reset-password*'] = apiBehavior;
    }

    // React Router owns the client-side routes, so a deep link like
    // /seller/dashboard has no matching S3 object and S3 answers 403.
    //
    // The obvious fix - a distribution-level errorResponse mapping 403/404 to
    // /index.html with status 200 - cannot be used once the API shares this
    // distribution, because custom error responses apply to every behaviour
    // rather than per-behaviour. `GET /api/products/999` would come back as the
    // HTML app shell with status 200, and client.js would read that as success
    // with a null body instead of throwing. Same for every 403 out of the auth
    // middleware.
    //
    // Rewriting the path at the edge instead keeps the fallback on the SPA
    // behaviour only, where it belongs. ~$0.10 per million requests.
    const spaRouting = new cloudfront.Function(this, 'SpaRouting', {
      comment: 'Serve index.html for client-side routes',
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  // A path with a file extension is a real asset. Leave those alone so a
  // missing bundle still fails visibly instead of returning the app shell.
  // S3 answers 403 rather than 404 for an absent key, because Origin Access
  // Control grants GetObject but not ListBucket.
  if (request.uri.indexOf('.') === -1) {
    request.uri = '/index.html';
  }
  return request;
}
      `),
    });

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.webBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [
          {
            function: spaRouting,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      additionalBehaviors: {
        // uploadController writes keys under `uploads/`, so this path prefix
        // maps straight onto the object key with no rewrite needed.
        '/uploads/*': {
          origin: origins.S3BucketOrigin.withOriginAccessControl(this.uploadsBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        ...apiBehaviors,
      },
      defaultRootObject: 'index.html',
      // Class 200 includes Southeast Asia and skips the priciest edge locations.
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
    });

    this.distributionUrl = `https://${this.distribution.distributionDomainName}`;

    new cdk.CfnOutput(this, 'DistributionUrl', { value: this.distributionUrl });
    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
    });
    new cdk.CfnOutput(this, 'WebBucketName', { value: this.webBucket.bucketName });
    new cdk.CfnOutput(this, 'UploadsBucketName', {
      value: this.uploadsBucket.bucketName,
    });
    // The single URL the demo runs on. Blank means the distribution is still
    // SPA-only and every /api call will 403 out of S3 - redeploy with -c albDns.
    new cdk.CfnOutput(this, 'ApiOrigin', {
      value: albDns ?? '(not wired - deploy BorrowitApp, then npm run wire)',
      description: 'Load balancer behind the /api/* behaviour',
    });
  }
}
