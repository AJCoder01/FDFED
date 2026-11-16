const {spawnSync}=require('node:child_process');
const url=process.env.TEST_DATABASE_URL;
if(!url||!new URL(url).pathname.endsWith('_test'))throw new Error('TEST_DATABASE_URL must point to a dedicated database whose name ends in _test.');
const env={...process.env,DATABASE_URL:url,NODE_ENV:'test',DEMO_ENABLED:'true',JWT_SECRET:'integration-tests-only-secret-at-least-32-characters',UPLOAD_DIR:require('node:os').tmpdir()+'/servicehub-test-uploads'};
for(const args of [['prisma','migrate','deploy'],['jest','--runInBand','--config','test/jest-e2e.json']]){const result=spawnSync('npx',args,{env,stdio:'inherit'});if(result.status)process.exit(result.status);}
