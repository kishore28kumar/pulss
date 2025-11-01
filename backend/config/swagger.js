const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pulss Platform API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the Pulss multi-tenant SaaS platform. This API powers pharmacy, retail, and service businesses with features including customer loyalty, rewards, inventory management, orders, and analytics.',
      contact: {
        name: 'Pulss API Support',
        email: 'support@pulss.io'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.pulss.io',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User unique identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            full_name: {
              type: 'string',
              description: 'User full name'
            },
            role: {
              type: 'string',
              enum: ['super_admin', 'admin', 'customer'],
              description: 'User role in the system'
            },
            tenant_id: {
              type: 'string',
              format: 'uuid',
              description: 'Associated tenant ID'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            }
          }
        },
        Tenant: {
          type: 'object',
          properties: {
            tenant_id: {
              type: 'string',
              format: 'uuid',
              description: 'Tenant unique identifier'
            },
            name: {
              type: 'string',
              description: 'Business name'
            },
            subdomain: {
              type: 'string',
              description: 'Unique subdomain for the tenant'
            },
            business_type: {
              type: 'string',
              enum: ['pharmacy', 'retail', 'grocery', 'restaurant', 'services'],
              description: 'Type of business'
            },
            is_active: {
              type: 'boolean',
              description: 'Whether the tenant is active'
            },
            is_live: {
              type: 'boolean',
              description: 'Whether the tenant store is live'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Customer: {
          type: 'object',
          properties: {
            customer_id: {
              type: 'string',
              format: 'uuid'
            },
            tenant_id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            phone: {
              type: 'string'
            },
            loyalty_points: {
              type: 'integer',
              description: 'Current loyalty points balance'
            },
            total_spent: {
              type: 'number',
              format: 'float',
              description: 'Total amount spent'
            }
          }
        },
        AuditLog: {
          type: 'object',
          properties: {
            log_id: {
              type: 'string',
              format: 'uuid'
            },
            tenant_id: {
              type: 'string',
              format: 'uuid'
            },
            user_id: {
              type: 'string',
              format: 'uuid'
            },
            action: {
              type: 'string',
              description: 'Action performed (e.g., CREATE, UPDATE, DELETE)'
            },
            entity_type: {
              type: 'string',
              description: 'Type of entity affected (e.g., customer, product, order)'
            },
            entity_id: {
              type: 'string',
              description: 'ID of the affected entity'
            },
            ip_address: {
              type: 'string',
              description: 'IP address of the user'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            details: {
              type: 'object',
              description: 'Additional details about the action'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Tenants',
        description: 'Multi-tenant management and settings'
      },
      {
        name: 'Customers',
        description: 'Customer management and loyalty programs'
      },
      {
        name: 'Products',
        description: 'Product catalog and inventory management'
      },
      {
        name: 'Orders',
        description: 'Order processing and management'
      },
      {
        name: 'Transactions',
        description: 'Transaction tracking and history'
      },
      {
        name: 'Rewards',
        description: 'Loyalty rewards and points management'
      },
      {
        name: 'Audit Logs',
        description: 'System audit trail and compliance'
      },
      {
        name: 'Analytics',
        description: 'Business analytics and reporting'
      },
      {
        name: 'Super Admin',
        description: 'Super admin operations (restricted)'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
