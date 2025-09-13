import morgan from 'morgan';

// Custom token for request ID (if needed)
morgan.token('reqId', (req: any) => req.id || 'unknown');

// Custom token for response time in milliseconds
morgan.token('responseTime', (_req: any, res: any) => {
    const responseTime = res.get('X-Response-Time');
    return responseTime ? `${responseTime}ms` : 'unknown';
});

// Development format - more detailed and colorful
export const devFormat = ':method :url :status :response-time ms - :res[content-length]';

// Production format - more concise and structured
export const combinedFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Custom format for API requests
export const apiFormat = ':method :url :status :response-time ms - :res[content-length] - :user-agent';

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

// Morgan configuration options
export const morganOptions = {
    skip: skipFunction,
    stream: {
        write: (message: string) => {
            // In production, you might want to send logs to a logging service
            console.log(message.trim());
        }
    }
};
