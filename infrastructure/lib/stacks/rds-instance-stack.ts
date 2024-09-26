import { StackProps, Stack, aws_rds as rds, aws_ec2 as ec2, aws_secretsmanager as secretsmanager } from "aws-cdk-lib";
import { ClusterInstance } from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import { prefix } from "../../config";

export interface RdsInstanceStackProps extends StackProps {
  vpc: string;
  instanceIdentifier: string;
  instanceType?: string;
  allocatedStorage?: number;
}

export const defaultProps = {
  instanceType: "t4g.micro",
  allocatedStorage: 20,
};

export class RdsInstanceStack extends Stack {
  constructor(scope: Construct, id: string, props: RdsInstanceStackProps) {
    super(scope, id, props);
    const instanceProps = {
      ...defaultProps,
      ...props,
    };

    // use Postgres for pgvector
    const vpc = ec2.Vpc.fromLookup(this, "rds-instance-vpc", { vpcName: instanceProps.vpc });

    const rdsInstanceSecret = new secretsmanager.Secret(this, "rds-instance-secret", {
      secretName: `${prefix}-database-credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: "admin",
        }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: "password",
      },
    });

    // const rdsCluster = new rds.DatabaseCluster(this, "rds-cluster", {
    //   vpc,
    //   clusterIdentifier: instanceProps.clusterIdentifier,
    //   engine: rds.DatabaseClusterEngine.auroraPostgres({
    //     version: rds.AuroraPostgresEngineVersion.VER_16_3,
    //   }),
    //   credentials: rds.Credentials.fromSecret(rdsClusterSecret),
    //   serverlessV2MaxCapacity: 1,
    //   serverlessV2MinCapacity: 0.5,
    //   writer: ClusterInstance.serverlessV2("writer"),
      
    //   port: 5432,
    // });

    const databaseInstance = new rds.DatabaseInstance(this, "rds-instance", {
      vpc,
      instanceIdentifier: instanceProps.instanceIdentifier,
      credentials: rds.Credentials.fromSecret(rdsInstanceSecret),
      engine: rds.DatabaseInstanceEngine.POSTGRES,
      instanceType: new ec2.InstanceType(instanceProps.instanceType),
      allocatedStorage: instanceProps.allocatedStorage,
    });


    databaseInstance.connections.allowDefaultPortFrom(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      "allow postgres access from the VPC"
    );
  }
}
