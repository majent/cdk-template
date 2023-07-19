import { ScalingInterval } from 'aws-cdk-lib/aws-applicationautoscaling/lib/step-scaling-policy';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as cloudmap from 'aws-cdk-lib/aws-servicediscovery';
import * as cdk from 'aws-cdk-lib';

export interface DatabaseProps {
  readonly dbInstanceClass: ec2.InstanceClass;
  readonly dbInstanceSize: ec2.InstanceSize;
  readonly dbRemovalPolicy: cdk.RemovalPolicy;
  readonly bastionInstanceClass: ec2.InstanceClass;
  readonly bastionInstanceSize: ec2.InstanceSize;
}

export interface ServiceProps {
  readonly nginxTask: TaskProps;
  readonly serviceTask: TaskProps;
  readonly memoryLimitMiB: number;
  readonly cpu: number;
  readonly desiredCount: number;
  readonly minCapacity: number;
  readonly maxCapacity: number;
  readonly targetCpuUtilizationPercent: number;
  readonly scaleInCooldown: number;
  readonly scaleOutCooldown: number;
  readonly listenerHttpPort: number;
  readonly listenerHttpsPort: number;
  readonly listenerPriority: number;
  readonly cloudMapOptions?: ecs.CloudMapOptions;
  readonly codebuildComputeType: codebuild.ComputeType;
  readonly healthcheckUrl: string;
  readonly monitoringProps: ServiceMonitoringProps;
  readonly repositoryName: string;
  readonly healthCheckGracePeriod: number;
  /**
   * Scaling        -1          (no change)          +1       +3
   *             │        │                       │        │        │
   *             ├────────┼───────────────────────┼────────┼────────┤
   *             │        │                       │        │        │
   * Worker use  0%      10%                     50%       70%     100%
   */
  readonly scalingInterval: ScalingInterval[];
}

export interface AlbMonitoringProps {
  readonly requestCountThreshold: number;
}

export interface ServiceMonitoringProps {
  readonly cpuThreshold: number;
  readonly memoryThreshold: number;
  readonly runningTaskCountThreshold: number;
}

export interface DatabaseMonitoringProps {
  readonly cpuThreshold: number;
  readonly memoryThreshold: number;
  readonly connectionThreshold: number;
  readonly replicationLagThreshold: number;
}

export interface CacheMonitoringProps {
  readonly cpuThreshold: number;
  readonly engineCupThreshold: number;
  readonly swapUsageThreshold: number;
  readonly currConnectionsThreshold: number;
  readonly replicationLagThreshold: number;
}

export interface TaskProps {
  readonly containerPort: number;
  readonly memoryLimitMiB: number;
  readonly cpu: number;
  readonly repositoryName: string;
}

export interface AccountProps {
  readonly accountId: string;
  readonly prefixList: string[];
  readonly apiServiceProps: ServiceProps;
  readonly webServiceProps: ServiceProps;
  readonly route53ZoneId: string;
  readonly route53ZoneName: string;
  readonly acmDomainName: string;
  readonly acmArn: string;
  readonly acmArnForGlobal: string;
  readonly databaseProps: DatabaseProps;
  readonly albMonitoringProps: AlbMonitoringProps;
  readonly dbMonitoringProps: DatabaseMonitoringProps;
  readonly cacheMonitoringProps: CacheMonitoringProps;
  readonly keyName: string;
  readonly sqsArn?: string;
  readonly slackWorkspace: string;
  readonly slackAlertChannel: string;
  readonly slackInfoChannel: string;
  readonly fireHoseIntervalInSeconds: number;
  readonly resourceBucketArn: string;
  readonly connectionArn: string;
  readonly webAclArn?: string;
}

export const PropsMap: {
  [key: string]: AccountProps;
} = {
  dev: {
    accountId: '',
    prefixList: [''],
    route53ZoneId: '',
    route53ZoneName: '',
    acmDomainName: '',
    acmArn: '',
    acmArnForGlobal: '',
    databaseProps: {
      dbInstanceClass: ec2.InstanceClass.T3,
      dbInstanceSize: ec2.InstanceSize.MEDIUM,
      dbRemovalPolicy: cdk.RemovalPolicy.DESTROY,
      bastionInstanceClass: ec2.InstanceClass.T3A,
      bastionInstanceSize: ec2.InstanceSize.MICRO,
    },
    keyName: '',
    sqsArn: '',
    slackWorkspace: '',
    slackAlertChannel: '',
    slackInfoChannel: '',
    fireHoseIntervalInSeconds: 60,
    resourceBucketArn: '',
    connectionArn: '',
    webAclArn: '',
    albMonitoringProps: {
      requestCountThreshold: 1000,
    },
    dbMonitoringProps: {
      replicationLagThreshold: 1000,
      connectionThreshold: 100,
      cpuThreshold: 60,
      memoryThreshold: 300000000,
    },
    cacheMonitoringProps: {
      replicationLagThreshold: 10,
      currConnectionsThreshold: 10000,
      cpuThreshold: 50,
      engineCupThreshold: 50,
      swapUsageThreshold: 52428800,
    },
    apiServiceProps: {
      serviceTask: {
        containerPort: 8080,
        memoryLimitMiB: 512,
        cpu: 256,
        repositoryName: '',
      },
      nginxTask: {
        containerPort: 80,
        memoryLimitMiB: 256,
        cpu: 256,
        repositoryName: '',
      },
      memoryLimitMiB: 1024,
      cpu: 512,
      desiredCount: 1,
      minCapacity: 1,
      maxCapacity: 1,
      targetCpuUtilizationPercent: 10,
      scaleInCooldown: 60,
      scaleOutCooldown: 60,
      listenerHttpsPort: 443,
      listenerHttpPort: 80,
      listenerPriority: 2,
      cloudMapOptions: {
        name: ``,
        dnsTtl: cdk.Duration.millis(3000),
        dnsRecordType: cloudmap.DnsRecordType.A,
        failureThreshold: 1,
      },
      codebuildComputeType: codebuild.ComputeType.SMALL,
      healthcheckUrl: '/healthcheck',
      monitoringProps: {
        cpuThreshold: 60,
        memoryThreshold: 60,
        runningTaskCountThreshold: 1,
      },
      repositoryName: '',
      healthCheckGracePeriod: 60,
      scalingInterval: [
        { lower: 10, change: 2 },
        { lower: 20, change: 2 },
        { lower: 30, change: 2 },
      ],
    },
    webServiceProps: {
      serviceTask: {
        containerPort: 3000,
        memoryLimitMiB: 512,
        cpu: 256,
        repositoryName: '',
      },
      nginxTask: {
        containerPort: 80,
        memoryLimitMiB: 256,
        cpu: 256,
        repositoryName: '',
      },
      memoryLimitMiB: 1024,
      cpu: 512,
      desiredCount: 1,
      minCapacity: 1,
      maxCapacity: 1,
      targetCpuUtilizationPercent: 10,
      scaleInCooldown: 60,
      scaleOutCooldown: 60,
      listenerHttpsPort: 443,
      listenerHttpPort: 80,
      listenerPriority: 1,
      codebuildComputeType: codebuild.ComputeType.SMALL,
      healthcheckUrl: '/health-check',
      monitoringProps: {
        cpuThreshold: 60,
        memoryThreshold: 60,
        runningTaskCountThreshold: 1,
      },
      repositoryName: '',
      healthCheckGracePeriod: 60,
      scalingInterval: [
        { lower: 5, change: 1 },
        { lower: 10, change: 2 },
        { lower: 20, change: 2 },
        { lower: 30, change: 2 },
      ],
    },
  },
  prd: {
    accountId: '',
    prefixList: [''],
    route53ZoneId: '',
    route53ZoneName: '',
    acmDomainName: '',
    acmArn: '',
    acmArnForGlobal: '',
    databaseProps: {
      dbInstanceClass: ec2.InstanceClass.R5,
      dbInstanceSize: ec2.InstanceSize.LARGE,
      dbRemovalPolicy: cdk.RemovalPolicy.RETAIN,
      bastionInstanceClass: ec2.InstanceClass.T3A,
      bastionInstanceSize: ec2.InstanceSize.MICRO,
    },
    keyName: '',
    sqsArn: '',
    slackWorkspace: '',
    slackAlertChannel: '',
    slackInfoChannel: '',
    fireHoseIntervalInSeconds: 300,
    resourceBucketArn: '',
    connectionArn: '',
    albMonitoringProps: {
      requestCountThreshold: 2000,
    },
    dbMonitoringProps: {
      replicationLagThreshold: 1000,
      connectionThreshold: 500,
      cpuThreshold: 60,
      memoryThreshold: 3000000000,
    },
    cacheMonitoringProps: {
      replicationLagThreshold: 10,
      currConnectionsThreshold: 10000,
      cpuThreshold: 50,
      engineCupThreshold: 50,
      swapUsageThreshold: 52428800,
    },
    apiServiceProps: {
      serviceTask: {
        containerPort: 8080,
        memoryLimitMiB: 2048,
        cpu: 1024,
        repositoryName: '',
      },
      nginxTask: {
        containerPort: 80,
        memoryLimitMiB: 2048,
        cpu: 1024,
        repositoryName: '',
      },
      memoryLimitMiB: 4096,
      cpu: 2048,
      desiredCount: 2,
      minCapacity: 2,
      maxCapacity: 4,
      targetCpuUtilizationPercent: 10,
      scaleInCooldown: 60,
      scaleOutCooldown: 60,
      listenerHttpsPort: 443,
      listenerHttpPort: 80,
      listenerPriority: 2,
      cloudMapOptions: {
        name: ``,
        dnsTtl: cdk.Duration.millis(3000),
        dnsRecordType: cloudmap.DnsRecordType.A,
        failureThreshold: 1,
      },
      codebuildComputeType: codebuild.ComputeType.SMALL,
      healthcheckUrl: '/healthcheck',
      monitoringProps: {
        cpuThreshold: 60,
        memoryThreshold: 60,
        runningTaskCountThreshold: 2,
      },
      repositoryName: '',
      healthCheckGracePeriod: 60,
      scalingInterval: [
        { lower: 10, change: 2 },
        { lower: 20, change: 2 },
        { lower: 30, change: 2 },
      ],
    },
    webServiceProps: {
      serviceTask: {
        containerPort: 3000,
        memoryLimitMiB: 512,
        cpu: 256,
        repositoryName: '',
      },
      nginxTask: {
        containerPort: 80,
        memoryLimitMiB: 512,
        cpu: 256,
        repositoryName: '',
      },
      memoryLimitMiB: 1024,
      cpu: 512,
      desiredCount: 2,
      minCapacity: 2,
      maxCapacity: 4,
      targetCpuUtilizationPercent: 10,
      scaleInCooldown: 60,
      scaleOutCooldown: 60,
      listenerHttpsPort: 443,
      listenerHttpPort: 80,
      listenerPriority: 1,
      codebuildComputeType: codebuild.ComputeType.SMALL,
      healthcheckUrl: '/health-check',
      monitoringProps: {
        cpuThreshold: 60,
        memoryThreshold: 60,
        runningTaskCountThreshold: 2,
      },
      repositoryName: 'F',
      healthCheckGracePeriod: 60,
      scalingInterval: [
        { lower: 10, change: 2 },
        { lower: 20, change: 2 },
        { lower: 30, change: 2 },
      ],
    },
  },
};
