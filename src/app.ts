import 'dotenv/config';

import express, { Express } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import morgan from 'morgan';
import hpp from 'hpp';
import swaggerUi from 'swagger-ui-express';
import { connectDatabase } from './config/database.config';
import { connectRedis } from './config/redis.config';
import { notFoundHandler, errorHandler } from './middlewares';
import {
  generalLimiter,
  securityHeaders,
  customSecurityHeaders,
  inputSanitization,
  securityLogger
} from './middlewares/security';
import { requestLogger, errorLogger } from './logging';
import { devFormat, combinedFormat, morganOptions, morganFileOptions, morganErrorOptions, errorFormat } from './logging';
import routes from './routes';
import { swaggerSpec } from './docs/swagger';
import { CONSTANTS } from './utils/constants';
import { EmailService } from './services/email/email.service';
import { webhookRouter } from './routes/userSubscription/userSubscription.routes';
import { socketService } from './services/socket/socket.service';
import superAdminRoutes from './routes/internal/superAdmin.routes';

const app: Express = express();
// Trust proxy (required for correct IP detection behind proxies/load balancers)
app.set('trust proxy', 1);
const httpServer = createServer(app);

// Initialize Socket.IO
socketService.initialize(httpServer);

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

// Enhanced Security Headers
app.use(securityHeaders);
app.use(customSecurityHeaders);

app.use(cors({
  origin: CONSTANTS.FRONTEND_URLS,
  credentials: true
}));

app.use(requestLogger);

// Security Logging
app.use(securityLogger);

// Input Sanitization (protects against NoSQL injection, XSS, etc.)
app.use(inputSanitization);

if (CONSTANTS.NODE_ENV === 'development') {
  app.use(morgan(devFormat, morganOptions));
  app.use(morgan(devFormat, morganFileOptions));
} else {
  app.use(morgan(combinedFormat, morganOptions));
  app.use(morgan(combinedFormat, morganFileOptions));
}

app.use(morgan(errorFormat, morganErrorOptions));

app.use(generalLimiter);

// Webhook route must be registered BEFORE express.json() to capture raw body
// This allows us to verify the webhook signature using the raw request body
app.use('/api/v1/user-subscriptions', webhookRouter);

// Request size limits (security best practice)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Prevent HTTP Parameter Pollution (HPP)
app.use(hpp());

app.use('/internal/super-admin', superAdminRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// All API routes are registered through the main routes index
app.use('/api/v1', routes);

app.use(errorLogger);
app.use(errorHandler);
app.use(notFoundHandler);

const PORT = CONSTANTS.PORT;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (${CONSTANTS.NODE_ENV})`);
});

export default app;
export { httpServer };
