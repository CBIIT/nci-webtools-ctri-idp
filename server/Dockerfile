FROM public.ecr.aws/amazonlinux/amazonlinux:2023

RUN dnf -y update \
    && dnf -y install curl-minimal \
    && curl -fsSL https://rpm.nodesource.com/setup_22.x | bash \
    && dnf -y install nodejs \
    && dnf clean all

RUN mkdir -p /server

WORKDIR /server

# use build cache for npm packages
COPY server/package.json server/package-lock.json /server/

RUN npm install

COPY server /server

RUN touch /server/.env

CMD ["npm", "start"]
