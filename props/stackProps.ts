import {AccountProps} from "../props/accountProps";
import * as cdk from 'aws-cdk-lib';
import {Context} from "../props/context";
export interface StackProps extends cdk.StackProps, Context {
  accountProps: AccountProps
}
