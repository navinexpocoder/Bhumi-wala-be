/**
 * Swagger/OpenAPI Configuration
 * API Documentation
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Property Sales API Documentation',
      version: '1.0.0',
      description: 'Complete API documentation for the Property Selling application with authentication, geospatial queries, and role-based access control.',
      contact: {
        name: 'API Support',
        email: 'support@propertysales.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development Server',
      },
      {
        url: 'https://api.propertysales.com',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token for authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'User ID' },
            name: { type: 'string', description: 'User name' },
            email: { type: 'string', format: 'email', description: 'User email' },
            role: { type: 'string', enum: ['admin', 'seller', 'agent', 'user'], description: 'User role' },
            isActive: { type: 'boolean', description: 'Account active status' },
            isBlocked: { type: 'boolean', description: 'Account blocked status' },
            verified: { type: 'string', enum: ['pending', 'approve', 'reject'], description: 'Verification status' },
            age: { type: 'number', description: 'User age' },
            contact: { type: 'string', description: 'Contact number' },
            lastLogin: { type: 'string', format: 'date-time', description: 'Last login timestamp' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Property: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string', maxLength: 200 },
            description: { type: 'string' },
            price: { type: 'number', minimum: 0 },
            propertyType: {
              type: 'string',
              enum: ['Flat', 'House', 'Plot', 'Villa', 'Apartment', 'Commercial', 'Other'],
            },
            address: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'approved', 'sold'] },
            location: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['Point'] },
                coordinates: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
              },
            },
            images: { type: 'array', items: { type: 'string' }, maxItems: 10 },
            sellerId: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Location: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', description: 'City name' },
            state: { type: 'string', description: 'State name' },
            latitude: { type: 'number', minimum: -90, maximum: 90 },
            longitude: { type: 'number', minimum: -180, maximum: 180 },
            location: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['Point'] },
                coordinates: { type: 'array', items: { type: 'number' } },
              },
            },
          },
        },
        Lead: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string', description: 'User ID' },
            propertyId: { type: 'string', description: 'Property ID' },
            sellerId: { type: 'string', description: 'Seller ID' },
            viewCount: { type: 'number', minimum: 1 },
            status: { type: 'string', enum: ['viewed', 'interested', 'contacted', 'uninterested'] },
            lastViewedAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                count: { type: 'number' },
                page: { type: 'number' },
                pages: { type: 'number' },
                perPage: { type: 'number' },
              },
            },
            data: { type: 'array' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'], // Points to route files for auto-documentation
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
