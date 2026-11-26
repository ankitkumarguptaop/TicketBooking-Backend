import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { relaxConnectAttemptTimeout } from './database/typeorm-options';

relaxConnectAttemptTimeout();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // The web app runs on another origin (another port in dev), so the browser
  // needs CORS with credentials to send the httpOnly auth cookies.
  // Origin must be an exact URL: browsers reject "*" when credentials are on.
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
