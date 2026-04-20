import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [/^http:\/\/localhost(:\d+)?$/, /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Very simple in-memory rate limiting (per-process, per-IP).
  const WINDOW_MS = 60_000;
  const MAX_REQUESTS = 120;
  const buckets = new Map<string, { count: number; resetAt: number }>();

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use((req: any, res: any, next: () => void) => {
    const ip =
      req.ip ||
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      'unknown';
    const now = Date.now();
    const bucket = buckets.get(ip) ?? { count: 0, resetAt: now + WINDOW_MS };
    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + WINDOW_MS;
    }
    bucket.count += 1;
    buckets.set(ip, bucket);

    if (bucket.count > MAX_REQUESTS) {
      res.status(429).json({ message: 'Too many requests, please slow down.' });
      return;
    }

    next();
  });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Tracebud API')
    .setDescription('Tracebud backend API (NestJS + Drizzle + PostGIS + Supabase)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  console.log(`Tracebud API listening on http://localhost:${port}/api (docs: /api/docs)`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

