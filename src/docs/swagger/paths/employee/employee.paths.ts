export const employeePaths = {
    '/api/v1/employees': {
        post: {
            tags: ['Employee'],
            summary: 'Create a new employee',
            description: 'Create a new employee with all required information',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/CreateEmployee'
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'Employee created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Employee created successfully' },
                                    data: { $ref: '#/components/schemas/Employee' },
                                    statusCode: { type: 'number', example: 201 }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad request - validation error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized - invalid or missing token',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                },
                409: {
                    description: 'Conflict - employee ID or email already exists',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                }
            }
        },
        get: {
            tags: ['Employee'],
            summary: 'Get all employees',
            description: 'Retrieve a paginated list of employees with filtering and sorting options',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'page',
                    in: 'query',
                    description: 'Page number',
                    schema: { type: 'number', minimum: 1, default: 1 }
                },
                {
                    name: 'limit',
                    in: 'query',
                    description: 'Number of items per page',
                    schema: { type: 'number', minimum: 1, maximum: 100, default: 10 }
                },
                {
                    name: 'search',
                    in: 'query',
                    description: 'Search term for name, email, employeeId, department, or designation',
                    schema: { type: 'string', maxLength: 100 }
                },
                {
                    name: 'department',
                    in: 'query',
                    description: 'Filter by department',
                    schema: { type: 'string', maxLength: 50 }
                },
                {
                    name: 'status',
                    in: 'query',
                    description: 'Filter by status',
                    schema: { type: 'string', enum: ['Active', 'Inactive'] }
                },
                {
                    name: 'sortBy',
                    in: 'query',
                    description: 'Field to sort by',
                    schema: { type: 'string', enum: ['name', 'email', 'department', 'designation', 'status', 'createdAt', 'updatedAt'], default: 'createdAt' }
                },
                {
                    name: 'sortOrder',
                    in: 'query',
                    description: 'Sort order',
                    schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
                }
            ],
            responses: {
                200: {
                    description: 'Employees retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Employees retrieved successfully' },
                                    data: { $ref: '#/components/schemas/EmployeeListResponse' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized - invalid or missing token',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                }
            }
        }
    },

    '/api/v1/employees/stats': {
        get: {
            tags: ['Employee'],
            summary: 'Get employee statistics',
            description: 'Retrieve comprehensive statistics about employees',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Employee statistics retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Employee statistics retrieved successfully' },
                                    data: { $ref: '#/components/schemas/EmployeeStats' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized - invalid or missing token',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                }
            }
        }
    },

    '/api/v1/employees/trashed': {
        get: {
            tags: ['Employee'],
            summary: 'Get trashed employees',
            description: 'Retrieve a paginated list of soft-deleted employees',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'page',
                    in: 'query',
                    description: 'Page number',
                    schema: { type: 'number', minimum: 1, default: 1 }
                },
                {
                    name: 'limit',
                    in: 'query',
                    description: 'Number of items per page',
                    schema: { type: 'number', minimum: 1, maximum: 100, default: 10 }
                },
                {
                    name: 'search',
                    in: 'query',
                    description: 'Search term for name, email, employeeId, department, or designation',
                    schema: { type: 'string', maxLength: 100 }
                },
                {
                    name: 'department',
                    in: 'query',
                    description: 'Filter by department',
                    schema: { type: 'string', maxLength: 50 }
                },
                {
                    name: 'sortBy',
                    in: 'query',
                    description: 'Field to sort by',
                    schema: { type: 'string', enum: ['name', 'email', 'department', 'designation', 'deletedAt'], default: 'deletedAt' }
                },
                {
                    name: 'sortOrder',
                    in: 'query',
                    description: 'Sort order',
                    schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
                }
            ],
            responses: {
                200: {
                    description: 'Trashed employees retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Trashed employees retrieved successfully' },
                                    data: { $ref: '#/components/schemas/EmployeeListResponse' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized - invalid or missing token',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                }
            }
        }
    },

    '/api/v1/employees/bulk-update': {
        put: {
            tags: ['Employee'],
            summary: 'Bulk update employees',
            description: 'Update multiple employees at once',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/BulkUpdateEmployees'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Employees updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Employees updated successfully' },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            updatedCount: { type: 'number', example: 5 }
                                        }
                                    },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad request - validation error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized - invalid or missing token',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                },
                404: {
                    description: 'Not found - no employees found for bulk update',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                }
            }
        }
    },

    '/api/v1/employees/{id}': {
        get: {
            tags: ['Employee'],
            summary: 'Get employee by ID',
            description: 'Retrieve a specific employee by their ID',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Employee ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                }
            ],
            responses: {
                200: {
                    description: 'Employee retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Employee retrieved successfully' },
                                    data: { $ref: '#/components/schemas/Employee' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized - invalid or missing token',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                },
                404: {
                    description: 'Not found - employee not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                }
            }
        },
        put: {
            tags: ['Employee'],
            summary: 'Update employee',
            description: 'Update an existing employee',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Employee ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/UpdateEmployee'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Employee updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Employee updated successfully' },
                                    data: { $ref: '#/components/schemas/Employee' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad request - validation error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized - invalid or missing token',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                },
                404: {
                    description: 'Not found - employee not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                },
                409: {
                    description: 'Conflict - email already exists',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                }
            }
        },
        delete: {
            tags: ['Employee'],
            summary: 'Soft delete employee',
            description: 'Soft delete an employee (move to trash)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Employee ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                }
            ],
            responses: {
                200: {
                    description: 'Employee deleted successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Employee deleted successfully' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad request - employee already deleted',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized - invalid or missing token',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                },
                404: {
                    description: 'Not found - employee not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                }
            }
        }
    },

    '/api/v1/employees/{id}/status': {
        put: {
            tags: ['Employee'],
            summary: 'Update employee status',
            description: 'Update the status of an employee (Active/Inactive)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Employee ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/UpdateEmployeeStatus'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Employee status updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Employee status updated successfully' },
                                    data: { $ref: '#/components/schemas/Employee' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad request - validation error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized - invalid or missing token',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                },
                404: {
                    description: 'Not found - employee not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                }
            }
        }
    },

    '/api/v1/employees/{id}/restore': {
        put: {
            tags: ['Employee'],
            summary: 'Restore employee from trash',
            description: 'Restore a soft-deleted employee from trash',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Employee ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                }
            ],
            responses: {
                200: {
                    description: 'Employee restored successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Employee restored successfully' },
                                    data: { $ref: '#/components/schemas/Employee' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad request - employee not deleted',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized - invalid or missing token',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                },
                404: {
                    description: 'Not found - employee not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                }
            }
        }
    }
};
