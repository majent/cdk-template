import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { BastionHostLinux, SubnetType } from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cdk from 'aws-cdk-lib';
import { StackProps } from '../props/stackProps';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export interface DatabaseStackProps extends StackProps {
  readonly vpc: ec2.Vpc;
}

export class DatabaseStack extends cdk.Stack {
  readonly database: rds.IDatabaseCluster;
  readonly bastion: BastionHostLinux;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const clusterEngine = rds.DatabaseClusterEngine.auroraMysql({
      version: rds.AuroraMysqlEngineVersion.VER_3_03_0,
    });

    const clusterParameterGroup = new rds.ParameterGroup(
      this,
      'ClusterParameterGroup',
      {
        engine: clusterEngine,
        description: 'cluster parameter group for aurora5.6',
      }
    );

    const parameterGroup = new rds.ParameterGroup(this, 'ParameterGroup', {
      engine: clusterEngine,
    });

    // RDS
    const databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: props.vpc,
        allowAllOutbound: true,
      }
    );
    this.database = new rds.DatabaseCluster(this, 'Database', {
      clusterIdentifier: `${props.environmentName}-${props.serviceName}-cluster`,
      engine: clusterEngine,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      credentials: rds.Credentials.fromUsername(
        ssm.StringParameter.valueForStringParameter(
          this,
          `/${props.environmentName}/${props.serviceName}/rds/username`
        ),
        {
          password: cdk.SecretValue.ssmSecure(
            `/${props.environmentName}/${props.serviceName}/rds/password`
          ),
        }
      ),
      defaultDatabaseName: props.serviceName,
      writer: rds.ClusterInstance.provisioned('writer', {
        publiclyAccessible: false,
        instanceType: ec2.InstanceType.of(
          props.accountProps.databaseProps.dbInstanceClass,
          props.accountProps.databaseProps.dbInstanceSize
        ),
        parameterGroup,
      }),
      readers: [
        rds.ClusterInstance.provisioned('reader1', {
          publiclyAccessible: false,
          instanceType: ec2.InstanceType.of(
            props.accountProps.databaseProps.dbInstanceClass,
            props.accountProps.databaseProps.dbInstanceSize
          ),
          parameterGroup,
        }),
      ],
      backup: {
        preferredWindow: '17:00-17:30',
        retention: cdk.Duration.days(3),
      },
      storageEncrypted: true,
      storageEncryptionKey: cdk.aws_kms.Alias.fromAliasName(
        this,
        'DefaultRdsKey',
        'alias/aws/rds'
      ),
      removalPolicy: props.accountProps.databaseProps.dbRemovalPolicy,
      parameterGroup: clusterParameterGroup,
      securityGroups: [databaseSecurityGroup],
    });

    //bastion
    const bastionSecurityGroup = new ec2.SecurityGroup(
      this,
      'BastionSecurityGroup',
      {
        vpc: props.vpc,
        allowAllOutbound: true,
      }
    );
    // bastion -> rds
    databaseSecurityGroup.addIngressRule(
      bastionSecurityGroup,
      ec2.Port.tcp(3306)
    );

    this.bastion = new ec2.BastionHostLinux(this, 'BastionHost', {
      instanceName: `${props.environmentNamePrefix}${props.serviceName}-bastion`,
      instanceType: ec2.InstanceType.of(
        props.accountProps.databaseProps.bastionInstanceClass,
        props.accountProps.databaseProps.bastionInstanceSize
      ),
      vpc: props.vpc,
      subnetSelection: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: bastionSecurityGroup,
    });

    //https://docs.aws.amazon.com/ja_jp/systems-manager/latest/userguide/setup-create-vpc.html
    // new ec2.InterfaceVpcEndpoint(this, 'VpcEndpointSsm', {
    //   service: ec2.InterfaceVpcEndpointAwsService.SSM,
    //   vpc: props.vpc,
    //   subnets: {
    //     subnets: props.vpc.privateSubnets,
    //   },
    //   securityGroups: this.bastion.connections.securityGroups.concat(
    //     this.database.connections.securityGroups
    //   ),
    //   privateDnsEnabled: true,
    // });
    // new ec2.InterfaceVpcEndpoint(this, 'VpcEndpointSsmMessage', {
    //   service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
    //   vpc: props.vpc,
    //   subnets: {
    //     subnets: props.vpc.privateSubnets,
    //   },
    //   securityGroups: this.bastion.connections.securityGroups,
    //   privateDnsEnabled: true,
    // });
    // new ec2.InterfaceVpcEndpoint(this, 'VpcEndpointEc2Message', {
    //   service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
    //   vpc: props.vpc,
    //   subnets: {
    //     subnets: props.vpc.privateSubnets,
    //   },
    //   securityGroups: this.bastion.connections.securityGroups,
    //   privateDnsEnabled: true,
    // });
    // new ec2.GatewayVpcEndpoint(this, 'GatewayVpcEndpointS3', {
    //   service: ec2.GatewayVpcEndpointAwsService.S3,
    //   vpc: props.vpc,
    //   subnets: [
    //     {
    //       subnets: props.vpc.privateSubnets,
    //     },
    //   ],
    // });
  }
}
