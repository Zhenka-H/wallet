import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/exception';
import { LoggerService } from './logger/logger.s';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new GlobalExceptionFilter(app.get(LoggerService)));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await app.close();
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    await app.close();
  });
}
bootstrap();
