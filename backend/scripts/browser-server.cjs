require('dotenv/config');
const url=process.env.TEST_DATABASE_URL;
if(!url||!new URL(url).pathname.endsWith('_test'))throw new Error('TEST_DATABASE_URL must end in _test.');
Object.assign(process.env,{DATABASE_URL:url,NODE_ENV:'test',AUTH_RATE_LIMIT:'1000',SIGNUP_RATE_LIMIT:'1000',API_RATE_LIMIT:'5000',PORT:'3001',CORS_ORIGIN:'http://127.0.0.1:5174',DEMO_ENABLED:'true',JWT_SECRET:'browser-tests-only-secret-at-least-32-characters',UPLOAD_DIR:require('node:os').tmpdir()+'/servicehub-browser-uploads'});
const {Database}=require('../dist/src/common/database');
const {seedData,clearDemoDatabase}=require('../dist/prisma/seed-data');
const db=new Database();
db.$transaction(async tx=>{await clearDemoDatabase(tx);await seedData(tx);},{timeout:60000}).then(()=>db.$disconnect()).then(()=>require('../dist/src/main')).catch(error=>{console.error(error.message);process.exit(1);});
