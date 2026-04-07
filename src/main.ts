import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for Stripe webhooks
  });

  // CORS - allow the frontend origin (set FRONTEND_URL in env when deploying).
  // Default is the production frontend host. For local development we also allow common
  // localhost origins (vite dev server on :8080 and backend on :3000). If you need to
  // allow any origin during debugging, set ALLOW_ALL_ORIGINS=true in your env.
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'https://jazacv-frontend.onrender.com',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // `origin` is undefined for non-browser requests (curl/postman/server-side).
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (process.env.ALLOW_ALL_ORIGINS === 'true') return callback(null, true);
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  });

  // Body parser for file uploads
  app.use(json({
    limit: '10mb',
    verify: (req: any, res: any, buf: Buffer) => {
      req.rawBody = buf;
    }
  }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());


  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('JazaCV API')
    .setDescription('AI-powered Resume Builder API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Serve Swagger at /docs
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/docs`);
}
bootstrap();
