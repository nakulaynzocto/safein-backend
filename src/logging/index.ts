// Export all logging functionality
export { logger } from './logger';
export { requestLogger, errorLogger } from './requestLogger';
export {
    devFormat,
    combinedFormat,
    apiFormat,
    morganOptions,
    morganFileOptions,
    morganErrorOptions,
    errorFormat,
    accessLogStream,
    errorLogStream
} from './morgan.config';

// Re-export types
export type { LogEntry } from './logger';
