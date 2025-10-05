export const visitorPaths = {
    '/visitors': {
        post: {
            tags: ['Visitor'],
            summary: 'Create a new visitor',
            description: 'Create a new visitor with all required information including address and ID proof',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/CreateVisitor'
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'Visitor created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Visitor created successfully' },
                                    data: { $ref: '#/components/schemas/Visitor' },
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
                    description: 'Conflict - visitor email already exists',
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
            tags: ['Visitor'],
            summary: 'Get all visitors (User-specific)',
            description: 'Retrieve a paginated list of visitors created by the authenticated user with filtering and sorting options',
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
                    description: 'Search term for name, email, phone, company, designation, address fields, or ID proof',
                    schema: { type: 'string', maxLength: 100 }
                },
                {
                    name: 'company',
                    in: 'query',
                    description: 'Filter by company',
                    schema: { type: 'string', maxLength: 100 }
                },
                {
                    name: 'designation',
                    in: 'query',
                    description: 'Filter by designation',
                    schema: { type: 'string', maxLength: 100 }
                },
                {
                    name: 'city',
                    in: 'query',
                    description: 'Filter by city',
                    schema: { type: 'string', maxLength: 100 }
                },
                {
                    name: 'state',
                    in: 'query',
                    description: 'Filter by state',
                    schema: { type: 'string', maxLength: 100 }
                },
                {
                    name: 'country',
                    in: 'query',
                    description: 'Filter by country',
                    schema: { type: 'string', maxLength: 100 }
                },
                {
                    name: 'idProofType',
                    in: 'query',
                    description: 'Filter by ID proof type',
                    schema: { type: 'string', maxLength: 50 }
                },
                {
                    name: 'sortBy',
                    in: 'query',
                    description: 'Field to sort by',
                    schema: { type: 'string', enum: ['name', 'email', 'company', 'designation', 'createdAt', 'updatedAt'], default: 'createdAt' }
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
                    description: 'Visitors retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Visitors retrieved successfully' },
                                    data: { $ref: '#/components/schemas/VisitorListResponse' },
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

    '/visitors/stats': {
        get: {
            tags: ['Visitor'],
            summary: 'Get visitor statistics',
            description: 'Retrieve comprehensive statistics about visitors',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Visitor statistics retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Visitor statistics retrieved successfully' },
                                    data: { $ref: '#/components/schemas/VisitorStats' },
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

    '/visitors/trashed': {
        get: {
            tags: ['Visitor'],
            summary: 'Get trashed visitors',
            description: 'Retrieve a paginated list of soft-deleted visitors',
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
                    description: 'Search term for name, email, phone, company, designation, address fields, or ID proof',
                    schema: { type: 'string', maxLength: 100 }
                },
                {
                    name: 'company',
                    in: 'query',
                    description: 'Filter by company',
                    schema: { type: 'string', maxLength: 100 }
                },
                {
                    name: 'designation',
                    in: 'query',
                    description: 'Filter by designation',
                    schema: { type: 'string', maxLength: 100 }
                },
                {
                    name: 'city',
                    in: 'query',
                    description: 'Filter by city',
                    schema: { type: 'string', maxLength: 100 }
                },
                {
                    name: 'state',
                    in: 'query',
                    description: 'Filter by state',
                    schema: { type: 'string', maxLength: 100 }
                },
                {
                    name: 'country',
                    in: 'query',
                    description: 'Filter by country',
                    schema: { type: 'string', maxLength: 100 }
                },
                {
                    name: 'sortBy',
                    in: 'query',
                    description: 'Field to sort by',
                    schema: { type: 'string', enum: ['name', 'email', 'company', 'designation', 'deletedAt'], default: 'deletedAt' }
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
                    description: 'Trashed visitors retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Trashed visitors retrieved successfully' },
                                    data: { $ref: '#/components/schemas/VisitorListResponse' },
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

    '/visitors/bulk-update': {
        put: {
            tags: ['Visitor'],
            summary: 'Bulk update visitors',
            description: 'Update multiple visitors at once',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/BulkUpdateVisitors'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Visitors updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Visitors updated successfully' },
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
                    description: 'Not found - no visitors found for bulk update',
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

    '/visitors/{id}': {
        get: {
            tags: ['Visitor'],
            summary: 'Get visitor by ID',
            description: 'Retrieve a specific visitor by their ID',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Visitor ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                }
            ],
            responses: {
                200: {
                    description: 'Visitor retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Visitor retrieved successfully' },
                                    data: { $ref: '#/components/schemas/Visitor' },
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
                    description: 'Not found - visitor not found',
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
            tags: ['Visitor'],
            summary: 'Update visitor',
            description: 'Update an existing visitor',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Visitor ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/UpdateVisitor'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Visitor updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Visitor updated successfully' },
                                    data: { $ref: '#/components/schemas/Visitor' },
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
                    description: 'Not found - visitor not found',
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
            tags: ['Visitor'],
            summary: 'Soft delete visitor',
            description: 'Soft delete a visitor (move to trash)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Visitor ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                }
            ],
            responses: {
                200: {
                    description: 'Visitor deleted successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Visitor deleted successfully' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad request - visitor already deleted',
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
                    description: 'Not found - visitor not found',
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

    '/visitors/{id}/restore': {
        put: {
            tags: ['Visitor'],
            summary: 'Restore visitor from trash',
            description: 'Restore a soft-deleted visitor from trash',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Visitor ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                }
            ],
            responses: {
                200: {
                    description: 'Visitor restored successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Visitor restored successfully' },
                                    data: { $ref: '#/components/schemas/Visitor' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad request - visitor not deleted',
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
                    description: 'Not found - visitor not found',
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
