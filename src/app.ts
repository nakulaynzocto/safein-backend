import dotenv from 'dotenv';
dotenv.config();

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { connectDatabase } from './config/database.config';
import { notFoundHandler, generalLimiter, errorHandler } from './middlewares';
import { requestLogger, errorLogger } from './logging';
import { devFormat, combinedFormat, morganOptions, morganFileOptions, morganErrorOptions, errorFormat } from './logging';
import routes from './routes';
import employeeRoutes from './routes/employee/employee.routes';
import { swaggerSpec } from './docs/swagger';
import { CONSTANTS } from './utils/constants';

const app: Express = express();

// Connect to MongoDB
connectDatabase();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: CONSTANTS.FRONTEND_URL,
  credentials: true
}));

// Custom request logging middleware (logs request/response payloads)
app.use(requestLogger);

// HTTP request logging with Morgan
if (CONSTANTS.NODE_ENV === 'development') {
  // Console logging for development
  app.use(morgan(devFormat, morganOptions));
  // File logging for development
  app.use(morgan(devFormat, morganFileOptions));
} else {
  // Console logging for production
  app.use(morgan(combinedFormat, morganOptions));
  // File logging for production
  app.use(morgan(combinedFormat, morganFileOptions));
}

// Error logging with Morgan
app.use(morgan(errorFormat, morganErrorOptions));

// Rate limiting
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/v1', routes);

// Employee routes without /api/v1 prefix
app.use('/employees', employeeRoutes);

// Error handling middleware (must be last)
app.use(errorLogger); // Log errors before handling them
app.use(errorHandler);
app.use(notFoundHandler);

// Start server
const PORT = CONSTANTS.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🌍 Environment: ${CONSTANTS.NODE_ENV}`);
});

export default app;
