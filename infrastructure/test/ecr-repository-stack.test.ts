import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { EcrRepositoryStack, EcrRepositoryStackProps } from "../lib/stacks/ecr-repository-stack";
import config from "../config";

test("ECR repository created", () => {
  const app = new App();
  const env = config.env;
  const props: EcrRepositoryStackProps = { env, repositoryName: "ecr-repository" };
  const stack = new EcrRepositoryStack(app, "EcrRepositoryStack", props);
  const template = Template.fromStack(stack);
  template.hasResourceProperties("AWS::ECR::Repository", {
    RepositoryName: props.repositoryName,
  });
});
