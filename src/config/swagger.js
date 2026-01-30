const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Express",
      version: "1.0.0",
      description: "Documentation API Node.js + Express",
    },
    servers: [
      {
        url: "http://72.62.237.60:3000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            emoji: { type: 'string' },
            is_active: { type: 'boolean' }
          }
        },
        Flavor: {
          type: 'object',
          required: ['name', 'description', 'color', 'image'],
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            color: { type: 'string' },
            image: { type: 'string', description: 'Full URL to the flavor image (e.g., http://ipserveur:3000/uploads/flavors/image.png)' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            ingredients: { type: 'string' },
            price: { type: 'number', format: 'double' },
            stock: { type: 'integer' },
            is_active: { type: 'boolean' },
            category_id: { type: 'integer' },
            marque: { type: 'string', description: 'Product brand' },
            packageUnit: { type: 'integer', description: 'Number of products in package', default: 1 },
            flavors: { type: 'array', items: { $ref: '#/components/schemas/Flavor' } },
            price_roles: { 
              type: 'array', 
              items: { 
                type: 'object', 
                properties: { 
                  id: { type: 'integer' },
                  product_id: { type: 'integer' },
                  role_id: { type: 'integer' },
                  price: { type: 'number' },
                  code: { type: 'string' },
                  label: { type: 'string' }
                } 
              },
              description: 'Role-based pricing (optional)'
            }
          }
        },
        OrderLine: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            order_id: { type: 'integer' },
            product_id: { type: 'integer' },
            quantity: { type: 'integer' },
            unit_price: { type: 'number', format: 'double' },
            final_price: { type: 'number', format: 'double', description: 'Final price for this line' }
          }
        },
        OrderPayment: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            order_id: { type: 'integer' },
            bank_id: { type: 'integer', description: 'Bank ID (optional for cash)' },
            bank_code: { type: 'string', description: 'Bank code' },
            bank_label: { type: 'string', description: 'Bank name' },
            payment_method: { 
              type: 'string',
              enum: ['CASH', 'CARD', 'TRANSFER', 'CHECK', 'OTHER'],
              description: 'Payment method'
            },
            amount: { type: 'number', format: 'double', description: 'Payment amount' },
            payment_date: { type: 'string', format: 'date-time', description: 'Payment date' },
            notes: { type: 'string', description: 'Payment notes' },
            created_by: { type: 'integer', description: 'User who created the payment' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            created_at: { type: 'string' },
            status: { type: 'string' },
            subtotal: { type: 'number', format: 'double', description: 'Total before discount' },
            total: { type: 'number', format: 'double', description: 'Total after discount' },
            remise: { type: 'number', format: 'double', default: 0, description: 'Discount amount' },
            customer_name: { type: 'string', description: 'Customer full name' },
            customer_email: { type: 'string', description: 'Customer email' },
            customer_phone: { type: 'string', description: 'Customer phone' },
            customer_address: { type: 'string', description: 'Customer address' },
            lines: { type: 'array', items: { $ref: '#/components/schemas/OrderLine' } },
            payments: { 
              type: 'array', 
              items: { $ref: '#/components/schemas/OrderPayment' },
              description: 'Payment history for this order'
            },
            status_history: { 
              type: 'array', 
              items: { 
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  order_id: { type: 'integer' },
                  status: { type: 'string' },
                  changed_at: { type: 'string', format: 'date-time' },
                  changed_by: { type: 'integer' },
                  notes: { type: 'string' }
                }
              },
              description: 'History of status changes'
            }
          }
        },
        History: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            action_type: { type: 'string' },
            entity_id: { type: 'integer' },
            entity_type: { type: 'string' },
            action_date: { type: 'string' },
            description: { type: 'string' }
          }
        },
        Role: {
          type: 'object',
          required: ['code'],
          properties: {
            id: { type: 'integer' },
            code: { type: 'string', description: 'Unique role code' },
            label: { type: 'string', description: 'Role label/name' },
            is_active: { type: 'boolean', description: 'Whether the role is active' }
          }
        },
        User: {
          type: 'object',
          required: ['first_name', 'last_name', 'email', 'password', 'role_id'],
          properties: {
            id: { type: 'integer' },
            first_name: { type: 'string', description: 'User first name' },
            last_name: { type: 'string', description: 'User last name' },
            email: { type: 'string', format: 'email', description: 'User email address' },
            phone: { type: 'string', description: 'User phone number' },
            role_id: { type: 'integer', description: 'Role ID' },
            role_code: { type: 'string', description: 'Role code (e.g., ADMIN, CLIENT)' },
            discount_percent: { type: 'number', format: 'float', description: 'Discount percentage' },
            is_active: { type: 'boolean', description: 'Whether the user is active' },
            created_at: { type: 'string', format: 'date-time' },
            modified_at: { type: 'string', format: 'date-time' },
            last_login: { type: 'string', format: 'date-time' },
            deactivated_at: { type: 'string', format: 'date' }
          }
        }
      }
    }
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js"], // Swagger reads annotations from routes and controllers
};

module.exports = swaggerJsdoc(options);
