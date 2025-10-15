export const userSubscriptionPaths = {
    '/user-subscriptions': {
        post: {
            tags: ['User Subscriptions'],
            summary: 'Create a new user subscription',
            description: 'Create a new subscription for a user',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/CreateUserSubscription'
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'User subscription created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'User subscription created successfully' },
                                    data: { $ref: '#/components/schemas/UserSubscription' },
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
                }
            }
        },
        get: {
            tags: ['User Subscriptions'],
            summary: 'Get user subscriptions',
            description: 'Retrieve a paginated list of user subscriptions with optional filtering',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'page',
                    in: 'query',
                    description: 'Page number for pagination',
                    schema: { type: 'number', minimum: 1, default: 1 }
                },
                {
                    name: 'limit',
                    in: 'query',
                    description: 'Number of subscriptions per page',
                    schema: { type: 'number', minimum: 1, maximum: 100, default: 10 }
                },
                {
                    name: 'userId',
                    in: 'query',
                    description: 'Filter by user ID',
                    schema: { type: 'string' }
                },
                {
                    name: 'planId',
                    in: 'query',
                    description: 'Filter by plan ID',
                    schema: { type: 'string' }
                },
                {
                    name: 'status',
                    in: 'query',
                    description: 'Filter by subscription status',
                    schema: { type: 'string', enum: ['active', 'inactive', 'cancelled', 'expired', 'trial'] }
                },
                {
                    name: 'isActive',
                    in: 'query',
                    description: 'Filter by active status',
                    schema: { type: 'boolean' }
                },
                {
                    name: 'sortBy',
                    in: 'query',
                    description: 'Sort by field',
                    schema: { type: 'string', enum: ['createdAt', 'updatedAt', 'startDate', 'endDate', 'amount'], default: 'createdAt' }
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
                    description: 'User subscriptions retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'User subscriptions retrieved successfully' },
                                    data: { $ref: '#/components/schemas/UserSubscriptionList' },
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
    '/user-subscriptions/stats': {
        get: {
            tags: ['User Subscriptions'],
            summary: 'Get subscription statistics',
            description: 'Retrieve comprehensive statistics about user subscriptions',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Subscription statistics retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Subscription statistics retrieved successfully' },
                                    data: { $ref: '#/components/schemas/UserSubscriptionStats' },
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
    '/user-subscriptions/assign-free-plan': {
        post: {
            tags: ['User Subscriptions'],
            summary: 'Assign free plan to user',
            description: 'Assigns a free subscription plan to a user',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/AssignFreePlanRequest'
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'Free plan assigned successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Free plan assigned successfully' },
                                    data: { $ref: '#/components/schemas/UserSubscription' },
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
                }
            }
        }
    },
    '/user-subscriptions/active/{userId}': {
        get: {
            tags: ['User Subscriptions'],
            summary: 'Get user\'s active subscription',
            description: 'Retrieves the active subscription for a specific user',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'userId',
                    in: 'path',
                    required: true,
                    description: 'User ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                }
            ],
            responses: {
                200: {
                    description: 'Active subscription retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Active subscription retrieved successfully' },
                                    data: { $ref: '#/components/schemas/UserSubscription' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'Not found - no active subscription found',
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
                }
            }
        }
    },
    '/user-subscriptions/check-premium/{userId}': {
        get: {
            tags: ['User Subscriptions'],
            summary: 'Check if user has premium subscription',
            description: 'Checks if a user has an active premium subscription',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'userId',
                    in: 'path',
                    required: true,
                    description: 'User ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                }
            ],
            responses: {
                200: {
                    description: 'Premium status checked successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Premium status checked successfully' },
                                    data: { $ref: '#/components/schemas/PremiumStatusResponse' },
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
    '/user-subscriptions/stripe/checkout': {
        post: {
            tags: ['Stripe Integration'],
            summary: 'Create Stripe checkout session',
            description: 'Creates a Stripe checkout session for subscription payment',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/StripeCheckoutRequest'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Checkout session created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Checkout session created successfully' },
                                    data: { $ref: '#/components/schemas/StripeCheckoutResponse' },
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
                }
            }
        }
    },
    '/user-subscriptions/stripe/webhook': {
        post: {
            tags: ['Stripe Integration'],
            summary: 'Handle Stripe webhook events',
            description: 'Processes Stripe webhook events for subscription lifecycle management',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            description: 'Raw Stripe webhook event payload'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Webhook event processed successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Webhook event processed successfully' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad request - invalid webhook signature or payload',
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
    '/user-subscriptions/stripe/subscription/{stripeSubscriptionId}': {
        get: {
            tags: ['Stripe Integration'],
            summary: 'Get Stripe subscription details',
            description: 'Retrieves subscription details from Stripe',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'stripeSubscriptionId',
                    in: 'path',
                    required: true,
                    description: 'Stripe subscription ID',
                    schema: { type: 'string' }
                }
            ],
            responses: {
                200: {
                    description: 'Stripe subscription details retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Stripe subscription details retrieved successfully' },
                                    data: {
                                        type: 'object',
                                        description: 'Stripe subscription object'
                                    },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'Not found - Stripe subscription not found',
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
                }
            }
        }
    },
    '/user-subscriptions/{id}': {
        get: {
            tags: ['User Subscriptions'],
            summary: 'Get user subscription by ID',
            description: 'Retrieve a specific user subscription by its ID',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'User subscription ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                }
            ],
            responses: {
                200: {
                    description: 'User subscription retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'User subscription retrieved successfully' },
                                    data: { $ref: '#/components/schemas/UserSubscription' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'Not found - user subscription not found',
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
                }
            }
        },
        put: {
            tags: ['User Subscriptions'],
            summary: 'Update user subscription',
            description: 'Update an existing user subscription',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'User subscription ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/UpdateUserSubscription'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'User subscription updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'User subscription updated successfully' },
                                    data: { $ref: '#/components/schemas/UserSubscription' },
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
                404: {
                    description: 'Not found - user subscription not found',
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
                }
            }
        },
        delete: {
            tags: ['User Subscriptions'],
            summary: 'Delete user subscription',
            description: 'Soft delete a user subscription',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'User subscription ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                }
            ],
            responses: {
                200: {
                    description: 'User subscription deleted successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'User subscription deleted successfully' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'Not found - user subscription not found',
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
                }
            }
        }
    },
    '/user-subscriptions/{id}/restore': {
        patch: {
            tags: ['User Subscriptions'],
            summary: 'Restore deleted user subscription',
            description: 'Restore a soft-deleted user subscription',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'User subscription ID',
                    schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
                }
            ],
            responses: {
                200: {
                    description: 'User subscription restored successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'User subscription restored successfully' },
                                    data: { $ref: '#/components/schemas/UserSubscription' },
                                    statusCode: { type: 'number', example: 200 }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'Not found - user subscription not found',
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
                }
            }
        }
    }
};
