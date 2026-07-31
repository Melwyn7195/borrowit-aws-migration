#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FoundationStack } from '../lib/foundation-stack';
import { DataStack } from '../lib/data-stack';
import { FrontendStack } from '../lib/frontend-stack';
import { AppStack } from '../lib/app-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region:
    process.env.CDK_DEFAULT_REGION ??
    String(app.node.tryGetContext('region') ?? 'ap-southeast-1'),
};

// Layers are split so the one that costs real money can be destroyed on its own.
// Dependencies all point one way - AppStack imports from the other three and
// nothing imports from AppStack - which is what makes `cdk destroy BorrowitApp`
// safe to run without CloudFormation refusing over an exported value.
const foundation = new FoundationStack(app, 'BorrowitFoundation', { env });

const data = new DataStack(app, 'BorrowitData', {
  env,
  vpc: foundation.vpc,
  databaseSecurityGroup: foundation.databaseSecurityGroup,
});

const frontend = new FrontendStack(app, 'BorrowitFrontend', { env });

new AppStack(app, 'BorrowitApp', {
  env,
  vpc: foundation.vpc,
  repository: foundation.repository,
  albSecurityGroup: foundation.albSecurityGroup,
  serviceSecurityGroup: foundation.serviceSecurityGroup,
  database: data.database,
  uploadsBucket: frontend.uploadsBucket,
  distributionUrl: frontend.distributionUrl,
});

// Tag everything so Cost Explorer can break the bill down per project.
cdk.Tags.of(app).add('Project', 'BorrowIt');
cdk.Tags.of(app).add('ManagedBy', 'CDK');
