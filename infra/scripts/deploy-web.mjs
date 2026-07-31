import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { REGION, outputsOf, run } from './stack-outputs.mjs';

// Builds the React app and ships it to the bucket CloudFront serves.
//
// This is a release step, not an infrastructure change, which is why it is a
// script rather than a CDK BucketDeployment. A BucketDeployment would make
// `cdk synth` of every stack fail whenever dist/ happens to be missing, and it
// pays for a Lambda to copy files that `aws s3 sync` copies for free.

const here = dirname(fileURLToPath(import.meta.url));
const web = resolve(here, '../../Renting-Online-Web-main');
const dist = resolve(web, 'dist');

const { WebBucketName, DistributionId, DistributionUrl, ApiOrigin } =
  outputsOf('BorrowitFrontend');

console.log('Building the frontend...');
run('npm', ['run', 'build'], { cwd: web });

if (!existsSync(dist)) {
  throw new Error(`Build produced no ${dist}`);
}

// Hashed filenames, so they can be cached forever. Everything the browser needs
// to re-fetch after a deploy is referenced from index.html, which is not.
console.log(`Uploading to s3://${WebBucketName} ...`);
run('aws', [
  's3', 'sync', dist, `s3://${WebBucketName}`,
  '--region', REGION,
  '--delete',
  '--exclude', 'index.html',
  '--cache-control', 'public,max-age=31536000,immutable',
]);

// The one file that must never be served stale - it is what points at the
// current asset hashes.
run('aws', [
  's3', 'cp', resolve(dist, 'index.html'), `s3://${WebBucketName}/index.html`,
  '--region', REGION,
  '--cache-control', 'no-cache',
]);

// The first 1000 invalidation paths each month are free.
console.log('Invalidating the CloudFront cache...');
run('aws', [
  'cloudfront', 'create-invalidation',
  '--distribution-id', DistributionId,
  '--paths', '/*',
  '--no-cli-pager',
]);

console.log(`\nDeployed: ${DistributionUrl}`);
if (!ApiOrigin || ApiOrigin.startsWith('(')) {
  console.log(
    'The distribution has no /api/* route yet - run `npm run wire` first, or ' +
    'every API call will 403 out of S3.',
  );
}
