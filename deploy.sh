#!/bin/bash
set -ex

pushd infrastructure
npm install

# todo: remove hosted zone
cdk deploy ctri-idp-$TIER-route53-hosted-zone --require-approval never
cdk deploy ctri-idp-$TIER-ecr-repository --require-approval never

export ECR_REGISTRY=${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com
export ECR_REPOSITORY=ctri-idp-$TIER

export CLIENT_IMAGE=$ECR_REGISTRY/$ECR_REPOSITORY:client-$GITHUB_SHA
export SERVER_IMAGE=$ECR_REGISTRY/$ECR_REPOSITORY:server-$GITHUB_SHA

export CLIENT_IMAGE_LATEST=$ECR_REGISTRY/$ECR_REPOSITORY:ui-latest
export SERVER_IMAGE_LATEST=$ECR_REGISTRY/$ECR_REPOSITORY:api-latest

aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

docker build -t $CLIENT_IMAGE -t $CLIENT_IMAGE_LATEST -f client/Dockerfile .
docker push $CLIENT_IMAGE 
docker push $CLIENT_IMAGE_LATEST

docker build -t $SERVER_IMAGE -t $SERVER_IMAGE_LATEST -f server/Dockerfile .
docker push $SERVER_IMAGE 
docker push $SERVER_IMAGE_LATEST

cdk deploy ctri-idp-$TIER-ecs-service --require-approval never