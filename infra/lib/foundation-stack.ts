import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

/**
 * Networking and the container registry.
 *
 * Everything here is either free or costs cents, and AppStack is torn down and
 * rebuilt against it repeatedly, so this stack is meant to stay deployed.
 */
export class FoundationStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly repository: ecr.Repository;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly serviceSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      // A NAT Gateway is roughly $33/month, more than the whole project budget.
      // Tasks therefore run in public subnets with a public IP so they can reach
      // ECR, Secrets Manager and CloudWatch through the internet gateway. The
      // service security group below is what actually keeps them private.
      natGateways: 0,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        { name: 'isolated', subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
    });

    // S3 gateway endpoints are free and keep upload traffic off the public path.
    // This one also carries ECR image layers, which are stored in S3 - so it is
    // load-bearing for task startup, not just for uploads.
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      description: 'Public entry point for the BorrowIt API',
      allowAllOutbound: true,
    });
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP from the internet',
    );

    this.serviceSecurityGroup = new ec2.SecurityGroup(this, 'ServiceSecurityGroup', {
      vpc: this.vpc,
      description: 'BorrowIt Fargate tasks',
      allowAllOutbound: true,
    });
    // The tasks hold a public IP but nothing on the internet can open a
    // connection to them - only the load balancer can.
    this.serviceSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(3456),
      'Load balancer to app',
    );

    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'BorrowIt RDS PostgreSQL',
      allowAllOutbound: false,
    });
    this.databaseSecurityGroup.addIngressRule(
      this.serviceSecurityGroup,
      ec2.Port.tcp(5432),
      'App to Postgres',
    );

    // ---------------------------------------------------------------------
    // Interface VPC endpoints - part of the architecture, not a flag.
    //
    // Without these the Fargate tasks reach ECR, Secrets Manager, CloudWatch
    // Logs and SSM over the internet gateway using their public IP. That
    // traffic is TLS and SigV4-signed, so it is not readable in transit, but it
    // does leave the VPC. Interface endpoints put an ENI for each service
    // inside the VPC and, with private DNS on, the regional service hostname
    // resolves to that ENI - so the calls never touch the public internet, and
    // each endpoint can carry its own resource policy as a second
    // authorisation layer.
    //
    // COST: $0.01 per endpoint per AZ per hour in ap-southeast-1, so $7.30 per
    // endpoint per AZ per month. Five endpoints in one AZ is ~$36/month, which
    // makes this stack the second most expensive in the project after the ALB.
    // It is a deliberate spend, and it behaves differently from the rest of the
    // bill: FoundationStack is never torn down, so this charge continues while
    // BorrowitApp is destroyed. Destroying the app no longer drops the monthly
    // run rate to ~$17.
    //
    // One AZ is the default. Private DNS returns every ENI the endpoint has and
    // a cross-AZ call inside a VPC still works, so a single AZ halves the bill
    // in exchange for a dependency on that AZ staying up.
    //
    //   cdk deploy BorrowitFoundation                     # one AZ,   ~$36/mo
    //   cdk deploy BorrowitFoundation -c vpcEndpoints=ha  # both AZs, ~$73/mo
    //
    // Note what this does NOT buy: the tasks still need `assignPublicIp: true`.
    // Dropping the public IP means every AWS call must have an endpoint, and
    // any miss is a task that hangs at startup instead of failing loudly. The
    // service security group is still what keeps the tasks unreachable.
    const vpcEndpoints = String(this.node.tryGetContext('vpcEndpoints') ?? '');

    // The endpoint ENIs get their own security group rather than the default
    // "whole VPC CIDR on 443" that `addInterfaceEndpoint` would generate.
    // Only the tasks may call them.
    const endpointSecurityGroup = new ec2.SecurityGroup(this, 'EndpointSecurityGroup', {
      vpc: this.vpc,
      description: 'BorrowIt interface VPC endpoints',
      allowAllOutbound: false,
    });
    endpointSecurityGroup.addIngressRule(
      this.serviceSecurityGroup,
      ec2.Port.tcp(443),
      'Fargate tasks to AWS service endpoints',
    );

    // Same public subnets the tasks run in. An endpoint ENI only ever has a
    // private IP, so "public subnet" here means routing, not exposure.
    const endpointSubnets: ec2.SubnetSelection = {
      subnetType: ec2.SubnetType.PUBLIC,
      ...(vpcEndpoints === 'ha'
        ? {}
        : { availabilityZones: [this.vpc.availabilityZones[0]] }),
    };

    // Fargate platform 1.4.0 pulls images, fetches secrets and ships logs over
    // the task ENI, so all of these are on the startup path. ECR also needs the
    // S3 gateway endpoint above for the layers themselves. SSM_MESSAGES is what
    // `enableExecuteCommand` in AppStack uses - without it `aws ecs
    // execute-command` stops working.
    const endpointServices: Record<string, ec2.InterfaceVpcEndpointAwsService> = {
      EcrApiEndpoint: ec2.InterfaceVpcEndpointAwsService.ECR,
      EcrDockerEndpoint: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      LogsEndpoint: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      SecretsManagerEndpoint: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      SsmMessagesEndpoint: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
    };

    Object.entries(endpointServices).forEach(([id, service]) => {
      this.vpc.addInterfaceEndpoint(id, {
        service,
        subnets: endpointSubnets,
        securityGroups: [endpointSecurityGroup],
        // Passing `securityGroups` does NOT replace the default rule, it adds
        // to it: `open` defaults to true, which allows the entire VPC CIDR on
        // 443 as well. Without this the endpoint is reachable from every subnet
        // including the isolated one, which is exactly what the dedicated
        // security group above exists to prevent.
        open: false,
        // The point of the exercise. With this off the service hostname still
        // resolves to a public IP and the traffic keeps using the internet
        // gateway, which would make the endpoints an expensive no-op.
        privateDnsEnabled: true,
      });
    });

    this.repository = new ecr.Repository(this, 'Repository', {
      repositoryName: 'borrowit-be',
      imageScanOnPush: true,
      // Lives here rather than in AppStack so tearing the app down overnight
      // does not throw away the images you already pushed.
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [{ maxImageCount: 10, description: 'Keep the last 10 images' }],
    });

    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });
    new cdk.CfnOutput(this, 'EcrRepositoryUri', { value: this.repository.repositoryUri });
  }
}
