export const userSchemas = {
  User: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        description: 'User ID'
      },
      companyName: {
        type: 'string',
        description: 'Company name'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      profilePicture: {
        type: 'string',
        description: 'User profile picture URL'
      },
      isEmailVerified: {
        type: 'boolean',
        description: 'Email verification status'
      },
      isPhoneVerified: {
        type: 'boolean',
        description: 'Phone verification status'
      },
      isActive: {
        type: 'boolean',
        description: 'Account active status'
      },
      isDeleted: {
        type: 'boolean',
        description: 'Whether the user is soft deleted'
      },
      deletedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Date when the user was deleted'
      },
      deletedBy: {
        type: 'string',
        description: 'User ID who deleted this user'
      },
      lastLoginAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last login timestamp'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Account creation timestamp'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last update timestamp'
      }
    }
  },
  CreateUser: {
    type: 'object',
    required: ['companyName', 'email', 'password'],
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
        description: 'User email address'
      },
      password: {
        type: 'string',
        minLength: 6,
        description: 'User password'
      }
    }
  },
  UpdateUser: {
    type: 'object',
    properties: {
      profilePicture: {
        type: 'string',
        format: 'uri',
        description: 'User profile picture URL'
      }
    }
  },
  LoginUser: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      password: {
        type: 'string',
        description: 'User password'
      }
    }
  },
  ChangePassword: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: {
        type: 'string',
        description: 'Current password'
      },
      newPassword: {
        type: 'string',
        minLength: 6,
        description: 'New password'
      }
    }
  },
  ForgotPassword: {
    type: 'object',
    required: ['email'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      }
    }
  },
  ResetPassword: {
    type: 'object',
    required: ['token', 'newPassword'],
    properties: {
      token: {
        type: 'string',
        description: 'Password reset token'
      },
      newPassword: {
        type: 'string',
        minLength: 6,
        description: 'New password'
      }
    }
  },
  LoginResponse: {
    type: 'object',
    properties: {
      user: {
        $ref: '#/components/schemas/User'
      },
      token: {
        type: 'string',
        description: 'JWT authentication token'
      }
    }
  },
  UsersList: {
    type: 'object',
    properties: {
      users: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/User'
        }
      },
      total: {
        type: 'number',
        description: 'Total number of users'
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
  ApiResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: 'Request success status'
      },
      message: {
        type: 'string',
        description: 'Response message'
      },
      data: {
        type: 'object',
        description: 'Response data'
      },
      statusCode: {
        type: 'number',
        description: 'HTTP status code'
      }
    }
  }
};
