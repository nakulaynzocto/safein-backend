const CONSTANTS = {
    JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
    JWT_EXPIRATION: process.env.JWT_EXPIRATION || "1d",
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || "development",
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
};

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
    COMPANY_EMAIL_EXISTS: "Company email already exists",
    PASSWORD_MISMATCH: "Current password is incorrect",
    EMAIL_NOT_VERIFIED: "Email not verified",
    ACCOUNT_DISABLED: "Account is disabled",
    // Employee error messages
    EMPLOYEE_NOT_FOUND: "Employee not found",
    EMPLOYEE_ID_EXISTS: "Employee ID already exists",
    EMPLOYEE_EMAIL_EXISTS: "Employee email already exists",
    EMPLOYEE_ALREADY_DELETED: "Employee is already deleted",
    EMPLOYEE_NOT_DELETED: "Employee is not deleted",
    NO_UPDATE_DATA: "No update data provided",
    NO_EMPLOYEES_FOUND: "No employees found for bulk update",
    // Visitor error messages
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
    INTERNAL_SERVER_ERROR: 500,
    TOO_MANY_REQUESTS: 429,
};

export { CONSTANTS, ERROR_MESSAGES, ERROR_CODES };
