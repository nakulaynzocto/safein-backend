export const appointmentSchemas = {
    Appointment: {
        type: 'object',
        properties: {
            _id: {
                type: 'string',
                description: 'Appointment unique identifier (MongoDB _id)',
                example: '64f1a2b3c4d5e6f7g8h9i0j1',
                pattern: '^[0-9a-fA-F]{24}$'
            },
            employeeId: {
                type: 'string',
                description: 'Employee MongoDB ObjectId reference',
                example: '64f1a2b3c4d5e6f7g8h9i0j2',
                pattern: '^[0-9a-fA-F]{24}$'
            },
            visitorId: {
                type: 'string',
                description: 'Visitor MongoDB ObjectId reference',
                example: '64f1a2b3c4d5e6f7g8h9i0j3',
                pattern: '^[0-9a-fA-F]{24}$'
            },
            visitor: {
                type: 'object',
                description: 'Populated visitor details (when requested)',
                properties: {
                    _id: {
                        type: 'string',
                        description: 'Visitor unique identifier (MongoDB _id)',
                        example: '64f1a2b3c4d5e6f7g8h9i0j3'
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
                        example: 'john.doe@example.com'
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
                        }
                    },
                    idProof: {
                        type: 'object',
                        properties: {
                            type: {
                                type: 'string',
                                enum: ['aadhaar', 'pan', 'driving_license', 'passport', 'other'],
                                description: 'Type of ID proof',
                                example: 'aadhaar'
                            },
                            number: {
                                type: 'string',
                                description: 'ID proof number',
                                example: '123456789012'
                            },
                            image: {
                                type: 'string',
                                format: 'uri',
                                description: 'ID proof image URL',
                                example: 'https://example.com/id-proof.jpg'
                            }
                        }
                    },
                    photo: {
                        type: 'string',
                        format: 'uri',
                        description: 'Visitor photo URL',
                        example: 'https://example.com/visitor-photo.jpg'
                    }
                }
            },
            accompaniedBy: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Accompanied by name',
                        example: 'Jane Doe'
                    },
                    phone: {
                        type: 'string',
                        description: 'Accompanied by phone',
                        example: '+1234567891'
                    },
                    relation: {
                        type: 'string',
                        description: 'Relation to visitor',
                        example: 'Spouse'
                    },
                    idProof: {
                        type: 'object',
                        properties: {
                            type: {
                                type: 'string',
                                enum: ['aadhaar', 'pan', 'driving_license', 'passport', 'other'],
                                description: 'Type of ID proof',
                                example: 'aadhaar'
                            },
                            number: {
                                type: 'string',
                                description: 'ID proof number',
                                example: '987654321098'
                            },
                            image: {
                                type: 'string',
                                format: 'uri',
                                description: 'ID proof image URL',
                                example: 'https://example.com/accompanied-id.jpg'
                            }
                        }
                    }
                }
            },
            appointmentDetails: {
                type: 'object',
                properties: {
                    purpose: {
                        type: 'string',
                        description: 'Purpose of appointment',
                        example: 'Business Meeting'
                    },
                    scheduledDate: {
                        type: 'string',
                        format: 'date',
                        description: 'Scheduled date',
                        example: '2024-01-15'
                    },
                    scheduledTime: {
                        type: 'string',
                        pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
                        description: 'Scheduled time (HH:MM)',
                        example: '14:30'
                    },
                    notes: {
                        type: 'string',
                        description: 'Additional notes',
                        example: 'Discuss project timeline and deliverables'
                    }
                }
            },
            status: {
                type: 'string',
                enum: ['scheduled', 'checked_in', 'in_meeting', 'completed', 'cancelled', 'no_show'],
                description: 'Appointment status',
                example: 'scheduled'
            },
            checkInTime: {
                type: 'string',
                format: 'date-time',
                description: 'Check-in timestamp',
                example: '2024-01-15T14:30:00.000Z'
            },
            checkOutTime: {
                type: 'string',
                format: 'date-time',
                description: 'Check-out timestamp',
                example: '2024-01-15T15:30:00.000Z'
            },
            actualDuration: {
                type: 'number',
                description: 'Actual duration in minutes',
                example: 60
            },
            securityDetails: {
                type: 'object',
                properties: {
                    badgeIssued: {
                        type: 'boolean',
                        description: 'Whether badge was issued',
                        example: true
                    },
                    badgeNumber: {
                        type: 'string',
                        description: 'Badge number',
                        example: 'BADGE001'
                    },
                    securityClearance: {
                        type: 'boolean',
                        description: 'Security clearance status',
                        example: true
                    },
                    securityNotes: {
                        type: 'string',
                        description: 'Security notes',
                        example: 'Visitor cleared security check'
                    }
                }
            },
            notifications: {
                type: 'object',
                properties: {
                    smsSent: {
                        type: 'boolean',
                        description: 'SMS notification sent',
                        example: true
                    },
                    emailSent: {
                        type: 'boolean',
                        description: 'Email notification sent',
                        example: true
                    },
                    whatsappSent: {
                        type: 'boolean',
                        description: 'WhatsApp notification sent',
                        example: false
                    },
                    reminderSent: {
                        type: 'boolean',
                        description: 'Reminder notification sent',
                        example: true
                    }
                }
            },
            createdBy: {
                type: 'string',
                description: 'User ID who created the appointment',
                example: '64f1a2b3c4d5e6f7g8h9i0j3'
            },
            isDeleted: {
                type: 'boolean',
                description: 'Whether appointment is soft deleted',
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
                description: 'User ID who deleted the appointment',
                example: null
            },
            createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Creation timestamp',
                example: '2024-01-15T10:00:00.000Z'
            },
            updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Last update timestamp',
                example: '2024-01-15T14:30:00.000Z'
            }
        }
    },
    CreateAppointment: {
        type: 'object',
        required: ['employeeId', 'visitorId', 'appointmentDetails'],
        properties: {
            employeeId: {
                type: 'string',
                description: 'Employee ID for the appointment',
                example: '64f1a2b3c4d5e6f7g8h9i0j2'
            },
            visitorId: {
                type: 'string',
                pattern: '^[0-9a-fA-F]{24}$',
                description: 'Visitor ID for the appointment',
                example: '64f1a2b3c4d5e6f7g8h9i0j3'
            },
            accompaniedBy: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        maxLength: 100,
                        description: 'Accompanied by name',
                        example: 'Jane Doe'
                    },
                    phone: {
                        type: 'string',
                        pattern: '^[\\+]?[1-9][\\d]{0,15}$',
                        description: 'Accompanied by phone',
                        example: '+1234567891'
                    },
                    relation: {
                        type: 'string',
                        maxLength: 50,
                        description: 'Relation to visitor',
                        example: 'Spouse'
                    },
                    idProof: {
                        type: 'object',
                        properties: {
                            type: {
                                type: 'string',
                                enum: ['aadhaar', 'pan', 'driving_license', 'passport', 'other'],
                                description: 'Type of ID proof',
                                example: 'aadhaar'
                            },
                            number: {
                                type: 'string',
                                description: 'ID proof number',
                                example: '987654321098'
                            },
                            image: {
                                type: 'string',
                                format: 'uri',
                                description: 'ID proof image URL',
                                example: 'https://example.com/accompanied-id.jpg'
                            }
                        }
                    }
                }
            },
            appointmentDetails: {
                type: 'object',
                required: ['purpose', 'scheduledDate', 'scheduledTime'],
                properties: {
                    purpose: {
                        type: 'string',
                        maxLength: 200,
                        description: 'Purpose of appointment',
                        example: 'Business Meeting'
                    },
                    scheduledDate: {
                        type: 'string',
                        format: 'date',
                        description: 'Scheduled date',
                        example: '2024-01-15'
                    },
                    scheduledTime: {
                        type: 'string',
                        pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
                        description: 'Scheduled time (HH:MM)',
                        example: '14:30'
                    },
                    notes: {
                        type: 'string',
                        maxLength: 500,
                        description: 'Additional notes',
                        example: 'Discuss project timeline and deliverables'
                    }
                }
            },
            securityDetails: {
                type: 'object',
                properties: {
                    badgeIssued: {
                        type: 'boolean',
                        description: 'Whether badge was issued',
                        example: false
                    },
                    badgeNumber: {
                        type: 'string',
                        description: 'Badge number',
                        example: 'BADGE001'
                    },
                    securityClearance: {
                        type: 'boolean',
                        description: 'Security clearance status',
                        example: false
                    },
                    securityNotes: {
                        type: 'string',
                        maxLength: 200,
                        description: 'Security notes',
                        example: 'Visitor cleared security check'
                    }
                }
            },
            notifications: {
                type: 'object',
                properties: {
                    smsSent: {
                        type: 'boolean',
                        description: 'SMS notification sent',
                        example: false
                    },
                    emailSent: {
                        type: 'boolean',
                        description: 'Email notification sent',
                        example: false
                    },
                    whatsappSent: {
                        type: 'boolean',
                        description: 'WhatsApp notification sent',
                        example: false
                    },
                    reminderSent: {
                        type: 'boolean',
                        description: 'Reminder notification sent',
                        example: false
                    }
                }
            }
        }
    },
    UpdateAppointment: {
        type: 'object',
        properties: {
            employeeId: {
                type: 'string',
                description: 'Employee ID for the appointment',
                example: '64f1a2b3c4d5e6f7g8h9i0j2'
            },
            visitorId: {
                type: 'string',
                pattern: '^[0-9a-fA-F]{24}$',
                description: 'Visitor ID for the appointment',
                example: '64f1a2b3c4d5e6f7g8h9i0j3'
            },
            appointmentDetails: {
                type: 'object',
                properties: {
                    purpose: {
                        type: 'string',
                        maxLength: 200,
                        description: 'Purpose of appointment',
                        example: 'Business Meeting'
                    },
                    scheduledDate: {
                        type: 'string',
                        format: 'date',
                        description: 'Scheduled date',
                        example: '2024-01-15'
                    },
                    scheduledTime: {
                        type: 'string',
                        pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
                        description: 'Scheduled time (HH:MM)',
                        example: '14:30'
                    },
                    notes: {
                        type: 'string',
                        maxLength: 500,
                        description: 'Additional notes',
                        example: 'Discuss project timeline and deliverables'
                    }
                }
            },
            status: {
                type: 'string',
                enum: ['scheduled', 'checked_in', 'in_meeting', 'completed', 'cancelled', 'no_show'],
                description: 'Appointment status',
                example: 'scheduled'
            },
            securityDetails: {
                type: 'object',
                properties: {
                    badgeIssued: {
                        type: 'boolean',
                        description: 'Whether badge was issued',
                        example: true
                    },
                    badgeNumber: {
                        type: 'string',
                        description: 'Badge number',
                        example: 'BADGE001'
                    },
                    securityClearance: {
                        type: 'boolean',
                        description: 'Security clearance status',
                        example: true
                    },
                    securityNotes: {
                        type: 'string',
                        maxLength: 200,
                        description: 'Security notes',
                        example: 'Visitor cleared security check'
                    }
                }
            },
            notifications: {
                type: 'object',
                properties: {
                    smsSent: {
                        type: 'boolean',
                        description: 'SMS notification sent',
                        example: true
                    },
                    emailSent: {
                        type: 'boolean',
                        description: 'Email notification sent',
                        example: true
                    },
                    whatsappSent: {
                        type: 'boolean',
                        description: 'WhatsApp notification sent',
                        example: false
                    },
                    reminderSent: {
                        type: 'boolean',
                        description: 'Reminder notification sent',
                        example: true
                    }
                }
            }
        }
    },
    CheckInRequest: {
        type: 'object',
        required: ['appointmentId'],
        properties: {
            appointmentId: {
                type: 'string',
                description: 'Appointment ID (MongoDB _id)',
                example: '64f1a2b3c4d5e6f7g8h9i0j1'
            },
            badgeNumber: {
                type: 'string',
                description: 'Badge number issued to visitor',
                example: 'BADGE001'
            },
            securityNotes: {
                type: 'string',
                maxLength: 200,
                description: 'Security notes',
                example: 'Visitor cleared security check'
            }
        }
    },
    CheckOutRequest: {
        type: 'object',
        required: ['appointmentId'],
        properties: {
            appointmentId: {
                type: 'string',
                description: 'Appointment ID (MongoDB _id)',
                example: '64f1a2b3c4d5e6f7g8h9i0j1'
            },
            notes: {
                type: 'string',
                maxLength: 500,
                description: 'Check-out notes',
                example: 'Meeting completed successfully'
            }
        }
    },
    AppointmentListResponse: {
        type: 'object',
        properties: {
            appointments: {
                type: 'array',
                items: {
                    $ref: '#/components/schemas/Appointment'
                }
            },
            pagination: {
                type: 'object',
                properties: {
                    currentPage: {
                        type: 'number',
                        description: 'Current page number',
                        example: 1
                    },
                    totalPages: {
                        type: 'number',
                        description: 'Total number of pages',
                        example: 5
                    },
                    totalAppointments: {
                        type: 'number',
                        description: 'Total number of appointments',
                        example: 50
                    },
                    hasNextPage: {
                        type: 'boolean',
                        description: 'Whether there is a next page',
                        example: true
                    },
                    hasPrevPage: {
                        type: 'boolean',
                        description: 'Whether there is a previous page',
                        example: false
                    }
                }
            }
        }
    },
    AppointmentStats: {
        type: 'object',
        properties: {
            totalAppointments: {
                type: 'number',
                description: 'Total appointments',
                example: 150
            },
            scheduledAppointments: {
                type: 'number',
                description: 'Scheduled appointments',
                example: 45
            },
            checkedInAppointments: {
                type: 'number',
                description: 'Checked in appointments',
                example: 12
            },
            completedAppointments: {
                type: 'number',
                description: 'Completed appointments',
                example: 80
            },
            cancelledAppointments: {
                type: 'number',
                description: 'Cancelled appointments',
                example: 8
            },
            noShowAppointments: {
                type: 'number',
                description: 'No show appointments',
                example: 5
            },
            appointmentsByStatus: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            description: 'Appointment status',
                            example: 'scheduled'
                        },
                        count: {
                            type: 'number',
                            description: 'Number of appointments',
                            example: 45
                        }
                    }
                }
            },
            appointmentsByEmployee: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        employeeId: {
                            type: 'string',
                            description: 'Employee ID',
                            example: '64f1a2b3c4d5e6f7g8h9i0j2'
                        },
                        employeeName: {
                            type: 'string',
                            description: 'Employee name',
                            example: 'John Smith'
                        },
                        count: {
                            type: 'number',
                            description: 'Number of appointments',
                            example: 15
                        }
                    }
                }
            },
            appointmentsByDate: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        date: {
                            type: 'string',
                            format: 'date',
                            description: 'Date',
                            example: '2024-01-15'
                        },
                        count: {
                            type: 'number',
                            description: 'Number of appointments',
                            example: 8
                        }
                    }
                }
            }
        }
    },
    AppointmentCalendar: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                date: {
                    type: 'string',
                    format: 'date',
                    description: 'Date',
                    example: '2024-01-15'
                },
                appointments: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            appointmentId: {
                                type: 'string',
                                description: 'Appointment ID (MongoDB _id)',
                                example: '64f1a2b3c4d5e6f7g8h9i0j1'
                            },
                            visitorName: {
                                type: 'string',
                                description: 'Visitor name',
                                example: 'John Doe'
                            },
                            employeeName: {
                                type: 'string',
                                description: 'Employee name',
                                example: 'Jane Smith'
                            },
                            scheduledTime: {
                                type: 'string',
                                description: 'Scheduled time',
                                example: '14:30'
                            },
                            status: {
                                type: 'string',
                                enum: ['scheduled', 'checked_in', 'in_meeting', 'completed', 'cancelled', 'no_show'],
                                description: 'Appointment status',
                                example: 'scheduled'
                            },
                            purpose: {
                                type: 'string',
                                description: 'Purpose of appointment',
                                example: 'Business Meeting'
                            }
                        }
                    }
                }
            }
        }
    },
    AppointmentSearchRequest: {
        type: 'object',
        required: ['query', 'type'],
        properties: {
            query: {
                type: 'string',
                minLength: 1,
                description: 'Search query',
                example: 'John Doe'
            },
            type: {
                type: 'string',
                enum: ['visitor_name', 'visitor_phone', 'visitor_email', 'appointment_id', 'employee_name'],
                description: 'Search type',
                example: 'visitor_name'
            },
            page: {
                type: 'number',
                minimum: 1,
                default: 1,
                description: 'Page number',
                example: 1
            },
            limit: {
                type: 'number',
                minimum: 1,
                maximum: 100,
                default: 10,
                description: 'Number of results per page',
                example: 10
            }
        }
    },
    BulkUpdateAppointments: {
        type: 'object',
        required: ['appointmentIds'],
        properties: {
            appointmentIds: {
                type: 'array',
                items: {
                    type: 'string',
                    pattern: '^[0-9a-fA-F]{24}$'
                },
                minItems: 1,
                description: 'Array of appointment IDs to update',
                example: ['64f1a2b3c4d5e6f7g8h9i0j1', '64f1a2b3c4d5e6f7g8h9i0j2']
            },
            status: {
                type: 'string',
                enum: ['scheduled', 'checked_in', 'in_meeting', 'completed', 'cancelled', 'no_show'],
                description: 'New status for appointments',
                example: 'completed'
            },
            employeeId: {
                type: 'string',
                pattern: '^[0-9a-fA-F]{24}$',
                description: 'New employee ID for appointments',
                example: '64f1a2b3c4d5e6f7g8h9i0j2'
            }
        }
    },
    BulkUpdateResponse: {
        type: 'object',
        properties: {
            updatedCount: {
                type: 'number',
                description: 'Number of appointments updated',
                example: 5
            }
        }
    }
};
