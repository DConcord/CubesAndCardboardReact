# CubesAndCardboard React Components

## Init

Latest version of Node.JS recommended

npm install

## Local dev webserver

run a local webserver on http://localhost:8080

npm run dev

## Build and Deploy to S3

npm run build  
aws sso login

npx s3-spa-upload dist cdkstack-bucket83908e77-7tr0zgs93uwh
