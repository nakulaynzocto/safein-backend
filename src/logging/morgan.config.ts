import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

// Create logs directory
const logDir = path.join(process.cwd(), 'logs');

// Function to ensure log directory exists
const ensureLogDirectory = () => {
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
        console.log(`📁 Created logs directory: ${logDir}`);
    }
};

// Ensure directory exists before creating streams
ensureLogDirectory();

// Create write streams for different log files with error handling
let accessLogStream: fs.WriteStream;
let errorLogStream: fs.WriteStream;

try {
    accessLogStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });
    errorLogStream = fs.createWriteStream(path.join(logDir, 'error.log'), { flags: 'a' });
} catch (error) {
    console.error('Failed to create log streams:', error);
    // Fallback to console logging
    accessLogStream = process.stdout as any;
    errorLogStream = process.stderr as any;
}

// Custom token for request ID
morgan.token('reqId', (req: any) => req.requestId || 'unknown');

// Custom token for response time in milliseconds
morgan.token('responseTime', (_req: any, res: any) => {
    const responseTime = res.get('X-Response-Time');
    return responseTime ? `${responseTime}ms` : 'unknown';
});

// Development format - more detailed and colorful
export const devFormat = ':method :url :status :response-time ms - :res[content-length] - :reqId';

// Production format - more concise and structured
export const combinedFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms :reqId';

// Custom format for API requests
export const apiFormat = ':method :url :status :response-time ms - :res[content-length] - :user-agent - :reqId';

// Skip logging for health checks and static files
export const skipFunction = (req: any, _res: any) => {
    // Skip logging for health check endpoints
    if (req.url === '/health' || req.url === '/ping') {
        return true;
    }

    // Skip logging for static files in production
    if (process.env.NODE_ENV === 'production' &&
        (req.url.startsWith('/static/') || req.url.includes('.'))) {
        return true;
    }

    return false;
};

// Morgan configuration options for console logging
export const morganOptions = {
    skip: skipFunction,
    stream: {
        write: (message: string) => {
            // In production, you might want to send logs to a logging service
            console.log(message.trim());
        }
    }
};

// Morgan configuration options for file logging
export const morganFileOptions = {
    skip: skipFunction,
    stream: accessLogStream
};

// Morgan configuration for error logging
export const morganErrorOptions = {
    skip: (_req: any, res: any) => {
        // Only log errors (4xx and 5xx status codes)
        return res.statusCode < 400;
    },
    stream: errorLogStream
};

// Custom format for error logging
export const errorFormat = ':remote-addr - [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms :reqId - ERROR';

// Export streams for cleanup if needed
export { accessLogStream, errorLogStream };
