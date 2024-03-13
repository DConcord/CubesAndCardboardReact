# CubesAndCardboard React Components

## Init

Latest version of Node.JS recommended

npm install

## Local dev webserver

run a local webserver on http://localhost:8080

npm run dev

Toggle VITE_API_URL in ./src/env/.env.development

## Build and Deploy to S3

aws sso login

### PROD

npm run deploy-prod

OR

npm run build

npx s3-spa-upload dist cdkstack-bucket83908e77-7tr0zgs93uwh

### DEV

npm run deploy-dev

OR

npm run build -- --mode development

npx s3-spa-upload dist cdkstack-bucketdevff8a9acd-pine3ubqpres
