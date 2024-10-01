import {
  StackProps,
  Stack,
  Duration,
  aws_certificatemanager as cm,
  aws_ec2 as ec2,
  aws_ecr as ecr,
  aws_ecs as ecs,
  aws_iam as iam,
  aws_logs as logs,
  aws_route53 as route53,
  aws_elasticloadbalancingv2 as elbv2,
  aws_secretsmanager as sm,
} from "aws-cdk-lib";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { Construct } from "constructs";
import { prefix } from "../../config";

export interface EcsServiceStackProps extends StackProps {
  vpc: string;
  subnets: string[];

  // domain
  domainName: string;
  domainZone: string;
  certificate: string;

  // default resources
  desiredCount: number;

  allowedIngress?: {
    cidr: string;
    port: number;
  }[];

  // task definition
  taskDefinition: {
    memoryLimitMiB: number;
    cpu: number;
    containers: {
      image: string;
      name: string;
      portMappings?: {
        containerPort: number;
      }[];
      environment?: Record<string, string>;
      secrets?: Record<string, [string, string]>;
      mountPoints?: [
        {
          sourceVolume: string;
          containerPath: string;
          readOnly: boolean;
        }
      ];
    }[];
    volumes?: {
      name: string;
      efsVolumeConfiguration: {
        fileSystemId: string;
        rootDirectory?: string;
        transitEncryption: "ENABLED" | "DISABLED";
        authorizationConfig: {
          accessPointId: string;
          iam: "ENABLED" | "DISABLED";
        };
      };
    }[];
  };

  // autoscaling
  minCapacity: number;
  maxCapacity: number;
  targetCapacityPercent: number;
}

export class EcsServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: EcsServiceStackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, "ecs-service-vpc", { vpcName: props.vpc });
    // const subnets = props.subnets.map((subnet) => ec2.Subnet.fromSubnetId(this, `ecs-service-subnet-${subnet}`, subnet));

    const cluster = new ecs.Cluster(this, "ecs-cluster", {
      vpc,
      clusterName: prefix,
      enableFargateCapacityProviders: true,
      executeCommandConfiguration: {
        logging: ecs.ExecuteCommandLogging.NONE,
      }
    });

    const executionRole = new iam.Role(this, "ecs-task-execution-role", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      roleName: `power-user-${prefix}-task-execution-role`,
    });

    // grant permissions to the task execution role
    executionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonECSTaskExecutionRolePolicy")
    );
    executionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonElasticFileSystemClientFullAccess")
    );

    const taskRole = new iam.Role(this, "ecs-task-role", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      roleName: `power-user-${prefix}-task-role`,
    });

    taskRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonElasticFileSystemClientFullAccess")
    );

    taskRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonBedrockFullAccess")
    )

    const logGroup = new logs.LogGroup(this, "log-group", {
      logGroupName: prefix,
      retention: logs.RetentionDays.ONE_MONTH,
    });
    

    const taskDefinition = new ecs.FargateTaskDefinition(this, "ecs-task-definition", {
      executionRole,
      taskRole,
      family: id,
      memoryLimitMiB: props.taskDefinition.memoryLimitMiB,
      cpu: props.taskDefinition.cpu,
      volumes: props.taskDefinition.volumes ?? [],
    });

    for (let i = 0; i < props.taskDefinition.containers.length; i++) {
      const containerProps = props.taskDefinition.containers[i];
      const parseSecrets = (secretsObj: Record<string, [string, string]> | undefined) => {
        if (!secretsObj) return undefined;
        const secrets: Record<string, ecs.Secret> = {};
        for (const key in secretsObj) {
          const [secretName, field] = secretsObj[key];
          const secret = sm.Secret.fromSecretNameV2(this, `container-${i}-secret-${key}`, secretName);
          const ecsSecret = ecs.Secret.fromSecretsManager(secret, field);
          secrets[key] = ecsSecret;
        }
        return secrets;
      };

      const container = taskDefinition.addContainer(`container-${i}`, {
        image: ecs.ContainerImage.fromRegistry(containerProps.image),
        containerName: containerProps.name,
        portMappings: containerProps.portMappings ?? [],
        environment: containerProps.environment ?? {},
        secrets: parseSecrets(containerProps.secrets) ?? {},
        logging: new ecs.AwsLogDriver({ 
          logGroup,
          streamPrefix: "ecs",
        })
      });

      // add mount points
      if (containerProps.mountPoints) {
        container.addMountPoints(...containerProps.mountPoints);
      }
    }


    // const loadBalancer = new elbv2.ApplicationLoadBalancer(this, "ecs-service-load-balancer", {
    //   vpc,
    //   vpcSubnets: { subnetFilters: [ec2.SubnetFilter.onePerAz()] },
    //   internetFacing: false,
    //   loadBalancerName: prefix,
    //   idleTimeout: Duration.seconds(60),
    // });

    const service = new ApplicationLoadBalancedFargateService(this, "ecs-service", {
      cluster,
      
      domainName: props.domainName,
      domainZone: route53.HostedZone.fromLookup(this, "ecs-service-hosted-zone", { domainName: props.domainZone }),
      publicLoadBalancer: false,
      enableExecuteCommand: true,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      // targetProtocol: elbv2.ApplicationProtocol.HTTPS,
      // listenerPort: 443,
      // certificate: cm.Certificate.fromCertificateArn(this, "ecs-service-certificate", props.certificate),
      loadBalancerName: prefix,
      // openListener: true,
      // openListener: !Boolean(props.allowedIngress),
      serviceName: id,
      redirectHTTP: true,
      desiredCount: props.desiredCount,
      taskDefinition,
      // taskImageOptions: {
        // image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      // },
    });

    const cfnLoadBalancer = service.loadBalancer.node.defaultChild as elbv2.CfnLoadBalancer;
    cfnLoadBalancer.addOverride("Properties.Subnets", props.subnets)



    // for (const sg of service.loadBalancer.connections.securityGroups) {
    //   const cfnSecurityGroup = sg.node.defaultChild as ec2.CfnSecurityGroup;
    //   cfnSecurityGroup.addOverride(
    //     "Properties.SecurityGroupIngress",
    //     props.allowedIngress.map((ingress) => ({
    //       CidrIp: ingress.cidr,
    //       FromPort: ingress.port,
    //       ToPort: ingress.port,
    //       IpProtocol: "tcp",
    //     }))
    //   );
    // }

    // const lb = service.loadBalancer as C


    // autoscaling
    const scaling = service.service.autoScaleTaskCount({
      minCapacity: props.minCapacity,
      maxCapacity: props.maxCapacity,
    });

    scaling.scaleOnCpuUtilization("cpu-scaling", {
      targetUtilizationPercent: props.targetCapacityPercent,
    });

    scaling.scaleOnMemoryUtilization("memory-scaling", {
      targetUtilizationPercent: props.targetCapacityPercent,
    });

    // if (props.allowedIngress) {
    //   for (const ingress of props.allowedIngress) {
    //     service.loadBalancer.connections.allowFrom(ec2.Peer.ipv4(ingress.cidr), ec2.Port.tcp(ingress.port));
    //   }
    // }
  }
}
