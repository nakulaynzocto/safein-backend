export const subscriptionPaths = {
  '/subscription-plans': {
    post: {
      tags: ['Subscription Plans'],
      summary: 'Create a new subscription plan',
      description: 'Create a new subscription plan with the provided details',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateSubscriptionPlan'
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Subscription plan created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Subscription plan created successfully' },
                  data: { $ref: '#/components/schemas/SubscriptionPlan' },
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
          description: 'Conflict - subscription plan with this name already exists',
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
      tags: ['Subscription Plans'],
      summary: 'Get all subscription plans',
      description: 'Retrieve all subscription plans with pagination and filtering options',
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
          description: 'Number of plans per page',
          schema: { type: 'number', minimum: 1, maximum: 100, default: 10 }
        },
        {
          name: 'planType',
          in: 'query',
          description: 'Filter by plan type',
          schema: { type: 'string', enum: ['free', 'weekly', 'monthly', 'quarterly', 'yearly'] }
        },
        {
          name: 'isActive',
          in: 'query',
          description: 'Filter by active status',
          schema: { type: 'boolean' }
        },
        {
          name: 'isPopular',
          in: 'query',
          description: 'Filter by popular status',
          schema: { type: 'boolean' }
        },
        {
          name: 'sortBy',
          in: 'query',
          description: 'Sort by field',
          schema: { type: 'string', enum: ['name', 'amount', 'sortOrder', 'createdAt', 'updatedAt'], default: 'sortOrder' }
        },
        {
          name: 'sortOrder',
          in: 'query',
          description: 'Sort order',
          schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' }
        }
      ],
      responses: {
        200: {
          description: 'Subscription plans retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Subscription plans retrieved successfully' },
                  data: { $ref: '#/components/schemas/SubscriptionPlanList' },
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
  '/subscription-plans/stats': {
    get: {
      tags: ['Subscription Plans'],
      summary: 'Get subscription plan statistics',
      description: 'Retrieve statistics about subscription plans',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Statistics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Subscription plan statistics retrieved successfully' },
                  data: { $ref: '#/components/schemas/SubscriptionPlanStats' },
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
  '/subscription-plans/popular': {
    get: {
      tags: ['Subscription Plans'],
      summary: 'Get popular subscription plans',
      description: 'Retrieve all subscription plans marked as popular',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Popular subscription plans retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Popular subscription plans retrieved successfully' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/SubscriptionPlan' }
                  },
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
  '/subscription-plans/type/{planType}': {
    get: {
      tags: ['Subscription Plans'],
      summary: 'Get subscription plans by type',
      description: 'Retrieve all subscription plans of a specific type',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'planType',
          in: 'path',
          required: true,
          description: 'Type of subscription plan',
          schema: { type: 'string', enum: ['free', 'weekly', 'monthly', 'quarterly', 'yearly'] }
        }
      ],
      responses: {
        200: {
          description: 'Subscription plans retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Subscription plans retrieved successfully' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/SubscriptionPlan' }
                  },
                  statusCode: { type: 'number', example: 200 }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad request - invalid plan type',
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
  '/subscription-plans/{id}': {
    get: {
      tags: ['Subscription Plans'],
      summary: 'Get subscription plan by ID',
      description: 'Retrieve a specific subscription plan by its ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Subscription plan ID',
          schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      ],
      responses: {
        200: {
          description: 'Subscription plan retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Subscription plan retrieved successfully' },
                  data: { $ref: '#/components/schemas/SubscriptionPlan' },
                  statusCode: { type: 'number', example: 200 }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad request - invalid ID format',
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
          description: 'Not found - subscription plan not found',
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
      tags: ['Subscription Plans'],
      summary: 'Update subscription plan',
      description: 'Update a specific subscription plan by its ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Subscription plan ID',
          schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateSubscriptionPlan'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Subscription plan updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Subscription plan updated successfully' },
                  data: { $ref: '#/components/schemas/SubscriptionPlan' },
                  statusCode: { type: 'number', example: 200 }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad request - validation error or invalid ID',
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
          description: 'Not found - subscription plan not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        409: {
          description: 'Conflict - subscription plan with this name already exists',
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
      tags: ['Subscription Plans'],
      summary: 'Delete subscription plan',
      description: 'Soft delete a specific subscription plan by its ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Subscription plan ID',
          schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      ],
      responses: {
        200: {
          description: 'Subscription plan deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Subscription plan deleted successfully' },
                  statusCode: { type: 'number', example: 200 }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad request - invalid ID format',
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
          description: 'Not found - subscription plan not found',
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
  '/subscription-plans/{id}/restore': {
    put: {
      tags: ['Subscription Plans'],
      summary: 'Restore subscription plan',
      description: 'Restore a soft-deleted subscription plan by its ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Subscription plan ID',
          schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      ],
      responses: {
        200: {
          description: 'Subscription plan restored successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Subscription plan restored successfully' },
                  data: { $ref: '#/components/schemas/SubscriptionPlan' },
                  statusCode: { type: 'number', example: 200 }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad request - invalid ID format',
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
          description: 'Not found - subscription plan not found',
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
