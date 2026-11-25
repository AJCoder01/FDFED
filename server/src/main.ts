import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173'],
    credentials: true,
  });

  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
  console.log(`[ServiceHub API] Running on http://localhost:${port}/api`);
}

bootstrap();
