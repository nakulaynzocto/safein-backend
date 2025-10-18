# My Project - User Management Backend

A simple Node.js/TypeScript backend application with user management functionality.

## 🚀 Features

- **User Registration & Authentication**: JWT-based authentication system
- **User Profile Management**: Complete CRUD operations for user profiles
- **Password Management**: Change password, forgot password, reset password
- **Admin Functions**: User management for administrators
- **API Documentation**: Swagger/OpenAPI documentation
- **Security**: Rate limiting, CORS, Helmet security headers
- **Validation**: Request validation using Joi
- **Error Handling**: Centralized error handling with proper HTTP status codes

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **Validation**: Joi
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate limiting

## 📁 Project Structure

```
my-project/
├── src/
│   ├── app.ts                 # Main application entry point
│   ├── config/
│   │   └── database.config.ts # MongoDB connection
│   ├── controllers/
│   │   ├── index.ts          # Export controllers
│   │   └── user/
│   │       └── user.controller.ts
│   ├── docs/
│   │   └── swagger/
│   │       ├── index.ts       # Swagger configuration
│   │       ├── paths/
│   │       │   └── user/
│   │       │       └── user.paths.ts
│   │       └── schemas/
│   │           └── user/
│   │               └── user.schema.ts
│   ├── middlewares/
│   │   ├── index.ts          # Export middlewares
│   │   ├── auth.middleware.ts # JWT authentication
│   │   ├── errorHandler.ts   # Global error handling
│   │   ├── notFoundHandler.ts # 404 handler
│   │   ├── rateLimiter.ts    # Rate limiting
│   │   └── validateRequest.ts # Request validation
│   ├── models/
│   │   ├── index.ts          # Export models
│   │   └── user/
│   │       └── user.model.ts
│   ├── routes/
│   │   ├── index.ts          # Main router
│   │   └── user/
│   │       └── user.routes.ts
│   ├── services/
│   │   ├── index.ts          # Export services
│   │   └── user/
│   │       └── user.service.ts
│   ├── types/
│   │   ├── index.ts          # Export types
│   │   └── user/
│   │       └── user.types.ts
│   ├── utils/
│   │   ├── index.ts          # Export utilities
│   │   ├── asyncHandler.util.ts # Async error handling
│   │   ├── constants.ts      # Application constants
│   │   ├── jwt.util.ts       # JWT utilities
│   │   └── response.util.ts  # Standardized responses
│   └── validations/
│       ├── index.ts          # Export validations
│       └── user/
│           └── user.validation.ts
├── package.json
├── tsconfig.json
├── env.example
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd my-project
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env
   MONGODB_URI=mongodb://localhost:27017/my-project-db
   JWT_SECRET=your-jwt-secret-key-change-this-in-production
   JWT_EXPIRATION=1d
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   # REQUIRED: Multiple frontend URLs (comma-separated)
   FRONTEND_URLS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Build the project**

   ```bash
   npm run build
   ```

6. **Start the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:3000`

## 📚 API Documentation

Once the server is running, you can access the API documentation at:

- **Swagger UI**: `http://localhost:3000/api-docs`

## 🔗 API Endpoints

### Authentication

- `POST /api/v1/users/register` - User registration
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/logout` - User logout

### User Management

- `GET /api/v1/users/profile` - Get current user profile
- `PUT /api/v1/users/profile` - Update user profile
- `POST /api/v1/users/change-password` - Change password

### Password Recovery

- `POST /api/v1/users/forgot-password` - Forgot password
- `POST /api/v1/users/reset-password` - Reset password

### Admin Operations

- `GET /api/v1/users` - Get all users (with pagination)
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user by ID
- `DELETE /api/v1/users/:id` - Delete user by ID

### Health Check

- `GET /api/v1/health` - Server health check

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📝 Request/Response Format

### Request Format

All requests should include:

- `Content-Type: application/json` header
- Valid JSON body for POST/PUT requests

### Response Format

All responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "statusCode": 200
}
```

## 🛡️ Security Features

- **Rate Limiting**: Prevents abuse with configurable limits
- **CORS**: Cross-origin resource sharing protection
- **Helmet**: Security headers
- **Input Validation**: Joi schema validation
- **Password Hashing**: bcryptjs for secure password storage
- **JWT Security**: Secure token-based authentication

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📦 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## 🚀 Deployment

1. **Build the project**

   ```bash
   npm run build
   ```

2. **Set production environment variables**

   ```bash
   export NODE_ENV=production
   export MONGODB_URI=your-production-mongodb-uri
   export JWT_SECRET=your-production-jwt-secret
   ```

3. **Start the server**
   ```bash
   npm start
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you have any questions or need help, please:

- Open an issue on GitHub
- Contact the development team
- Check the API documentation at `/api-docs`

## 🔄 Version History

- **v1.0.0** - Initial release with user management functionality
