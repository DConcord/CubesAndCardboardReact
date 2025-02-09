# CubesAndCardboard React Components

## Init

Latest version of Node.JS recommended

npm install

## Local dev webserver

run a local webserver on http://localhost:8080

npm run dev

npm run test

npm run sandbox

Toggle VITE_API_URL in ./src/env/.env.development

## Build and Deploy to S3

aws sso login

### PROD

npm run deploy-prod

OR

npm run build

npx s3-spa-upload dist cnc-game-knights-frontend-prod

### DEV

npm run deploy-dev

OR

npm run build -- --mode development

npx s3-spa-upload dist cnc-game-knights-frontend-dev

### Sandbox

npm run deploy-sandbox
