import fs from 'fs';
import path from 'path';

import { CONSTANTS } from '../utils/constants';

export interface LogEntry {
    timestamp: string;
    level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG';
    type: 'REQUEST' | 'RESPONSE' | 'ERROR';
    method: string;
    url: string;
    statusCode?: number;
    requestId: string;
    userAgent?: string;
    ip?: string;
    requestPayload?: any;
    responsePayload?: any;
    responseTime?: number;
    error?: string;
    stack?: string;
    message?: string;
}

class Logger {
    private logDir: string;
    private logFile: string;
    private errorLogFile: string;
    private accessLogFile: string;

    constructor() {
        this.logDir = path.join(process.cwd(), 'logs');
        this.logFile = path.join(this.logDir, 'api.log');
        this.errorLogFile = path.join(this.logDir, 'error.log');
        this.accessLogFile = path.join(this.logDir, 'access.log');

        this.ensureLogDirectory();
    }

    private ensureLogDirectory(): void {
        try {
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
                console.log(`📁 Created logs directory: ${this.logDir}`);
            }
        } catch (error) {
            console.error('Failed to create logs directory:', error);
            this.logDir = process.cwd();
            this.logFile = path.join(this.logDir, 'api.log');
            this.errorLogFile = path.join(this.logDir, 'error.log');
            this.accessLogFile = path.join(this.logDir, 'access.log');
        }
    }

    private formatLogEntry(entry: LogEntry): string {
        const logData: any = {
            timestamp: entry.timestamp,
            level: entry.level,
            type: entry.type,
            method: entry.method,
            url: entry.url,
            requestId: entry.requestId,
            ip: entry.ip,
            userAgent: entry.userAgent
        };

        if (entry.type === 'REQUEST') {
            logData.requestPayload = entry.requestPayload;
        } else if (entry.type === 'RESPONSE') {
            logData.statusCode = entry.statusCode;
            logData.responsePayload = entry.responsePayload;
            logData.responseTime = entry.responseTime ? `${entry.responseTime}ms` : undefined;
        } else if (entry.type === 'ERROR') {
            logData.statusCode = entry.statusCode;
            logData.error = entry.error;
            logData.message = entry.message;
            logData.responseTime = entry.responseTime ? `${entry.responseTime}ms` : undefined;
            if (CONSTANTS.NODE_ENV === 'development') {
                logData.stack = entry.stack;
            }
        }

        return JSON.stringify(logData);
    }

    private writeToFile(filename: string, message: string): void {
        try {
            const dir = path.dirname(filename);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Recreated logs directory: ${dir}`);
            }

            fs.appendFileSync(filename, message + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
            console.log('LOG:', message);
        }
    }

    public logRequest(entry: Omit<LogEntry, 'level' | 'timestamp'>): void {
        const logEntry: LogEntry = {
            ...entry,
            level: 'INFO',
            timestamp: new Date().toISOString()
        };

        const message = this.formatLogEntry(logEntry);
        this.writeToFile(this.logFile, message);
        this.writeToFile(this.accessLogFile, message);
    }

    public logResponse(entry: Omit<LogEntry, 'level' | 'timestamp'>): void {
        const logEntry: LogEntry = {
            ...entry,
            level: 'INFO',
            timestamp: new Date().toISOString()
        };

        const message = this.formatLogEntry(logEntry);
        this.writeToFile(this.logFile, message);
        this.writeToFile(this.accessLogFile, message);
    }

    public logError(entry: Omit<LogEntry, 'level' | 'timestamp'>): void {
        const logEntry: LogEntry = {
            ...entry,
            level: 'ERROR',
            timestamp: new Date().toISOString()
        };

        const message = this.formatLogEntry(logEntry);
        this.writeToFile(this.errorLogFile, message);
        this.writeToFile(this.logFile, message); // Also write to main log
    }

    public logWarning(entry: Omit<LogEntry, 'level' | 'timestamp'>): void {
        const logEntry: LogEntry = {
            ...entry,
            level: 'WARN',
            timestamp: new Date().toISOString()
        };

        const message = this.formatLogEntry(logEntry);
        this.writeToFile(this.logFile, message);
    }

    public logDebug(entry: Omit<LogEntry, 'level' | 'timestamp'>): void {
        if (CONSTANTS.NODE_ENV === 'development') {
            const logEntry: LogEntry = {
                ...entry,
                level: 'DEBUG',
                timestamp: new Date().toISOString()
            };

            const message = this.formatLogEntry(logEntry);
            this.writeToFile(this.logFile, message);
        }
    }

    public sanitizePayload(payload: any, visited = new WeakSet()): any {
        if (!payload || typeof payload !== 'object') {
            return payload;
        }

        if (visited.has(payload)) {
            return '[Circular Reference]';
        }
        visited.add(payload);

        const sensitiveFields = ['password', 'token', 'authorization', 'secret', 'key', 'jwt'];
        const sanitized = { ...payload };

        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }

        for (const key in sanitized) {
            if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
                sanitized[key] = this.sanitizePayload(sanitized[key], visited);
            }
        }

        return sanitized;
    }

    public getLogPaths() {
        return {
            apiLog: this.logFile,
            errorLog: this.errorLogFile,
            accessLog: this.accessLogFile,
            logDir: this.logDir
        };
    }

    public generateRequestId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

export const logger = new Logger();
