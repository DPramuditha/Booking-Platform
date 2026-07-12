import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend integration
  app.enableCors();

  // Enable global validation pipe with automatic transformations
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configure Swagger API documentation builder
  const config = new DocumentBuilder()
    .setTitle('EN2H Booking Platform REST API')
    .setDescription('Backend REST API for services and customer bookings')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // Custom CSS injection to theme the Swagger UI with the brand color #d57e1e
  const customCss = `
    .swagger-ui .topbar { background-color: #d57e1e; border-bottom: 2px solid #b56512; }
    .swagger-ui .info .title { color: #d57e1e; }
    .swagger-ui .opblock.opblock-post { background: rgba(213, 126, 30, 0.05); border-color: #d57e1e; }
    .swagger-ui .opblock.opblock-post .opblock-summary-method { background-color: #d57e1e; }
    .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #d57e1e; }
    .swagger-ui .opblock.opblock-put { background: rgba(213, 126, 30, 0.03); border-color: #d57e1e; }
    .swagger-ui .opblock.opblock-put .opblock-summary-method { background-color: #d57e1e; }
    .swagger-ui .btn.execute { background-color: #d57e1e; border-color: #d57e1e; color: white; }
    .swagger-ui .btn.execute:hover { background-color: #b56512; border-color: #b56512; }
    .swagger-ui .model-box { border-left: 3px solid #d57e1e; }
  `;

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customCss,
    customSiteTitle: 'EN2H Booking API Docs',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation is available at: http://localhost:${port}/api/docs`);
}
bootstrap();
