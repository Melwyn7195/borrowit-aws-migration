import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface DataStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  databaseSecurityGroup: ec2.SecurityGroup;
}

/**
 * The PostgreSQL instance that replaces Supabase.
 *
 * db.t4g.micro on 20 GB runs ~$16/mo, drawn from the account's Free Plan
 * credits - this account post-dates the July 2025 free-tier change, so there is
 * no 12-month RDS allowance. Cheap enough to leave up, and keeping it up is the
 * point: destroying it drops the data with it.
 */
export class DataStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    // Single-AZ by default. `cdk deploy BorrowitData -c multiAz=true` flips on a
    // standby in the second AZ for the failover demo; it doubles the instance
    // cost, so turn it back off afterwards.
    const multiAz = String(this.node.tryGetContext('multiAz')) === 'true';

    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [props.databaseSecurityGroup],
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE4_GRAVITON,
        ec2.InstanceSize.MICRO,
      ),
      allocatedStorage: 20,
      // Pinned equal to allocatedStorage so storage autoscaling cannot quietly
      // grow the bill on a fixed credit balance.
      maxAllocatedStorage: 20,
      storageEncrypted: true,
      multiAz,
      publiclyAccessible: false,
      databaseName: 'borrowit',
      // RDS generates the password and stores it in Secrets Manager. AppStack
      // injects the fields straight into the task, so the password never lands
      // in a .env file or in the task definition.
      credentials: rds.Credentials.fromGeneratedSecret('borrowit'),
      backupRetention: cdk.Duration.days(1),
      deleteAutomatedBackups: true,
      // Without this the Postgres log stays on the instance, reachable only
      // through the RDS console's log viewer - which is useless for the failure
      // that matters here, a connection storm or an out-of-memory kill on a
      // micro instance. Exporting it puts the same lines in Logs Insights next
      // to the API logs.
      //
      // Cost is ingestion only, ~$0.63/GB. A quiet t4g.micro logs single-digit
      // MB a month; the 'upgrade' log is excluded because it only writes during
      // an engine version change.
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_WEEK,
      // DESTROY rather than RETAIN: an orphaned instance left running after a
      // `cdk destroy` would keep billing. db/seed_data.sql rebuilds the data.
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: this.database.dbInstanceEndpointAddress,
    });
    new cdk.CfnOutput(this, 'DbSecretArn', {
      value: this.database.secret!.secretArn,
      description: 'Read with: aws secretsmanager get-secret-value --secret-id <arn>',
    });
  }
}
