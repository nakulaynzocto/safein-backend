export const visitorSchemas = {
    Visitor: {
        type: 'object',
        properties: {
            _id: {
                type: 'string',
                description: 'Visitor unique identifier (MongoDB _id)',
                example: '507f1f77bcf86cd799439011',
                pattern: '^[0-9a-fA-F]{24}$'
            },
            name: {
                type: 'string',
                description: 'Visitor full name',
                example: 'John Doe'
            },
            email: {
                type: 'string',
                format: 'email',
                description: 'Visitor email address',
                example: 'john.doe@company.com'
            },
            phone: {
                type: 'string',
                description: 'Visitor phone number',
                example: '+1234567890'
            },
            company: {
                type: 'string',
                description: 'Visitor company name',
                example: 'ABC Corporation'
            },
            designation: {
                type: 'string',
                description: 'Visitor designation',
                example: 'Senior Manager'
            },
            address: {
                type: 'object',
                properties: {
                    street: {
                        type: 'string',
                        description: 'Street address',
                        example: '123 Main Street'
                    },
                    city: {
                        type: 'string',
                        description: 'City',
                        example: 'New York'
                    },
                    state: {
                        type: 'string',
                        description: 'State',
                        example: 'NY'
                    },
                    country: {
                        type: 'string',
                        description: 'Country',
                        example: 'USA'
                    },
                    zipCode: {
                        type: 'string',
                        description: 'ZIP code',
                        example: '10001'
                    }
                },
                required: ['street', 'city', 'state', 'country', 'zipCode']
            },
            idProof: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        description: 'ID proof type',
                        example: 'Driving License'
                    },
                    number: {
                        type: 'string',
                        description: 'ID proof number',
                        example: 'DL123456789'
                    },
                    image: {
                        type: 'string',
                        description: 'ID proof image URL',
                        example: 'https://example.com/id-proof.jpg'
                    }
                },
                required: ['type', 'number']
            },
            photo: {
                type: 'string',
                description: 'Visitor photo URL',
                example: 'https://example.com/photo.jpg'
            },
            createdBy: {
                type: 'string',
                description: 'User ID who created the visitor',
                example: '507f1f77bcf86cd799439011'
            },
            isDeleted: {
                type: 'boolean',
                description: 'Whether visitor is soft deleted',
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
                description: 'User ID who deleted the visitor',
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
        required: ['_id', 'name', 'email', 'phone', 'company', 'designation', 'address', 'idProof', 'isDeleted', 'createdAt', 'updatedAt']
    },

    CreateVisitor: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                description: 'Visitor full name',
                example: 'John Doe',
                minLength: 2,
                maxLength: 100
            },
            email: {
                type: 'string',
                format: 'email',
                description: 'Visitor email address',
                example: 'john.doe@company.com'
            },
            phone: {
                type: 'string',
                description: 'Visitor phone number',
                example: '+1234567890',
                pattern: '^[\\+]?[1-9][\\d]{0,15}$'
            },
            company: {
                type: 'string',
                description: 'Visitor company name',
                example: 'ABC Corporation',
                minLength: 2,
                maxLength: 100
            },
            designation: {
                type: 'string',
                description: 'Visitor designation',
                example: 'Senior Manager',
                minLength: 2,
                maxLength: 100
            },
            address: {
                type: 'object',
                properties: {
                    street: {
                        type: 'string',
                        description: 'Street address',
                        example: '123 Main Street',
                        minLength: 2,
                        maxLength: 200
                    },
                    city: {
                        type: 'string',
                        description: 'City',
                        example: 'New York',
                        minLength: 2,
                        maxLength: 100
                    },
                    state: {
                        type: 'string',
                        description: 'State',
                        example: 'NY',
                        minLength: 2,
                        maxLength: 100
                    },
                    country: {
                        type: 'string',
                        description: 'Country',
                        example: 'USA',
                        minLength: 2,
                        maxLength: 100
                    },
                    zipCode: {
                        type: 'string',
                        description: 'ZIP code',
                        example: '10001',
                        minLength: 3,
                        maxLength: 20
                    }
                },
                required: ['street', 'city', 'state', 'country', 'zipCode']
            },
            idProof: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        description: 'ID proof type',
                        example: 'Driving License',
                        minLength: 2,
                        maxLength: 50
                    },
                    number: {
                        type: 'string',
                        description: 'ID proof number',
                        example: 'DL123456789',
                        minLength: 2,
                        maxLength: 50
                    },
                    image: {
                        type: 'string',
                        description: 'ID proof image URL',
                        example: 'https://example.com/id-proof.jpg',
                        maxLength: 500
                    }
                },
                required: ['type', 'number']
            },
            photo: {
                type: 'string',
                description: 'Visitor photo URL',
                example: 'https://example.com/photo.jpg',
                maxLength: 500
            }
        },
        required: ['name', 'email', 'phone', 'company', 'designation', 'address', 'idProof']
    },

    UpdateVisitor: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                description: 'Visitor full name',
                example: 'John Doe',
                minLength: 2,
                maxLength: 100
            },
            email: {
                type: 'string',
                format: 'email',
                description: 'Visitor email address',
                example: 'john.doe@company.com'
            },
            phone: {
                type: 'string',
                description: 'Visitor phone number',
                example: '+1234567890',
                pattern: '^[\\+]?[1-9][\\d]{0,15}$'
            },
            company: {
                type: 'string',
                description: 'Visitor company name',
                example: 'ABC Corporation',
                minLength: 2,
                maxLength: 100
            },
            designation: {
                type: 'string',
                description: 'Visitor designation',
                example: 'Senior Manager',
                minLength: 2,
                maxLength: 100
            },
            address: {
                type: 'object',
                properties: {
                    street: {
                        type: 'string',
                        description: 'Street address',
                        example: '123 Main Street',
                        minLength: 2,
                        maxLength: 200
                    },
                    city: {
                        type: 'string',
                        description: 'City',
                        example: 'New York',
                        minLength: 2,
                        maxLength: 100
                    },
                    state: {
                        type: 'string',
                        description: 'State',
                        example: 'NY',
                        minLength: 2,
                        maxLength: 100
                    },
                    country: {
                        type: 'string',
                        description: 'Country',
                        example: 'USA',
                        minLength: 2,
                        maxLength: 100
                    },
                    zipCode: {
                        type: 'string',
                        description: 'ZIP code',
                        example: '10001',
                        minLength: 3,
                        maxLength: 20
                    }
                }
            },
            idProof: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        description: 'ID proof type',
                        example: 'Driving License',
                        minLength: 2,
                        maxLength: 50
                    },
                    number: {
                        type: 'string',
                        description: 'ID proof number',
                        example: 'DL123456789',
                        minLength: 2,
                        maxLength: 50
                    },
                    image: {
                        type: 'string',
                        description: 'ID proof image URL',
                        example: 'https://example.com/id-proof.jpg',
                        maxLength: 500
                    }
                }
            },
            photo: {
                type: 'string',
                description: 'Visitor photo URL',
                example: 'https://example.com/photo.jpg',
                maxLength: 500
            }
        }
    },

    BulkUpdateVisitors: {
        type: 'object',
        properties: {
            visitorIds: {
                type: 'array',
                items: {
                    type: 'string',
                    pattern: '^[0-9a-fA-F]{24}$'
                },
                description: 'Array of visitor IDs to update',
                example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
                minItems: 1,
                maxItems: 50
            },
            company: {
                type: 'string',
                description: 'Company to update for all visitors',
                example: 'ABC Corporation',
                minLength: 2,
                maxLength: 100
            },
            designation: {
                type: 'string',
                description: 'Designation to update for all visitors',
                example: 'Senior Manager',
                minLength: 2,
                maxLength: 100
            }
        },
        required: ['visitorIds']
    },

    VisitorListResponse: {
        type: 'object',
        properties: {
            visitors: {
                type: 'array',
                items: {
                    $ref: '#/components/schemas/Visitor'
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
                    totalVisitors: {
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

    VisitorStats: {
        type: 'object',
        properties: {
            totalVisitors: {
                type: 'number',
                description: 'Total number of visitors',
                example: 100
            },
            deletedVisitors: {
                type: 'number',
                description: 'Number of deleted visitors',
                example: 5
            },
            visitorsByCompany: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        company: {
                            type: 'string',
                            example: 'ABC Corporation'
                        },
                        count: {
                            type: 'number',
                            example: 25
                        }
                    }
                }
            },
            visitorsByCity: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        city: {
                            type: 'string',
                            example: 'New York'
                        },
                        count: {
                            type: 'number',
                            example: 30
                        }
                    }
                }
            },
            visitorsByState: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        state: {
                            type: 'string',
                            example: 'NY'
                        },
                        count: {
                            type: 'number',
                            example: 40
                        }
                    }
                }
            },
            visitorsByCountry: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        country: {
                            type: 'string',
                            example: 'USA'
                        },
                        count: {
                            type: 'number',
                            example: 80
                        }
                    }
                }
            },
            visitorsByIdProofType: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        idProofType: {
                            type: 'string',
                            example: 'Driving License'
                        },
                        count: {
                            type: 'number',
                            example: 60
                        }
                    }
                }
            }
        }
    },

    VisitorQueryParams: {
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
                description: 'Search term for name, email, phone, company, designation, address fields, or ID proof',
                example: 'john',
                maxLength: 100
            },
            company: {
                type: 'string',
                description: 'Filter by company',
                example: 'ABC Corporation',
                maxLength: 100
            },
            designation: {
                type: 'string',
                description: 'Filter by designation',
                example: 'Senior Manager',
                maxLength: 100
            },
            city: {
                type: 'string',
                description: 'Filter by city',
                example: 'New York',
                maxLength: 100
            },
            state: {
                type: 'string',
                description: 'Filter by state',
                example: 'NY',
                maxLength: 100
            },
            country: {
                type: 'string',
                description: 'Filter by country',
                example: 'USA',
                maxLength: 100
            },
            idProofType: {
                type: 'string',
                description: 'Filter by ID proof type',
                example: 'Driving License',
                maxLength: 50
            },
            sortBy: {
                type: 'string',
                enum: ['name', 'email', 'company', 'designation', 'createdAt', 'updatedAt'],
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
