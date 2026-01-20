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
            image: { type: 'string' }
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
        }
      }
    }
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js"], // Swagger reads annotations from routes and controllers
};

module.exports = swaggerJsdoc(options);
