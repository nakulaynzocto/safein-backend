import swaggerJsdoc from 'swagger-jsdoc';
import { userSchemas } from './schemas/user/user.schema';
import { userPaths } from './paths/user/user.paths';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My Project API',
      version: '1.0.0',
      description: 'A simple Node.js backend with user management',
      contact: {
        name: 'API Support',
        email: 'support@myproject.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server'
      }
    ],
    components: {
      schemas: userSchemas,
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      }
    },
    paths: userPaths,
    tags: [
      {
        name: 'Users',
        description: 'User management endpoints'
      }
    ]
  },
  apis: ['./src/routes/**/*.ts'], // Path to the API files
};

export const swaggerSpec = swaggerJsdoc(options);
