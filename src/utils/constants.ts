const CONSTANTS = {
    // Server & Auth
    PORT: process.env.PORT || 4010,
    NODE_ENV: process.env.NODE_ENV || "development",
    JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
    JWT_EXPIRATION: process.env.JWT_EXPIRATION || "1d",
    MASTER_TOKEN: process.env.MASTER_TOKEN || "dev-master-token-123",

    // URLs
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
    FRONTEND_URLS: (process.env.FRONTEND_URLS ?? "http://localhost:3000,http://localhost:3001").split(","),
    APPROVAL_LINK_BASE_URL: process.env.APPROVAL_LINK_BASE_URL || process.env.FRONTEND_URL || "http://localhost:3000",

    // Database
    MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/visitor-app",
    REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

    // Email Configuration
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    SMTP_SECURE: process.env.SMTP_SECURE === "true",
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || "SafeIn Security Management",
    SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || "no-reply@safein.app",
    SKIP_SMTP_VERIFY: process.env.SKIP_SMTP_VERIFY === "true",

    // Cloudinary Configuration
    ...getCloudinaryConfig(),
};

function getCloudinaryConfig() {
    const rawName = process.env.CLOUDINARY_CLOUD_NAME || "";
    const rawUrl = process.env.CLOUDINARY_URL || "";

    // Check if CLOUDINARY_CLOUD_NAME is actually a URL
    if (rawName.startsWith("cloudinary://")) {
        const match = rawName.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
        if (match && match.length >= 4) {
            return {
                CLOUDINARY_CLOUD_NAME: match[3],
                CLOUDINARY_API_KEY: match[1],
                CLOUDINARY_API_SECRET: match[2],
                CLOUDINARY_URL: rawName,
            };
        }
    }

    // Check if CLOUDINARY_URL is set and valid
    if (rawUrl.startsWith("cloudinary://")) {
        const match = rawUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
        if (match && match.length >= 4) {
            return {
                CLOUDINARY_CLOUD_NAME: match[3],
                CLOUDINARY_API_KEY: match[1],
                CLOUDINARY_API_SECRET: match[2],
                CLOUDINARY_URL: rawUrl,
            };
        }
    }

    return {
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
        CLOUDINARY_URL: process.env.CLOUDINARY_URL,
    };
}

const ERROR_MESSAGES = {
    USER_ALREADY_EXISTS: "User already exists with this email",
    EMAIL_ALREADY_IN_USE: "Email is already in use",
    INVALID_CREDENTIALS: "Invalid credentials",
    INVALID_TOKEN: "Invalid token",
    TOKEN_EXPIRED: "Token expired",
    TOKEN_NOT_FOUND: "Token not found",
    USER_NOT_FOUND: "User not found",
    COMPANY_NOT_FOUND: "Company not found",
    COMPANY_CODE_EXISTS: "Company code already exists",
    PASSWORD_MISMATCH: "Current password is incorrect",
    EMAIL_NOT_VERIFIED: "Email not verified",
    ACCOUNT_DISABLED: "Account is disabled",
    EMPLOYEE_NOT_FOUND: "Employee not found",
    EMPLOYEE_EMAIL_EXISTS: "Employee email already exists",
    EMPLOYEE_ALREADY_DELETED: "Employee is already deleted",
    EMPLOYEE_NOT_DELETED: "Employee is not deleted",
    NO_UPDATE_DATA: "No update data provided",
    NO_EMPLOYEES_FOUND: "No employees found for bulk update",
    VISITOR_NOT_FOUND: "Visitor not found",
    VISITOR_EMAIL_EXISTS: "Visitor email already exists",
    VISITOR_ALREADY_DELETED: "Visitor is already deleted",
    VISITOR_NOT_DELETED: "Visitor is not deleted",
    NO_VISITORS_FOUND: "No visitors found for bulk update",
};

const ERROR_CODES = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    PAYMENT_REQUIRED: 402,
    INTERNAL_SERVER_ERROR: 500,
    TOO_MANY_REQUESTS: 429,
};

export { CONSTANTS, ERROR_MESSAGES, ERROR_CODES };
