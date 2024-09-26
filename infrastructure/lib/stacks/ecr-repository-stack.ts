import { StackProps, Stack, Duration, aws_ecr as ecr } from "aws-cdk-lib";
import { Construct } from "constructs";

export interface EcrRepositoryStackProps extends StackProps {
  repositoryName: string;
}

export class EcrRepositoryStack extends Stack {
  constructor(scope: Construct, id: string, props: EcrRepositoryStackProps) {
    super(scope, id, props);

    const repository = new ecr.Repository(this, "ecr-repository", {
      repositoryName: props.repositoryName,
      imageScanOnPush: true,
      lifecycleRules: [
        {
          maxImageAge: Duration.days(10),
          tagStatus: ecr.TagStatus.UNTAGGED,
        },
      ]
    });
  }
}
