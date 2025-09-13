export const companySchemas = {
    Company: {
        type: 'object',
        properties: {
            _id: {
                type: 'string',
                description: 'Company ID'
            },
            companyName: {
                type: 'string',
                description: 'Company name'
            },
            companyCode: {
                type: 'string',
                description: 'Unique company code'
            },
            email: {
                type: 'string',
                format: 'email',
                description: 'Company email'
            },
            phone: {
                type: 'string',
                description: 'Company phone number'
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
                        description: 'Country'
                    },
                    zipCode: {
                        type: 'string',
                        description: 'ZIP code'
                    }
                }
            },
            contactPerson: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Contact person name'
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'Contact person email'
                    },
                    phone: {
                        type: 'string',
                        description: 'Contact person phone'
                    },
                    designation: {
                        type: 'string',
                        description: 'Contact person designation'
                    }
                }
            },
            subscription: {
                type: 'object',
                properties: {
                    plan: {
                        type: 'string',
                        enum: ['basic', 'premium', 'enterprise'],
                        description: 'Subscription plan'
                    },
                    status: {
                        type: 'string',
                        enum: ['active', 'inactive', 'suspended', 'trial'],
                        description: 'Subscription status'
                    },
                    startDate: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Subscription start date'
                    },
                    endDate: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Subscription end date'
                    },
                    maxEmployees: {
                        type: 'number',
                        description: 'Maximum employees allowed'
                    },
                    maxVisitorsPerMonth: {
                        type: 'number',
                        description: 'Maximum visitors per month'
                    },
                    isActive: {
                        type: 'boolean',
                        description: 'Subscription active status'
                    },
                    remainingEmployees: {
                        type: 'number',
                        description: 'Remaining employee slots'
                    },
                    remainingVisitorsThisMonth: {
                        type: 'number',
                        description: 'Remaining visitor slots this month'
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
                    workingHours: {
                        type: 'object',
                        properties: {
                            start: {
                                type: 'string',
                                description: 'Working hours start time'
                            },
                            end: {
                                type: 'string',
                                description: 'Working hours end time'
                            },
                            workingDays: {
                                type: 'array',
                                items: {
                                    type: 'number',
                                    minimum: 1,
                                    maximum: 7
                                },
                                description: 'Working days (1=Monday, 7=Sunday)'
                            }
                        }
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
                    primaryColor: {
                        type: 'string',
                        pattern: '^#[0-9A-F]{6}$',
                        description: 'Primary color (hex)'
                    },
                    secondaryColor: {
                        type: 'string',
                        pattern: '^#[0-9A-F]{6}$',
                        description: 'Secondary color (hex)'
                    }
                }
            },
            isActive: {
                type: 'boolean',
                description: 'Company active status'
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
        required: ['companyName', 'email', 'phone', 'address', 'contactPerson', 'subscription'],
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
            email: {
                type: 'string',
                format: 'email',
                description: 'Company email'
            },
            phone: {
                type: 'string',
                pattern: '^[\\+]?[1-9][\\d]{0,15}$',
                description: 'Company phone number'
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
            contactPerson: {
                type: 'object',
                required: ['name', 'email', 'phone', 'designation'],
                properties: {
                    name: {
                        type: 'string',
                        description: 'Contact person name'
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'Contact person email'
                    },
                    phone: {
                        type: 'string',
                        pattern: '^[\\+]?[1-9][\\d]{0,15}$',
                        description: 'Contact person phone'
                    },
                    designation: {
                        type: 'string',
                        description: 'Contact person designation'
                    }
                }
            },
            subscription: {
                type: 'object',
                required: ['plan', 'maxEmployees', 'maxVisitorsPerMonth', 'endDate'],
                properties: {
                    plan: {
                        type: 'string',
                        enum: ['basic', 'premium', 'enterprise'],
                        default: 'basic',
                        description: 'Subscription plan'
                    },
                    maxEmployees: {
                        type: 'number',
                        minimum: 1,
                        description: 'Maximum employees allowed'
                    },
                    maxVisitorsPerMonth: {
                        type: 'number',
                        minimum: 1,
                        description: 'Maximum visitors per month'
                    },
                    endDate: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Subscription end date'
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
                    workingHours: {
                        type: 'object',
                        properties: {
                            start: {
                                type: 'string',
                                pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
                                default: '09:00',
                                description: 'Working hours start time (HH:MM)'
                            },
                            end: {
                                type: 'string',
                                pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
                                default: '18:00',
                                description: 'Working hours end time (HH:MM)'
                            },
                            workingDays: {
                                type: 'array',
                                items: {
                                    type: 'number',
                                    minimum: 1,
                                    maximum: 7
                                },
                                default: [1, 2, 3, 4, 5],
                                description: 'Working days (1=Monday, 7=Sunday)'
                            }
                        }
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
                    primaryColor: {
                        type: 'string',
                        pattern: '^#[0-9A-F]{6}$',
                        default: '#3B82F6',
                        description: 'Primary color (hex)'
                    },
                    secondaryColor: {
                        type: 'string',
                        pattern: '^#[0-9A-F]{6}$',
                        default: '#1E40AF',
                        description: 'Secondary color (hex)'
                    }
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
            email: {
                type: 'string',
                format: 'email',
                description: 'Company email'
            },
            phone: {
                type: 'string',
                pattern: '^[\\+]?[1-9][\\d]{0,15}$',
                description: 'Company phone number'
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
                        description: 'Country'
                    },
                    zipCode: {
                        type: 'string',
                        description: 'ZIP code'
                    }
                }
            },
            contactPerson: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Contact person name'
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'Contact person email'
                    },
                    phone: {
                        type: 'string',
                        pattern: '^[\\+]?[1-9][\\d]{0,15}$',
                        description: 'Contact person phone'
                    },
                    designation: {
                        type: 'string',
                        description: 'Contact person designation'
                    }
                }
            },
            subscription: {
                type: 'object',
                properties: {
                    plan: {
                        type: 'string',
                        enum: ['basic', 'premium', 'enterprise'],
                        description: 'Subscription plan'
                    },
                    status: {
                        type: 'string',
                        enum: ['active', 'inactive', 'suspended', 'trial'],
                        description: 'Subscription status'
                    },
                    maxEmployees: {
                        type: 'number',
                        minimum: 1,
                        description: 'Maximum employees allowed'
                    },
                    maxVisitorsPerMonth: {
                        type: 'number',
                        minimum: 1,
                        description: 'Maximum visitors per month'
                    },
                    endDate: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Subscription end date'
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
                    workingHours: {
                        type: 'object',
                        properties: {
                            start: {
                                type: 'string',
                                pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
                                description: 'Working hours start time (HH:MM)'
                            },
                            end: {
                                type: 'string',
                                pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
                                description: 'Working hours end time (HH:MM)'
                            },
                            workingDays: {
                                type: 'array',
                                items: {
                                    type: 'number',
                                    minimum: 1,
                                    maximum: 7
                                },
                                description: 'Working days (1=Monday, 7=Sunday)'
                            }
                        }
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
                    primaryColor: {
                        type: 'string',
                        pattern: '^#[0-9A-F]{6}$',
                        description: 'Primary color (hex)'
                    },
                    secondaryColor: {
                        type: 'string',
                        pattern: '^#[0-9A-F]{6}$',
                        description: 'Secondary color (hex)'
                    }
                }
            },
            isActive: {
                type: 'boolean',
                description: 'Company active status'
            }
        }
    },
    UpdateSubscription: {
        type: 'object',
        required: ['plan', 'endDate'],
        properties: {
            plan: {
                type: 'string',
                enum: ['basic', 'premium', 'enterprise'],
                description: 'Subscription plan'
            },
            status: {
                type: 'string',
                enum: ['active', 'inactive', 'suspended', 'trial'],
                description: 'Subscription status'
            },
            endDate: {
                type: 'string',
                format: 'date-time',
                description: 'Subscription end date'
            }
        }
    },
    SubscriptionPlan: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                enum: ['basic', 'premium', 'enterprise'],
                description: 'Plan name'
            },
            displayName: {
                type: 'string',
                description: 'Plan display name'
            },
            description: {
                type: 'string',
                description: 'Plan description'
            },
            maxEmployees: {
                type: 'number',
                description: 'Maximum employees allowed'
            },
            maxVisitorsPerMonth: {
                type: 'number',
                description: 'Maximum visitors per month'
            },
            price: {
                type: 'number',
                description: 'Plan price in INR'
            },
            features: {
                type: 'array',
                items: {
                    type: 'string'
                },
                description: 'Plan features'
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
            subscriptionStatus: {
                type: 'string',
                description: 'Current subscription status'
            }
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
