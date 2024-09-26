import { DefaultStackSynthesizer } from "aws-cdk-lib";

const defaultStackSynthesizer = new DefaultStackSynthesizer({
  qualifier: "hnb659fds",
  fileAssetsBucketName: "cdk-${Qualifier}-assets-${AWS::AccountId}-${AWS::Region}",
  imageAssetsRepositoryName: "cdk-${Qualifier}-container-assets-${AWS::AccountId}-${AWS::Region}",
  deployRoleArn: "arn:${AWS::Partition}:iam::${AWS::AccountId}:role/power-user-cdk-${Qualifier}-deploy-role",
  fileAssetPublishingRoleArn: "arn:${AWS::Partition}:iam::${AWS::AccountId}:role/power-user-cdk-${Qualifier}-file-publishing-role",
  imageAssetPublishingRoleArn: "arn:${AWS::Partition}:iam::${AWS::AccountId}:role/power-user-cdk-${Qualifier}-image-publishing-role",
  cloudFormationExecutionRole: "arn:${AWS::Partition}:iam::${AWS::AccountId}:role/power-user-cdk-${Qualifier}-cfn-exec-role",
  lookupRoleArn: "arn:${AWS::Partition}:iam::${AWS::AccountId}:role/power-user-cdk-${Qualifier}-lookup-role",
});

export default defaultStackSynthesizer;
