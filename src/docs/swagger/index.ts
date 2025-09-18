import swaggerJsdoc from 'swagger-jsdoc';
import { userSchemas } from './schemas/user/user.schema';
import { userPaths } from './paths/user/user.paths';
import { companySchemas } from './schemas/company/company.schema';
import { companyPaths } from './paths/company/company.paths';
import { employeeSchemas } from './schemas/employee/employee.schemas';
import { employeePaths } from './paths/employee/employee.paths';
import { appointmentSchemas } from './schemas/appointment/appointment.schema';
import { appointmentPaths } from './paths/appointment/appointment.paths';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gatekeeper Visitor Appointment System API',
      version: '1.0.0',
      description: 'SaaS multi-tenant visitor appointment management system with company management, user authentication, and appointment booking',
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
        ...companySchemas,
        ...employeeSchemas,
        ...appointmentSchemas
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
      ...companyPaths,
      ...employeePaths,
      ...appointmentPaths
    },
    tags: [
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Companies',
        description: 'Company management endpoints'
      },
      {
        name: 'Employee',
        description: 'Employee management endpoints'
      },
      {
        name: 'Appointments',
        description: 'Appointment booking and management endpoints'
      }
    ]
  },
  apis: ['./src/routes/**/*.ts'], // Path to the API files
};

export const swaggerSpec = swaggerJsdoc(options);
