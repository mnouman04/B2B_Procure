import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'node:path';

import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

/**
 * Application factory — builds the Express app without binding a port, so the
 * same instance can be reused by the server and by integration tests.
 */
export const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: [env.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(compression());
  if (!env.isProd) app.use(morgan('dev'));

  app.use(
    env.apiPrefix,
    rateLimit({
      windowMs: 60 * 1000,
      max: env.isProd ? 200 : 2000,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Uploaded documents and logos.
  app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadDir)));

  app.get('/', (_req, res) =>
    res.json({
      name: 'PROCURIO — Smart B2B Procurement Platform API',
      version: '1.0.0',
      docs: `${env.apiPrefix}/health`,
    }));

  app.use(env.apiPrefix, routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
