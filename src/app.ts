import dotenv from 'dotenv';
dotenv.config();

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { connectDatabase } from './config/database.config';
import { connectRedis } from './config/redis.config';
import { notFoundHandler, generalLimiter, errorHandler } from './middlewares';
import { requestLogger, errorLogger } from './logging';
import { devFormat, combinedFormat, morganOptions, morganFileOptions, morganErrorOptions, errorFormat } from './logging';
import routes from './routes';
import { swaggerSpec } from './docs/swagger';
import { CONSTANTS } from './utils/constants';
import { EmailService } from './services/email/email.service';

const app: Express = express();

connectDatabase();

// Connect to Redis (non-blocking - will retry on failure)
connectRedis().catch((error) => {
  console.error('Redis connection failed:', error);
  console.warn('OTP functionality may not work properly without Redis');
});

EmailService.initializeTransporter();
EmailService.verifyConnection().catch((error) => {
  console.error('Email service initialization error:', error);
});

app.use(helmet({
  // Disable contentSecurityPolicy for webhook route
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: CONSTANTS.FRONTEND_URLS,
  credentials: true
}));

app.use(requestLogger);

if (CONSTANTS.NODE_ENV === 'development') {
  app.use(morgan(devFormat, morganOptions));
  app.use(morgan(devFormat, morganFileOptions));
} else {
  app.use(morgan(combinedFormat, morganOptions));
  app.use(morgan(combinedFormat, morganFileOptions));
}

app.use(morgan(errorFormat, morganErrorOptions));

app.use(generalLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// All API routes are registered through the main routes index
app.use('/api/v1', routes);

app.use(errorLogger);
app.use(errorHandler);
app.use(notFoundHandler);

const PORT = CONSTANTS.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${CONSTANTS.NODE_ENV})`);
});

export default app;
