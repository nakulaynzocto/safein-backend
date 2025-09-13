import fs from 'fs';
import path from 'path';

export class LogRotation {
    private logDir: string;
    private maxFileSize: number; // in bytes
    private maxFiles: number;

    constructor(logDir: string = 'logs', maxFileSize: number = 10 * 1024 * 1024, maxFiles: number = 5) {
        this.logDir = logDir;
        this.maxFileSize = maxFileSize; // 10MB default
        this.maxFiles = maxFiles; // Keep 5 files max
    }

    /**
     * Check if log rotation is needed and perform rotation
     */
    public checkAndRotate(logFile: string): void {
        try {
            if (!fs.existsSync(logFile)) {
                return;
            }

            const stats = fs.statSync(logFile);
            if (stats.size > this.maxFileSize) {
                this.rotateLog(logFile);
            }
        } catch (error) {
            console.error('Error checking log rotation:', error);
        }
    }

    /**
     * Rotate log file
     */
    private rotateLog(logFile: string): void {
        try {
            const baseName = path.basename(logFile, '.log');
            const dirName = path.dirname(logFile);

            // Remove oldest file if we have reached max files
            const oldestFile = path.join(dirName, `${baseName}.${this.maxFiles - 1}.log`);
            if (fs.existsSync(oldestFile)) {
                fs.unlinkSync(oldestFile);
            }

            // Shift existing files
            for (let i = this.maxFiles - 2; i >= 0; i--) {
                const currentFile = path.join(dirName, `${baseName}.${i}.log`);
                const nextFile = path.join(dirName, `${baseName}.${i + 1}.log`);

                if (fs.existsSync(currentFile)) {
                    fs.renameSync(currentFile, nextFile);
                }
            }

            // Move current log to .0.log
            const rotatedFile = path.join(dirName, `${baseName}.0.log`);
            fs.renameSync(logFile, rotatedFile);

            console.log(`Log rotated: ${logFile} -> ${rotatedFile}`);
        } catch (error) {
            console.error('Error rotating log file:', error);
        }
    }

    /**
     * Clean old log files
     */
    public cleanOldLogs(): void {
        try {
            if (!fs.existsSync(this.logDir)) {
                return;
            }

            const files = fs.readdirSync(this.logDir);
            const logFiles = files.filter(file => file.endsWith('.log'));

            for (const file of logFiles) {
                const filePath = path.join(this.logDir, file);
                const stats = fs.statSync(filePath);
                const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

                // Delete files older than 30 days
                if (ageInDays > 30) {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted old log file: ${file}`);
                }
            }
        } catch (error) {
            console.error('Error cleaning old logs:', error);
        }
    }

    /**
     * Get log file size in MB
     */
    public getLogFileSize(logFile: string): number {
        try {
            if (!fs.existsSync(logFile)) {
                return 0;
            }

            const stats = fs.statSync(logFile);
            return stats.size / (1024 * 1024); // Convert to MB
        } catch (error) {
            console.error('Error getting log file size:', error);
            return 0;
        }
    }

    /**
     * Get log file info
     */
    public getLogInfo(): { [key: string]: any } {
        const logFiles = ['api.log', 'access.log', 'error.log'];
        const info: { [key: string]: any } = {};

        for (const logFile of logFiles) {
            const filePath = path.join(this.logDir, logFile);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                info[logFile] = {
                    size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
                    lastModified: stats.mtime.toISOString(),
                    needsRotation: stats.size > this.maxFileSize
                };
            }
        }

        return info;
    }
}

export const logRotation = new LogRotation();
