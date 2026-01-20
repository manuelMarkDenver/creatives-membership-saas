import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as https from 'https';
async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = process.env.PORT || 5000;
  console.log(`Starting the application on ${PORT}...`);
  const app = await NestFactory.create(AppModule);
  // Enable CORS
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-bypass-auth',
      'x-bypass-user',
      'x-tenant-id',
      'x-user-email',
    ],
    credentials: true,
  });
  // Set global API prefix
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

   await app.init();

   // Railway handles SSL, so always use HTTP
   await app.listen(PORT);
   console.log(`Server listening on port ${PORT}`);
}
void bootstrap();
