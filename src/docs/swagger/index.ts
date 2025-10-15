import swaggerJsdoc from 'swagger-jsdoc';
import { userSchemas } from './schemas/user/user.schema';
import { userPaths } from './paths/user/user.paths';
import { employeeSchemas } from './schemas/employee/employee.schemas';
import { employeePaths } from './paths/employee/employee.paths';
import { appointmentSchemas } from './schemas/appointment/appointment.schema';
import { appointmentPaths } from './paths/appointment/appointment.paths';
import { visitorSchemas } from './schemas/visitor/visitor.schema';
import { visitorPaths } from './paths/visitor/visitor.paths';
import { subscriptionSchemas } from './schemas/subscription/subscription.schema';
import { subscriptionPaths } from './paths/subscription/subscription.paths';
import { userSubscriptionSchemas } from './schemas/userSubscription/userSubscription.schema';
import { userSubscriptionPaths } from './paths/userSubscription/userSubscription.paths';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gatekeeper Visitor Appointment System API',
      version: '1.0.0',
      description: 'SaaS visitor appointment management system with user authentication and appointment booking',
      contact: {
        name: 'API Support',
        email: 'support@gatekeeper.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        ...userSchemas,
        ...employeeSchemas,
        ...appointmentSchemas,
        ...visitorSchemas,
        ...subscriptionSchemas,
        ...userSubscriptionSchemas
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      }
    },
    paths: {
      ...userPaths,
      ...employeePaths,
      ...appointmentPaths,
      ...visitorPaths,
      ...subscriptionPaths,
      ...userSubscriptionPaths
    },
    tags: [
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Employee',
        description: 'Employee management endpoints'
      },
      {
        name: 'Appointments',
        description: 'Appointment booking and management endpoints'
      },
      {
        name: 'Visitor',
        description: 'Visitor management endpoints'
      },
      {
        name: 'Subscription Plans',
        description: 'Subscription plan management endpoints'
      },
      {
        name: 'User Subscriptions',
        description: 'User subscription management endpoints'
      },
      {
        name: 'Stripe Integration',
        description: 'Stripe payment and webhook integration endpoints'
      }
    ]
  },
  apis: ['./src/routes/**/*.ts'], // Path to the API files
};

export const swaggerSpec = swaggerJsdoc(options);
