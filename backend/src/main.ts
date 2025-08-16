import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const PORT = process.env.PORT || 5000;

  console.log(`Starting the application on ${PORT}...`);

  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend communication
  const corsOrigins = process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL || 'https://creatives-saas-frontend.vercel.app',
        'https://frontend-2q1gglz7b-manuelmarkdenvers-projects.vercel.app',
        'https://creatives-membership-saas.vercel.app'
      ]
    : true; // Allow all origins in development

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-bypass-auth', 'x-tenant-id'],
    credentials: true,
  });

  // Set global API prefix with versioning
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw if unknown props sent
      transform: true, // Auto-transform query params to correct types
    }),
  );

  await app.listen(PORT);
}
void bootstrap();
