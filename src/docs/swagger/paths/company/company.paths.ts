export const companyPaths = {
    '/companies': {
        post: {
            tags: ['Companies'],
            summary: 'Create a new company',
            description: 'Create a new company with subscription details',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/CreateCompany'
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'Company created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ApiResponse' },
                                    {
                                        properties: {
                                            data: {
                                                $ref: '#/components/schemas/Company'
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                400: {
                    description: 'Validation error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ApiResponse'
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ApiResponse'
                            }
                        }
                    }
                },
                409: {
                    description: 'Company already exists',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ApiResponse'
                            }
                        }
                    }
                }
            }
        }
    },
    '/companies/{id}': {
        get: {
            tags: ['Companies'],
            summary: 'Get company by ID',
            description: 'Get company details by ID',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Company ID',
                    schema: {
                        type: 'string',
                        pattern: '^[0-9a-fA-F]{24}$'
                    }
                }
            ],
            responses: {
                200: {
                    description: 'Company retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ApiResponse' },
                                    {
                                        properties: {
                                            data: {
                                                $ref: '#/components/schemas/Company'
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ApiResponse'
                            }
                        }
                    }
                },
                404: {
                    description: 'Company not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ApiResponse'
                            }
                        }
                    }
                }
            }
        },
        put: {
            tags: ['Companies'],
            summary: 'Update company',
            description: 'Update company details',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Company ID',
                    schema: {
                        type: 'string',
                        pattern: '^[0-9a-fA-F]{24}$'
                    }
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/UpdateCompany'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Company updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ApiResponse' },
                                    {
                                        properties: {
                                            data: {
                                                $ref: '#/components/schemas/Company'
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                400: {
                    description: 'Validation error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ApiResponse'
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ApiResponse'
                            }
                        }
                    }
                },
                404: {
                    description: 'Company not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ApiResponse'
                            }
                        }
                    }
                }
            }
        },
        delete: {
            tags: ['Companies'],
            summary: 'Delete company',
            description: 'Delete company by ID',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Company ID',
                    schema: {
                        type: 'string',
                        pattern: '^[0-9a-fA-F]{24}$'
                    }
                }
            ],
            responses: {
                200: {
                    description: 'Company deleted successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ApiResponse'
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ApiResponse'
                            }
                        }
                    }
                },
                404: {
                    description: 'Company not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ApiResponse'
                            }
                        }
                    }
                }
            }
        }
    },
    '/companies/exists': {
        get: {
            tags: ['Companies'],
            summary: 'Check if company exists for authenticated user',
            description: 'Check if the authenticated user has a company associated with their account',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Company existence checked successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ApiResponse' },
                                    {
                                        properties: {
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    exists: {
                                                        type: 'boolean',
                                                        description: 'Whether the user has a company'
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ApiResponse'
                            }
                        }
                    }
                }
            }
        }
    }
};