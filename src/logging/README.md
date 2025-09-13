# Logging System

This directory contains a comprehensive logging system for the API that logs all requests, responses, and errors to files.

## Files Structure

```
src/logging/
├── index.ts           # Main exports
├── logger.ts          # Core logger utility
├── requestLogger.ts   # Request/response logging middleware
├── morgan.config.ts   # Morgan HTTP logger configuration
└── README.md         # This file
```

## Log Files

The system creates the following log files in the `logs/` directory:

- **`api.log`** - Complete API logs with request/response payloads
- **`access.log`** - HTTP access logs (Morgan format)
- **`error.log`** - Error logs only

## Features

### 1. Request/Response Logging

- Logs all HTTP requests with full payloads
- Logs all HTTP responses with full data
- Generates unique request IDs for tracking
- Measures response times
- Sanitizes sensitive data (passwords, tokens, etc.)

### 2. Error Logging

- Logs all errors with stack traces
- Includes request context for debugging
- Separate error log file for easy monitoring

### 3. Morgan HTTP Logging

- Standard HTTP access logs
- Different formats for development/production
- File and console logging
- Request ID tracking

## Usage

The logging system is automatically integrated into the Express app. No additional configuration needed.

### Log Entry Format

```json
{
  "timestamp": "2025-09-11T19:30:15.123Z",
  "level": "INFO",
  "method": "POST",
  "url": "/api/v1/users/login",
  "statusCode": 200,
  "requestId": "abc123def456",
  "userAgent": "curl/7.68.0",
  "ip": "127.0.0.1",
  "requestPayload": {
    "body": {
      "email": "test@example.com",
      "password": "[REDACTED]"
    },
    "query": {},
    "params": {},
    "headers": {
      "user-agent": "curl/7.68.0",
      "content-type": "application/json",
      "authorization": "[REDACTED]"
    }
  },
  "responsePayload": {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": { ... },
      "token": "[REDACTED]"
    }
  },
  "responseTime": "45.123"
}
```

## Security Features

- **Sensitive Data Sanitization**: Automatically redacts passwords, tokens, and other sensitive fields
- **IP Address Logging**: Tracks client IP addresses for security monitoring
- **Request ID Tracking**: Unique IDs for tracing requests across logs

## Environment Configuration

- **Development**: More verbose logging with console output
- **Production**: Structured logging optimized for log aggregation systems

## Log Rotation

For production use, consider implementing log rotation using tools like:

- `logrotate` (Linux)
- `winston` with daily rotation
- External logging services (ELK stack, etc.)

## Monitoring

The logs can be monitored using:

- `tail -f logs/api.log` - Real-time API logs
- `tail -f logs/error.log` - Real-time error logs
- `grep "ERROR" logs/api.log` - Filter error entries
- `grep "POST /api/v1/users/login" logs/api.log` - Filter specific endpoints
