export const companySchemas = {
    Company: {
        type: 'object',
        properties: {
            _id: {
                type: 'string',
                description: 'Company ID'
            },
            userId: {
                type: 'string',
                description: 'User ID who created the company'
            },
            companyName: {
                type: 'string',
                description: 'Company name'
            },
            companyCode: {
                type: 'string',
                description: 'Unique company code'
            },
            address: {
                type: 'object',
                properties: {
                    street: {
                        type: 'string',
                        description: 'Street address'
                    },
                    city: {
                        type: 'string',
                        description: 'City'
                    },
                    state: {
                        type: 'string',
                        description: 'State'
                    },
                    country: {
                        type: 'string',
                        default: 'IN',
                        description: 'Country code (ISO 3166-1 alpha-2)'
                    },
                    zipCode: {
                        type: 'string',
                        description: 'ZIP code'
                    }
                }
            },
            settings: {
                type: 'object',
                properties: {
                    allowAadhaarVerification: {
                        type: 'boolean',
                        description: 'Allow Aadhaar verification'
                    },
                    requireAadhaarPhoto: {
                        type: 'boolean',
                        description: 'Require Aadhaar photo'
                    },
                    allowWhatsAppNotifications: {
                        type: 'boolean',
                        description: 'Allow WhatsApp notifications'
                    },
                    allowEmailNotifications: {
                        type: 'boolean',
                        description: 'Allow email notifications'
                    },
                    timezone: {
                        type: 'string',
                        description: 'Company timezone'
                    },
                    logo: {
                        type: 'string',
                        format: 'uri',
                        description: 'Company logo URL'
                    },
                }
            },
            isActive: {
                type: 'boolean',
                description: 'Company active status'
            },
            isDeleted: {
                type: 'boolean',
                description: 'Whether the company is soft deleted'
            },
            deletedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Date when the company was deleted'
            },
            deletedBy: {
                type: 'string',
                description: 'User ID who deleted the company'
            },
            createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Company creation timestamp'
            },
            updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Last update timestamp'
            }
        }
    },
    CreateCompany: {
        type: 'object',
        required: ['companyName', 'address'],
        properties: {
            companyName: {
                type: 'string',
                minLength: 2,
                maxLength: 100,
                description: 'Company name'
            },
            companyCode: {
                type: 'string',
                minLength: 3,
                maxLength: 10,
                pattern: '^[A-Z0-9]+$',
                description: 'Company code (optional, auto-generated if not provided)'
            },
            address: {
                type: 'object',
                required: ['street', 'city', 'state', 'zipCode'],
                properties: {
                    street: {
                        type: 'string',
                        description: 'Street address'
                    },
                    city: {
                        type: 'string',
                        description: 'City'
                    },
                    state: {
                        type: 'string',
                        description: 'State'
                    },
                    country: {
                        type: 'string',
                        default: 'India',
                        description: 'Country'
                    },
                    zipCode: {
                        type: 'string',
                        description: 'ZIP code'
                    }
                }
            },
            settings: {
                type: 'object',
                properties: {
                    allowAadhaarVerification: {
                        type: 'boolean',
                        default: true,
                        description: 'Allow Aadhaar verification'
                    },
                    requireAadhaarPhoto: {
                        type: 'boolean',
                        default: false,
                        description: 'Require Aadhaar photo'
                    },
                    allowWhatsAppNotifications: {
                        type: 'boolean',
                        default: true,
                        description: 'Allow WhatsApp notifications'
                    },
                    allowEmailNotifications: {
                        type: 'boolean',
                        default: true,
                        description: 'Allow email notifications'
                    },
                    timezone: {
                        type: 'string',
                        default: 'Asia/Kolkata',
                        description: 'Company timezone'
                    },
                    logo: {
                        type: 'string',
                        format: 'uri',
                        description: 'Company logo URL'
                    },
                }
            }
        }
    },
    UpdateCompany: {
        type: 'object',
        properties: {
            companyName: {
                type: 'string',
                minLength: 2,
                maxLength: 100,
                description: 'Company name'
            },
            address: {
                type: 'object',
                properties: {
                    street: {
                        type: 'string',
                        description: 'Street address'
                    },
                    city: {
                        type: 'string',
                        description: 'City'
                    },
                    state: {
                        type: 'string',
                        description: 'State'
                    },
                    country: {
                        type: 'string',
                        default: 'IN',
                        description: 'Country code (ISO 3166-1 alpha-2)'
                    },
                    zipCode: {
                        type: 'string',
                        description: 'ZIP code'
                    }
                }
            },
            settings: {
                type: 'object',
                properties: {
                    allowAadhaarVerification: {
                        type: 'boolean',
                        description: 'Allow Aadhaar verification'
                    },
                    requireAadhaarPhoto: {
                        type: 'boolean',
                        description: 'Require Aadhaar photo'
                    },
                    allowWhatsAppNotifications: {
                        type: 'boolean',
                        description: 'Allow WhatsApp notifications'
                    },
                    allowEmailNotifications: {
                        type: 'boolean',
                        description: 'Allow email notifications'
                    },
                    timezone: {
                        type: 'string',
                        description: 'Company timezone'
                    },
                    logo: {
                        type: 'string',
                        format: 'uri',
                        description: 'Company logo URL'
                    },
                }
            },
            isActive: {
                type: 'boolean',
                description: 'Company active status'
            }
        }
    },
    CompanyStats: {
        type: 'object',
        properties: {
            totalEmployees: {
                type: 'number',
                description: 'Total employees in company'
            },
            totalVisitorsThisMonth: {
                type: 'number',
                description: 'Total visitors this month'
            },
            remainingEmployees: {
                type: 'number',
                description: 'Remaining employee slots'
            },
            remainingVisitors: {
                type: 'number',
                description: 'Remaining visitor slots this month'
            },
        }
    },
    CompaniesList: {
        type: 'object',
        properties: {
            companies: {
                type: 'array',
                items: {
                    $ref: '#/components/schemas/Company'
                }
            },
            total: {
                type: 'number',
                description: 'Total number of companies'
            },
            page: {
                type: 'number',
                description: 'Current page number'
            },
            totalPages: {
                type: 'number',
                description: 'Total number of pages'
            }
        }
    },
    CanAddEmployeeResponse: {
        type: 'object',
        properties: {
            canAddEmployee: {
                type: 'boolean',
                description: 'Whether company can add more employees'
            }
        }
    }
};
