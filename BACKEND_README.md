# PDRV Backend API

Backend REST API for the Appointment Management System (Prise de Rendez-vous) - A comprehensive Node.js/Express-based solution for managing appointments, clients, workflows, and document processing.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Development](#development)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## 🎯 Overview

The PDRV Backend is a robust Express.js server providing RESTful API endpoints for a complete appointment management system. It handles user management, appointment scheduling, client profiles, document processing with OCR, workflow management, notifications, and role-based access control with JWT authentication.

## ✨ Features

- **👤 User & Role Management** - Comprehensive authentication with role-based access control (RBAC)
- **📅 Appointment Management** - Schedule, manage, and track appointments
- **👥 Client Management** - Client profile management and interaction history
- **📄 Document Processing** - OCR integration for text extraction (Arabic, English, French support)
- **🔄 Workflow Management** - Customizable workflow states and transitions
- **📁 File Management** - Secure file storage and retrieval
- **🔔 Notifications** - Email and in-app notification system
- **⏰ Availability Management** - Configure business hours and availability slots
- **🔐 JWT Authentication** - Secure API endpoints with Passport.js integration
- **📤 Large File Support** - Upload files up to 1GB with automatic OCR processing

## 🛠 Tech Stack

| Component | Technology |
|-----------|-----------|
| **Runtime** | Node.js (v14+) |
| **Framework** | Express.js |
| **Authentication** | Passport.js + JWT |
| **Security** | CORS, Body-parser, HTTPS (production) |
| **OCR** | Tesseract.js with trained data files |
| **Architecture** | Business Object (BO) + Controller pattern |
| **Template Engine** | EJS |

## 📂 Project Structure

```
pdrv-back/api/
├── app/
│   ├── bo/                           # Business Logic Objects
│   │   ├── basebo.js                 # Base BO class with common methods
│   │   ├── usersbo.js                # User management logic
│   │   ├── clientsbo.js              # Client management logic
│   │   ├── pdrvbo.js                 # Appointment management logic
│   │   ├── workflowbo.js             # Workflow state management
│   │   ├── notificationbo.js         # Notification handling
│   │   ├── availabilitybo.js         # Availability slot management
│   │   ├── efilesbo.js               # File operations & OCR
│   │   └── rolesbo.js                # Role management
│   │
│   ├── controllers/                  # Express route handlers
│   │   ├── users.controller.js
│   │   ├── clients.controller.js
│   │   ├── pdrv.controller.js
│   │   ├── workflow.controller.js
│   │   ├── notification.controller.js
│   │   ├── availability.controller.js
│   │   ├── efiles.controller.js
│   │   └── roles.controller.js
│   │
│   ├── services/                     # Business services & utilities
│   │   └── passportStrategy.js       # JWT authentication setup
│   │
│   ├── routes/                       # API route definitions
│   ├── models/                       # Database models/schemas
│   ├── migrations/                   # Database schema migrations
│   ├── helpers/                      # Utility functions & constants
│   │   ├── app.js                    # Application helpers
│   │   ├── consts.js                 # Constants
│   │   └── helpers.js                # General utilities
│   ├── config/                       # Configuration files
│   │   ├── app.config.js             # App configuration
│   │   └── config.json               # Environment config
│   ├── providers/                    # External service providers
│   ├── resources/                    # Static resources
│   ├── views/                        # EJS view templates
│   └── sub_apps/                     # Sub-application modules
│
├── server.js                         # Express server entry point
├── package.json                      # NPM dependencies
├── .nvmrc                            # Node version specification
├── ara.traineddata                   # OCR training data - Arabic
├── eng.traineddata                   # OCR training data - English
├── fra.traineddata                   # OCR training data - French
└── [other config files]
```

## 🚀 Installation

### Prerequisites

- **Node.js**: v14 or higher (check `.nvmrc`)
- **npm**: v6 or higher
- **Database**: Configure according to your `config.json`
- **Environment Variables**: As specified in configuration

### Quick Start

1. **Navigate to backend directory**:
   ```bash
   cd pdrv-back/api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   - Update `app/config/config.json` with database settings
   - Set environment variables in `app/config/app.config.js`
   - Ensure OCR data files are in place (ara.traineddata, eng.traineddata, fra.traineddata)

4. **Run database migrations** (if applicable):
   ```bash
   npm run migrate
   ```

5. **Start the server**:
   ```bash
   npm start
   ```
   Default: `http://localhost:3000`

## ⚙️ Configuration

### `app/config/config.json`

```json
{
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "pdrv_db",
    "user": "postgres",
    "password": "password"
  },
  "jwt": {
    "secret": "your-secret-key",
    "expiresIn": "24h"
  },
  "cors": {
    "origin": ["http://localhost:3000", "https://yourdomain.com"]
  },
  "files": {
    "maxSize": "1GB",
    "uploadDir": "./uploads"
  }
}
```

### Environment Variables

Create a `.env` file in the `api` directory:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pdrv_db
DB_USER=postgres
DB_PASSWORD=secure_password
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000
FILE_UPLOAD_LIMIT=1gb
DEBUG_MODE=false
```

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | User login |
| `POST` | `/auth/logout` | User logout |
| `POST` | `/auth/refresh` | Refresh JWT token |
| `POST` | `/auth/register` | Register new user |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users` | List all users (paginated) |
| `POST` | `/users` | Create new user |
| `GET` | `/users/:id` | Get user details |
| `PUT` | `/users/:id` | Update user |
| `DELETE` | `/users/:id` | Delete user |
| `GET` | `/users/:id/appointments` | Get user's appointments |

### Clients

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/clients` | List all clients (paginated) |
| `POST` | `/clients` | Create new client |
| `GET` | `/clients/:id` | Get client details |
| `PUT` | `/clients/:id` | Update client |
| `DELETE` | `/clients/:id` | Delete client |
| `GET` | `/clients/:id/history` | Get client interaction history |

### Appointments (PDRV)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/appointments` | List appointments (with filters) |
| `POST` | `/appointments` | Create appointment |
| `GET` | `/appointments/:id` | Get appointment details |
| `PUT` | `/appointments/:id` | Update appointment |
| `DELETE` | `/appointments/:id` | Cancel appointment |
| `PUT` | `/appointments/:id/status` | Update appointment status |

### Files (E-Files)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/files/upload` | Upload file with OCR processing |
| `GET` | `/files` | List files |
| `GET` | `/files/:id` | Download file |
| `GET` | `/files/:id/ocr-text` | Get OCR extracted text |
| `DELETE` | `/files/:id` | Delete file |

### Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/workflows` | List workflows |
| `POST` | `/workflows` | Create workflow |
| `GET` | `/workflows/:id` | Get workflow details |
| `PUT` | `/workflows/:id` | Update workflow |
| `GET` | `/workflows/:id/states` | Get workflow states |

### Availability

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/availability` | Get availability slots |
| `POST` | `/availability` | Set availability |
| `GET` | `/availability/business-hours` | Get business hours |
| `PUT` | `/availability/:id` | Update availability slot |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/notifications` | Get user notifications |
| `POST` | `/notifications` | Create notification |
| `PUT` | `/notifications/:id/read` | Mark as read |
| `DELETE` | `/notifications/:id` | Delete notification |

### Roles

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/roles` | List all roles |
| `POST` | `/roles` | Create role |
| `GET` | `/roles/:id` | Get role details |
| `PUT` | `/roles/:id` | Update role |
| `PUT` | `/roles/:id/permissions` | Update role permissions |

## 🔐 Authentication

### JWT Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Obtaining a Token

**Login Request**:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "admin"
  }
}
```

### Token Refresh

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Authorization: Bearer <refresh_token>"
```

## 🧪 Development

### Development Mode

```bash
npm run dev
```

### Available npm Scripts

```bash
npm start          # Start production server
npm run dev        # Start with nodemon (hot reload)
npm run migrate    # Run database migrations
npm run seed       # Seed database with test data
npm test           # Run test suite
npm run lint       # Run ESLint
```

### Debugging

Enable debug logging by setting `DEBUG_MODE=true` in `.env`. Logs will be written to `log_request.log`.

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🔒 Security

### Best Practices

✅ **Do's**:
- Always use HTTPS in production
- Keep JWT secrets secure and rotate regularly
- Validate and sanitize all user inputs
- Implement rate limiting on API endpoints
- Use environment variables for sensitive data
- Enable CORS only for trusted origins
- Regularly update dependencies: `npm audit fix`
- Log security events for monitoring
- Use parameterized queries to prevent SQL injection
- Implement request size limits

❌ **Don'ts**:
- Never commit `.env` or secrets to version control
- Don't expose JWT secrets in client-side code
- Don't disable CORS for security testing in production
- Don't use weak passwords or tokens
- Don't log sensitive information
- Don't allow unrestricted file uploads

### CORS Configuration

Configure allowed origins in `app/config/config.json`:

```json
{
  "cors": {
    "origin": ["https://yourdomain.com", "https://app.yourdomain.com"],
    "credentials": true,
    "methods": ["GET", "POST", "PUT", "DELETE"]
  }
}
```

## 📋 Error Handling

Standard HTTP Status Codes:

| Code | Meaning |
|------|---------|
| `200` | OK - Success |
| `201` | Created - Resource created successfully |
| `204` | No Content - Success with no response body |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Missing/invalid token |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `409` | Conflict - Resource conflict |
| `422` | Unprocessable Entity - Validation error |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error - Server error |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "statusCode": 404
  }
}
```

## 📤 File Upload with OCR

### Upload Endpoint

```bash
curl -X POST http://localhost:3000/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  -F "language=fra"
```

### Supported OCR Languages

| Code | Language |
|------|----------|
| `ara` | العربية (Arabic) |
| `eng` | English |
| `fra` | Français (French) |

### Response

```json
{
  "success": true,
  "data": {
    "id": "file_123",
    "filename": "document.pdf",
    "size": 204800,
    "uploadedAt": "2024-01-15T10:30:00Z",
    "ocrText": "Extracted text from document...",
    "language": "fra"
  }
}
```

## 🆘 Troubleshooting

### Common Issues

**Database Connection Error**
```
Error: ECONNREFUSED 127.0.0.1:5432
```
Solution: Ensure database is running and credentials in `config.json` are correct.

**JWT Token Expired**
```
Error: Token has expired
```
Solution: Use the refresh token endpoint to get a new token.

**Port Already in Use**
```
Error: EADDRINUSE: address already in use :::3000
```
Solution: Change port in `.env` or kill process using port 3000.

**OCR Files Not Found**
```
Error: Cannot find traineddata files
```
Solution: Ensure `ara.traineddata`, `eng.traineddata`, and `fra.traineddata` are in the `api` directory.

### Debug Checklist

- [ ] Check `.env` file is correctly configured
- [ ] Verify database connection
- [ ] Ensure all dependencies are installed (`npm install`)
- [ ] Check Node.js version matches `.nvmrc`
- [ ] Review logs in `log_request.log` (if debug enabled)
- [ ] Verify JWT secret is set
- [ ] Check file permissions for upload directory
- [ ] Run `npm audit` for vulnerability issues

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Passport.js Strategies](http://www.passportjs.org/)
- [JWT Introduction](https://jwt.io/introduction)
- [Tesseract.js OCR](https://github.com/naptha/tesseract.js)

## 📝 License

This project is proprietary and confidential. All rights reserved.

---

**Need Help?** Contact the development team or check the project documentation.
