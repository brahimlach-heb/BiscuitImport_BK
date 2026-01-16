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
        url: "http://localhost:3000",
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
            logo: { type: 'string' },
            is_active: { type: 'boolean' }
          }
        },
        Flavor: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            color: { type: 'string' }
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
            image: { type: 'string' },
            stock: { type: 'integer' },
            is_active: { type: 'boolean' },
            category_id: { type: 'integer' },
            flavors: { type: 'array', items: { $ref: '#/components/schemas/Flavor' } }
          }
        },
        OrderLine: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            order_id: { type: 'integer' },
            product_id: { type: 'integer' },
            quantity: { type: 'integer' },
            unit_price: { type: 'number', format: 'double' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            created_at: { type: 'string' },
            status: { type: 'string' },
            total: { type: 'number', format: 'double' },
            lines: { type: 'array', items: { $ref: '#/components/schemas/OrderLine' } }
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
        }
      }
    }
  },
  apis: ["./src/routes/*.js"], // Où Swagger va lire les annotations
};

module.exports = swaggerJsdoc(options);
