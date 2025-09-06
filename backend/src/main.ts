import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const PORT = process.env.PORT || 5000;

  console.log(`Starting the application on ${PORT}...`);

  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend communication
  // Temporarily allow all origins for MVP testing
  app.enableCors({
    origin: true, // Allow all origins temporarily for MVP testing
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-bypass-auth',
      'x-bypass-user',
      'x-tenant-id',
    ],
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
