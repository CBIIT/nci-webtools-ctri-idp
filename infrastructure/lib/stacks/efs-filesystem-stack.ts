import { StackProps, Stack, aws_efs as efs, aws_ec2 as ec2 } from "aws-cdk-lib";
import { Construct } from "constructs";

export interface EfsFilesystemStackProps extends StackProps {
  vpc: string;
  subnets: string[];
  fileSystemName: string;
  accessPoints: string[];
}

export class EfsFilesystemStack extends Stack {
  constructor(scope: Construct, id: string, props: EfsFilesystemStackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, "efs-filesystem-vpc", { vpcId: props.vpc });
    const filesystem = new efs.FileSystem(this, "efs-filesystem", {
      vpc,
      fileSystemName: props.fileSystemName,
      enableAutomaticBackups: true,
      encrypted: true,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_7_DAYS,
      allowAnonymousAccess: true,
    });

    for (let i = 0; i < props.accessPoints.length; i++) {
      new efs.AccessPoint(this, `efs-access-point-${i}`, {
        fileSystem: filesystem,
        path: props.accessPoints[i],
        posixUser: {
          uid: "1000",
          gid: "1000",
        },
        createAcl: {
          ownerGid: "1000",
          ownerUid: "1000",
          permissions: "755",
        },
      });
    }

    filesystem.connections.allowDefaultPortFrom(ec2.Peer.ipv4(vpc.vpcCidrBlock), "allow NFS access from the VPC");
  }
}
