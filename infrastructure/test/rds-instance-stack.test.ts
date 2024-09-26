import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { RdsInstanceStack, RdsInstanceStackProps } from "../lib/stacks/rds-instance-stack";
import config from "../config";

test("RDS instance created using Postgres", () => {
  const app = new App();
  const env = config.env;
  const stack = new RdsInstanceStack(app, "RdsInstanceStack", { env, ...config.rds });
  const template = Template.fromStack(stack);
  template.hasResourceProperties("AWS::RDS::DBInstance", {
    Engine: "postgres",
  });
});
