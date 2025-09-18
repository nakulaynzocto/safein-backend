export const appointmentPaths = {
    '/appointments': {
        post: {
            tags: ['Appointments'],
            summary: 'Create a new appointment',
            description: 'Create a new appointment with visitor details and employee assignment',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/CreateAppointment'
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'Appointment created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Appointment created successfully' },
                                    data: { $ref: '#/components/schemas/Appointment' },
                                    statusCode: { type: 'number', example: 201 }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad request - validation error or conflict',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Employee already has an appointment at this time' },
                                    statusCode: { type: 'number', example: 400 }
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
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'User not authenticated' },
                                    statusCode: { type: 'number', example: 401 }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'Employee not found',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Employee not found' },
                                    statusCode: { type: 'number', example: 404 }
                                }
                            }
                        }
                    }
                }
            }
        },
        get: {
            tags: ['Appointments'],
            summary: 'Get all appointments',
            description: 'Get all appointments with pagination and filtering options',
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
                    description: 'Number of appointments per page',
                    schema: { type: 'number', minimum: 1, maximum: 100, default: 10 }
                },
                {
                    name: 'search',
                    in: 'query',
                    description: 'Search term for visitor name, phone, email, or appointment ID',
                    schema: { type: 'string' }
                },
                {
                    name: 'employeeId',
                    in: 'query',
                    description: 'Filter by employee ID',
                    schema: { type: 'string' }
                },
                {
                    name: 'status',
                    in: 'query',
                    description: 'Filter by appointment status',
                    schema: {
                        type: 'string',
                        enum: ['scheduled', 'checked_in', 'in_meeting', 'completed', 'cancelled', 'no_show']
                    }
                },
                {
                    name: 'scheduledDate',
                    in: 'query',
                    description: 'Filter by scheduled date (YYYY-MM-DD)',
                    schema: { type: 'string', format: 'date' }
                },
                {
                    name: 'startDate',
                    in: 'query',
                    description: 'Filter by start date (YYYY-MM-DD)',
                    schema: { type: 'string', format: 'date' }
                },
                {
                    name: 'endDate',
                    in: 'query',
                    description: 'Filter by end date (YYYY-MM-DD)',
                    schema: { type: 'string', format: 'date' }
                },
                {
                    name: 'sortBy',
                    in: 'query',
                    description: 'Sort field',
                    schema: {
                        type: 'string',
                        enum: ['createdAt', 'appointmentDetails.scheduledDate', 'visitorDetails.name', 'status'],
                        default: 'createdAt'
                    }
                },
                {
                    name: 'sortOrder',
                    in: 'query',
                    description: 'Sort order',
                    schema: {
                        type: 'string',
                        enum: ['asc', 'desc'],
                        default: 'desc'
                    }
                }
            ],
            responses: {
                200: {
                    description: 'Appointments retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Appointments retrieved successfully' },
                                    data: { $ref: '#/components/schemas/AppointmentListResponse' },
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
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'User not authenticated' },
                                    statusCode: { type: 'number', example: 401 }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/appointments/{id}': {
        get: {
            tags: ['Appointments'],
            summary: 'Get appointment by ID',
            description: 'Get a specific appointment by its database ID',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Appointment database ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                }
            ],
            responses: {
                200: {
                    description: 'Appointment retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Appointment retrieved successfully' },
                                    data: { $ref: '#/components/schemas/Appointment' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'Appointment not found',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Appointment not found' },
                                    statusCode: { type: 'number', example: 404 }
                                }
                            }
                        }
                    }
                }
            }
        },
        put: {
            tags: ['Appointments'],
            summary: 'Update appointment',
            description: 'Update an existing appointment',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Appointment database ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/UpdateAppointment'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Appointment updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Appointment updated successfully' },
                                    data: { $ref: '#/components/schemas/Appointment' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad request - validation error or conflict',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Employee already has an appointment at this time' },
                                    statusCode: { type: 'number', example: 400 }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'Appointment not found',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Appointment not found' },
                                    statusCode: { type: 'number', example: 404 }
                                }
                            }
                        }
                    }
                }
            }
        },
        delete: {
            tags: ['Appointments'],
            summary: 'Delete appointment',
            description: 'Soft delete an appointment',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Appointment database ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                }
            ],
            responses: {
                200: {
                    description: 'Appointment deleted successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Appointment deleted successfully' },
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
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'User not authenticated' },
                                    statusCode: { type: 'number', example: 401 }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'Appointment not found',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Appointment not found' },
                                    statusCode: { type: 'number', example: 404 }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/appointments/appointment/{appointmentId}': {
        get: {
            tags: ['Appointments'],
            summary: 'Get appointment by appointment ID',
            description: 'Get a specific appointment by its appointment ID (APT123456789)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'appointmentId',
                    in: 'path',
                    required: true,
                    description: 'Appointment ID (e.g., APT123456789)',
                    schema: { type: 'string' }
                }
            ],
            responses: {
                200: {
                    description: 'Appointment retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Appointment retrieved successfully' },
                                    data: { $ref: '#/components/schemas/Appointment' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'Appointment not found',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Appointment not found' },
                                    statusCode: { type: 'number', example: 404 }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/appointments/check-in': {
        post: {
            tags: ['Appointments'],
            summary: 'Check in appointment',
            description: 'Check in a visitor for their appointment',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/CheckInRequest'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Appointment checked in successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Appointment checked in successfully' },
                                    data: { $ref: '#/components/schemas/Appointment' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad request - appointment not in scheduled status',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Appointment is not in scheduled status' },
                                    statusCode: { type: 'number', example: 400 }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'Appointment not found',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Appointment not found' },
                                    statusCode: { type: 'number', example: 404 }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/appointments/check-out': {
        post: {
            tags: ['Appointments'],
            summary: 'Check out appointment',
            description: 'Check out a visitor from their appointment',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/CheckOutRequest'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Appointment checked out successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Appointment checked out successfully' },
                                    data: { $ref: '#/components/schemas/Appointment' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad request - appointment not checked in',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Appointment is not checked in' },
                                    statusCode: { type: 'number', example: 400 }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'Appointment not found',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Appointment not found' },
                                    statusCode: { type: 'number', example: 404 }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/appointments/stats': {
        get: {
            tags: ['Appointments'],
            summary: 'Get appointment statistics',
            description: 'Get comprehensive statistics about appointments',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Appointment statistics retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Appointment statistics retrieved successfully' },
                                    data: { $ref: '#/components/schemas/AppointmentStats' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/appointments/calendar': {
        get: {
            tags: ['Appointments'],
            summary: 'Get appointments calendar view',
            description: 'Get appointments organized by date for calendar view',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'startDate',
                    in: 'query',
                    required: true,
                    description: 'Start date (YYYY-MM-DD)',
                    schema: { type: 'string', format: 'date' }
                },
                {
                    name: 'endDate',
                    in: 'query',
                    required: true,
                    description: 'End date (YYYY-MM-DD)',
                    schema: { type: 'string', format: 'date' }
                }
            ],
            responses: {
                200: {
                    description: 'Appointments calendar retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Appointments calendar retrieved successfully' },
                                    data: { $ref: '#/components/schemas/AppointmentCalendar' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad request - missing start date or end date',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Start date and end date are required' },
                                    statusCode: { type: 'number', example: 400 }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/appointments/search': {
        post: {
            tags: ['Appointments'],
            summary: 'Search appointments',
            description: 'Search appointments by various criteria',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/AppointmentSearchRequest'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Appointments search completed successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Appointments search completed successfully' },
                                    data: { $ref: '#/components/schemas/AppointmentListResponse' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/appointments/bulk-update': {
        put: {
            tags: ['Appointments'],
            summary: 'Bulk update appointments',
            description: 'Update multiple appointments at once',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/BulkUpdateAppointments'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Appointments updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Appointments updated successfully' },
                                    data: { $ref: '#/components/schemas/BulkUpdateResponse' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad request - no update data provided',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'No update data provided' },
                                    statusCode: { type: 'number', example: 400 }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'No appointments found',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'No appointments found' },
                                    statusCode: { type: 'number', example: 404 }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/appointments/{id}/restore': {
        put: {
            tags: ['Appointments'],
            summary: 'Restore appointment',
            description: 'Restore a soft-deleted appointment',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Appointment database ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                }
            ],
            responses: {
                200: {
                    description: 'Appointment restored successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Appointment restored successfully' },
                                    data: { $ref: '#/components/schemas/Appointment' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'Appointment not found',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Appointment not found' },
                                    statusCode: { type: 'number', example: 404 }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/appointments/employee/{employeeId}': {
        get: {
            tags: ['Appointments'],
            summary: 'Get appointments by employee',
            description: 'Get all appointments for a specific employee',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'employeeId',
                    in: 'path',
                    required: true,
                    description: 'Employee database ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                },
                {
                    name: 'page',
                    in: 'query',
                    description: 'Page number',
                    schema: { type: 'number', minimum: 1, default: 1 }
                },
                {
                    name: 'limit',
                    in: 'query',
                    description: 'Number of appointments per page',
                    schema: { type: 'number', minimum: 1, maximum: 100, default: 10 }
                },
                {
                    name: 'status',
                    in: 'query',
                    description: 'Filter by appointment status',
                    schema: {
                        type: 'string',
                        enum: ['scheduled', 'checked_in', 'in_meeting', 'completed', 'cancelled', 'no_show']
                    }
                }
            ],
            responses: {
                200: {
                    description: 'Employee appointments retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Employee appointments retrieved successfully' },
                                    data: { $ref: '#/components/schemas/AppointmentListResponse' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/appointments/date-range': {
        get: {
            tags: ['Appointments'],
            summary: 'Get appointments by date range',
            description: 'Get appointments within a specific date range',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'startDate',
                    in: 'query',
                    required: true,
                    description: 'Start date (YYYY-MM-DD)',
                    schema: { type: 'string', format: 'date' }
                },
                {
                    name: 'endDate',
                    in: 'query',
                    required: true,
                    description: 'End date (YYYY-MM-DD)',
                    schema: { type: 'string', format: 'date' }
                },
                {
                    name: 'page',
                    in: 'query',
                    description: 'Page number',
                    schema: { type: 'number', minimum: 1, default: 1 }
                },
                {
                    name: 'limit',
                    in: 'query',
                    description: 'Number of appointments per page',
                    schema: { type: 'number', minimum: 1, maximum: 100, default: 10 }
                }
            ],
            responses: {
                200: {
                    description: 'Appointments by date range retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Appointments by date range retrieved successfully' },
                                    data: { $ref: '#/components/schemas/AppointmentListResponse' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad request - missing start date or end date',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Start date and end date are required' },
                                    statusCode: { type: 'number', example: 400 }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
