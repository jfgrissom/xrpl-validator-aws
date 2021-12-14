#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import { XrplValidatorAwsStack } from '../lib/xrpl-validator-aws-stack'

const projectName = process.env.CDK_XRPL_PROJECT_NAME
if (!projectName) throw new Error('Please set CDK_XRPL_PROJECT_NAME')

const account = process.env.CDK_ACCOUNT
if (!account) throw new Error('Please set CDK_ACCOUNT')

const region = process.env.CDK_REGION
if (!region) throw new Error('Please set CDK_REGION')

const app = new cdk.App()

new XrplValidatorAwsStack(app, 'XrplValidatorAwsStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  env: { account: account, region: region },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
  terminationProtection: true
})

cdk.Tags.of(app).add('Project', projectName)
