export const employeeSchemas = {
    Employee: {
        type: 'object',
        properties: {
            _id: {
                type: 'string',
                description: 'Employee unique identifier',
                example: '507f1f77bcf86cd799439011'
            },
            employeeId: {
                type: 'string',
                description: 'Employee ID',
                example: 'EMP001'
            },
            name: {
                type: 'string',
                description: 'Employee full name',
                example: 'John Doe'
            },
            email: {
                type: 'string',
                format: 'email',
                description: 'Employee email address',
                example: 'john.doe@company.com'
            },
            phone: {
                type: 'string',
                description: 'Employee phone number',
                example: '+1234567890'
            },
            whatsapp: {
                type: 'string',
                description: 'Employee WhatsApp number',
                example: '+1234567890'
            },
            department: {
                type: 'string',
                description: 'Employee department',
                example: 'Engineering'
            },
            designation: {
                type: 'string',
                description: 'Employee designation',
                example: 'Senior Developer'
            },
            role: {
                type: 'string',
                description: 'Employee role/responsibility',
                example: 'Full Stack Development'
            },
            officeLocation: {
                type: 'string',
                description: 'Office location',
                example: 'New York Office'
            },
            status: {
                type: 'string',
                enum: ['Active', 'Inactive'],
                description: 'Employee status',
                example: 'Active'
            },
            createdBy: {
                type: 'string',
                description: 'User ID who created the employee',
                example: '507f1f77bcf86cd799439011'
            },
            isDeleted: {
                type: 'boolean',
                description: 'Whether employee is soft deleted',
                example: false
            },
            deletedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Deletion timestamp',
                example: null
            },
            deletedBy: {
                type: 'string',
                description: 'User ID who deleted the employee',
                example: null
            },
            createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Creation timestamp',
                example: '2023-01-01T00:00:00.000Z'
            },
            updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Last update timestamp',
                example: '2023-01-01T00:00:00.000Z'
            }
        },
        required: ['_id', 'employeeId', 'name', 'email', 'phone', 'department', 'designation', 'role', 'officeLocation', 'status', 'isDeleted', 'createdAt', 'updatedAt']
    },

    CreateEmployee: {
        type: 'object',
        properties: {
            employeeId: {
                type: 'string',
                description: 'Employee ID',
                example: 'EMP001',
                minLength: 2,
                maxLength: 20,
                pattern: '^[A-Z0-9]+$'
            },
            name: {
                type: 'string',
                description: 'Employee full name',
                example: 'John Doe',
                minLength: 2,
                maxLength: 100
            },
            email: {
                type: 'string',
                format: 'email',
                description: 'Employee email address',
                example: 'john.doe@company.com'
            },
            phone: {
                type: 'string',
                description: 'Employee phone number',
                example: '+1234567890',
                pattern: '^[\\+]?[1-9][\\d]{0,15}$'
            },
            whatsapp: {
                type: 'string',
                description: 'Employee WhatsApp number',
                example: '+1234567890',
                pattern: '^[\\+]?[1-9][\\d]{0,15}$'
            },
            department: {
                type: 'string',
                description: 'Employee department',
                example: 'Engineering',
                minLength: 2,
                maxLength: 50
            },
            designation: {
                type: 'string',
                description: 'Employee designation',
                example: 'Senior Developer',
                minLength: 2,
                maxLength: 50
            },
            role: {
                type: 'string',
                description: 'Employee role/responsibility',
                example: 'Full Stack Development',
                minLength: 2,
                maxLength: 100
            },
            officeLocation: {
                type: 'string',
                description: 'Office location',
                example: 'New York Office',
                minLength: 2,
                maxLength: 100
            },
            status: {
                type: 'string',
                enum: ['Active', 'Inactive'],
                description: 'Employee status',
                example: 'Active',
                default: 'Active'
            }
        },
        required: ['employeeId', 'name', 'email', 'phone', 'department', 'designation', 'role', 'officeLocation']
    },

    UpdateEmployee: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                description: 'Employee full name',
                example: 'John Doe',
                minLength: 2,
                maxLength: 100
            },
            email: {
                type: 'string',
                format: 'email',
                description: 'Employee email address',
                example: 'john.doe@company.com'
            },
            phone: {
                type: 'string',
                description: 'Employee phone number',
                example: '+1234567890',
                pattern: '^[\\+]?[1-9][\\d]{0,15}$'
            },
            whatsapp: {
                type: 'string',
                description: 'Employee WhatsApp number',
                example: '+1234567890',
                pattern: '^[\\+]?[1-9][\\d]{0,15}$'
            },
            department: {
                type: 'string',
                description: 'Employee department',
                example: 'Engineering',
                minLength: 2,
                maxLength: 50
            },
            designation: {
                type: 'string',
                description: 'Employee designation',
                example: 'Senior Developer',
                minLength: 2,
                maxLength: 50
            },
            role: {
                type: 'string',
                description: 'Employee role/responsibility',
                example: 'Full Stack Development',
                minLength: 2,
                maxLength: 100
            },
            officeLocation: {
                type: 'string',
                description: 'Office location',
                example: 'New York Office',
                minLength: 2,
                maxLength: 100
            },
            status: {
                type: 'string',
                enum: ['Active', 'Inactive'],
                description: 'Employee status',
                example: 'Active'
            }
        }
    },

    UpdateEmployeeStatus: {
        type: 'object',
        properties: {
            status: {
                type: 'string',
                enum: ['Active', 'Inactive'],
                description: 'Employee status',
                example: 'Active'
            }
        },
        required: ['status']
    },

    BulkUpdateEmployees: {
        type: 'object',
        properties: {
            employeeIds: {
                type: 'array',
                items: {
                    type: 'string',
                    pattern: '^[0-9a-fA-F]{24}$'
                },
                description: 'Array of employee IDs to update',
                example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
                minItems: 1,
                maxItems: 50
            },
            status: {
                type: 'string',
                enum: ['Active', 'Inactive'],
                description: 'Status to update for all employees',
                example: 'Active'
            },
            department: {
                type: 'string',
                description: 'Department to update for all employees',
                example: 'Engineering',
                minLength: 2,
                maxLength: 50
            },
            designation: {
                type: 'string',
                description: 'Designation to update for all employees',
                example: 'Senior Developer',
                minLength: 2,
                maxLength: 50
            }
        },
        required: ['employeeIds']
    },

    EmployeeListResponse: {
        type: 'object',
        properties: {
            employees: {
                type: 'array',
                items: {
                    $ref: '#/components/schemas/Employee'
                }
            },
            pagination: {
                type: 'object',
                properties: {
                    currentPage: {
                        type: 'number',
                        example: 1
                    },
                    totalPages: {
                        type: 'number',
                        example: 5
                    },
                    totalEmployees: {
                        type: 'number',
                        example: 50
                    },
                    hasNextPage: {
                        type: 'boolean',
                        example: true
                    },
                    hasPrevPage: {
                        type: 'boolean',
                        example: false
                    }
                }
            }
        }
    },

    EmployeeStats: {
        type: 'object',
        properties: {
            totalEmployees: {
                type: 'number',
                description: 'Total number of employees',
                example: 100
            },
            activeEmployees: {
                type: 'number',
                description: 'Number of active employees',
                example: 85
            },
            inactiveEmployees: {
                type: 'number',
                description: 'Number of inactive employees',
                example: 15
            },
            deletedEmployees: {
                type: 'number',
                description: 'Number of deleted employees',
                example: 5
            },
            employeesByDepartment: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        department: {
                            type: 'string',
                            example: 'Engineering'
                        },
                        count: {
                            type: 'number',
                            example: 25
                        }
                    }
                }
            },
            employeesByStatus: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'Active'
                        },
                        count: {
                            type: 'number',
                            example: 85
                        }
                    }
                }
            }
        }
    },

    EmployeeQueryParams: {
        type: 'object',
        properties: {
            page: {
                type: 'number',
                description: 'Page number',
                example: 1,
                minimum: 1,
                default: 1
            },
            limit: {
                type: 'number',
                description: 'Number of items per page',
                example: 10,
                minimum: 1,
                maximum: 100,
                default: 10
            },
            search: {
                type: 'string',
                description: 'Search term for name, email, employeeId, department, or designation',
                example: 'john',
                maxLength: 100
            },
            department: {
                type: 'string',
                description: 'Filter by department',
                example: 'Engineering',
                maxLength: 50
            },
            status: {
                type: 'string',
                enum: ['Active', 'Inactive'],
                description: 'Filter by status',
                example: 'Active'
            },
            sortBy: {
                type: 'string',
                enum: ['name', 'email', 'department', 'designation', 'status', 'createdAt', 'updatedAt'],
                description: 'Field to sort by',
                example: 'createdAt',
                default: 'createdAt'
            },
            sortOrder: {
                type: 'string',
                enum: ['asc', 'desc'],
                description: 'Sort order',
                example: 'desc',
                default: 'desc'
            }
        }
    }
};
