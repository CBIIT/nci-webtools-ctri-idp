#!/bin/bash
set -ex

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

pushd cdk
npm install
cdk deploy $STACK_NAME --require-approval never