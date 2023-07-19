#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { Context } from '../props/context';
import { PropsMap } from '../props/accountProps';
import { NetworkStack } from '../lib/network-stack';
import { DatabaseStack } from '../lib/database-stack';

const app = new cdk.App();

// props
const env = app.node.tryGetContext('env');
const context: Context = app.node.tryGetContext(env);
const accountProps = PropsMap[context.account];
const apiDomain = `${context.environmentNamePrefix}api-${accountProps.route53ZoneName}`;
const webDomain = `${context.environmentNamePrefix}${accountProps.route53ZoneName}`;

console.log(`account: ${context.account}`);
console.log(`stage: ${context.stage}`);
console.log(`environmentName: ${context.environmentName}`);
console.log(`environmentNamePrefix: ${context.environmentNamePrefix}`);
console.log(`apiDomain: ${apiDomain}`);
console.log(`webDomain: ${webDomain}`);

//tags
Tags.of(app).add('account', context.account); // prd, dev
Tags.of(app).add('stage', context.stage); // prd, stg, dev
Tags.of(app).add('environment', context.environmentName); // prd, dev-1, dev-2
Tags.of(app).add('service', context.serviceName);

// create stacks
const networkStack = new NetworkStack(
  app,
  `${context.environmentNamePrefix}${context.serviceName}-network-stack`,
  {
    env: {
      region: context.region,
      account: accountProps.accountId,
    },
    ...context,
    accountProps,
  }
);

const databaseStack = new DatabaseStack(
  app,
  `${context.environmentNamePrefix}${context.serviceName}-database-stack`,
  {
    env: {
      region: context.region,
      account: accountProps.accountId,
    },
    ...context,
    accountProps,
    vpc: networkStack.vpc,
  }
);
