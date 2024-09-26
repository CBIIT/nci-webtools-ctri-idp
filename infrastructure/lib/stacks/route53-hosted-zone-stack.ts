import { StackProps, Stack, aws_route53 as route53 } from "aws-cdk-lib";
import { Construct } from "constructs";

export interface Route53HostedZoneStackProps extends StackProps {
  domainName: string;
}

export class Route53HostedZoneStack extends Stack {
  constructor(scope: Construct, id: string, props: Route53HostedZoneStackProps) {
    super(scope, id, props);

    new route53.PublicHostedZone(this, "hosted-zone", {
      zoneName: props.domainName,
    });
  }
}