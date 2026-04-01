const swaggerJsdoc = require("swagger-jsdoc");
const { BASE_URL } = require("./env");

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
        url: BASE_URL || "http://localhost:3000",
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
            address: { type: 'string', description: 'User address' },
            role_id: { type: 'integer', description: 'Role ID' },
            role_code: { type: 'string', description: 'Role code (e.g., ADMIN, CLIENT)' },
            discount_percent: { type: 'number', format: 'float', description: 'Discount percentage' },
            is_active: { type: 'boolean', description: 'Whether the user is active' },
            created_at: { type: 'string', format: 'date-time' },
            modified_at: { type: 'string', format: 'date-time' },
            last_login: { type: 'string', format: 'date-time' },
            deactivated_at: { type: 'string', format: 'date' }
          }
        },
        Supplier: {
          type: 'object',
          required: ['name'],
          properties: {
            id: { type: 'integer' },
            name: { type: 'string', description: 'Supplier name' },
            email: { type: 'string', format: 'email', description: 'Supplier email' },
            phone: { type: 'string', description: 'Supplier phone number' },
            address: { type: 'string', description: 'Supplier address' },
            city: { type: 'string', description: 'City' },
            postal_code: { type: 'string', description: 'Postal code' },
            country: { type: 'string', description: 'Country' },
            payment_terms: { type: 'string', description: 'Payment terms (e.g., Net 30)' },
            is_active: { type: 'boolean', default: true },
            soft_delete_flag: { type: 'boolean', default: false },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        SupplierProduct: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            supplier_id: { type: 'integer' },
            product_id: { type: 'integer' },
            supplier_sku: { type: 'string', description: 'Supplier SKU' },
            lead_time_days: { type: 'integer', description: 'Lead time in days' },
            min_order_qty: { type: 'integer', description: 'Minimum order quantity' },
            unit_price: { type: 'number', format: 'double', description: 'Unit price' },
            last_order_date: { type: 'string', format: 'date-time' },
            performance_rating: { type: 'number', format: 'float', default: 0 },
            product_name: { type: 'string' },
            price: { type: 'number' },
            stock: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        PurchaseOrder: {
          type: 'object',
          required: ['supplier_id'],
          properties: {
            id: { type: 'integer' },
            supplier_id: { type: 'integer', description: 'Supplier ID' },
            status: { type: 'string', enum: ['draft', 'sent', 'received', 'cancelled'], default: 'draft' },
            order_date: { type: 'string', format: 'date-time' },
            expected_delivery: { type: 'string', format: 'date-time' },
            received_date: { type: 'string', format: 'date-time' },
            total_amount: { type: 'number', format: 'double', default: 0 },
            notes: { type: 'string' },
            created_by: { type: 'integer' },
            supplier_name: { type: 'string' },
            lines: { type: 'array', items: { $ref: '#/components/schemas/PurchaseOrderLine' } },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        PurchaseOrderLine: {
          type: 'object',
          required: ['product_id', 'quantity', 'unit_price'],
          properties: {
            id: { type: 'integer' },
            purchase_order_id: { type: 'integer' },
            product_id: { type: 'integer' },
            quantity: { type: 'integer' },
            unit_price: { type: 'number', format: 'double' },
            total: { type: 'number', format: 'double' },
            received_quantity: { type: 'integer', default: 0 },
            product_name: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        CustomerReturn: {
          type: 'object',
          required: ['order_id'],
          properties: {
            id: { type: 'integer' },
            order_id: { type: 'integer' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'refunded'], default: 'pending' },
            return_reason: { type: 'string' },
            return_date: { type: 'string', format: 'date-time' },
            refund_amount: { type: 'number', format: 'double', default: 0 },
            refund_method: { type: 'string', description: 'e.g., credit_card, bank_transfer' },
            order_number: { type: 'string' },
            items: { type: 'array', items: { $ref: '#/components/schemas/CustomerReturnItem' } },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        CustomerReturnItem: {
          type: 'object',
          required: ['product_id', 'quantity', 'unit_price'],
          properties: {
            id: { type: 'integer' },
            customer_return_id: { type: 'integer' },
            product_id: { type: 'integer' },
            quantity: { type: 'integer' },
            unit_price: { type: 'number', format: 'double' },
            reason: { type: 'string' },
            product_name: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        SupplierReturn: {
          type: 'object',
          required: ['purchase_order_id', 'supplier_id'],
          properties: {
            id: { type: 'integer' },
            purchase_order_id: { type: 'integer' },
            supplier_id: { type: 'integer' },
            status: { type: 'string', enum: ['pending', 'approved', 'credited', 'rejected'], default: 'pending' },
            return_reason: { type: 'string' },
            return_date: { type: 'string', format: 'date-time' },
            credit_amount: { type: 'number', format: 'double', default: 0 },
            supplier_name: { type: 'string' },
            po_status: { type: 'string' },
            items: { type: 'array', items: { $ref: '#/components/schemas/SupplierReturnItem' } },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        SupplierReturnItem: {
          type: 'object',
          required: ['product_id', 'quantity', 'unit_price'],
          properties: {
            id: { type: 'integer' },
            supplier_return_id: { type: 'integer' },
            product_id: { type: 'integer' },
            quantity: { type: 'integer' },
            unit_price: { type: 'number', format: 'double' },
            reason: { type: 'string' },
            product_name: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        StockMovement: {
          type: 'object',
          required: ['product_id', 'type'],
          properties: {
            id: { type: 'integer' },
            product_id: { type: 'integer' },
            type: { type: 'string', enum: ['in', 'out', 'adjustment', 'transfer', 'return'], description: 'Movement type' },
            quantity_before: { type: 'integer' },
            quantity_after: { type: 'integer' },
            reference_type: { type: 'string', description: 'Reference type (po, cr, sr, adjustment)' },
            reference_id: { type: 'integer', description: 'Reference ID' },
            notes: { type: 'string' },
            product_name: { type: 'string' },
            created_by: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Stock: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            price: { type: 'number', format: 'double' },
            stock: { type: 'integer' },
            stock_securite: { type: 'integer' },
            category_id: { type: 'integer' },
            category_name: { type: 'string' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            pages: { type: 'integer' }
          }
        },
        Warehouse: {
          type: 'object',
          required: ['name', 'location', 'capacity'],
          properties: {
            id: { type: 'integer' },
            name: { type: 'string', description: 'Unique warehouse name' },
            location: { type: 'string', description: 'Warehouse location' },
            city: { type: 'string', description: 'City' },
            capacity: { type: 'integer', description: 'Total capacity in units' },
            is_active: { type: 'boolean', default: true },
            total_stock: { type: 'integer', description: 'Current total stock' },
            used_capacity: { type: 'integer', description: 'Used capacity' },
            capacity_percentage: { type: 'number', format: 'float', description: 'Percentage of capacity used' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        WarehouseTransfer: {
          type: 'object',
          required: ['from_warehouse_id', 'to_warehouse_id', 'product_id', 'quantity'],
          properties: {
            id: { type: 'integer' },
            from_warehouse_id: { type: 'integer' },
            to_warehouse_id: { type: 'integer' },
            product_id: { type: 'integer' },
            quantity: { type: 'integer' },
            transfer_date: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['completed', 'pending', 'cancelled'], default: 'completed' },
            notes: { type: 'string' },
            from_warehouse_name: { type: 'string' },
            to_warehouse_name: { type: 'string' },
            product_name: { type: 'string' },
            created_by: { type: 'integer' }
          }
        }
      }
    }
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js"], // Swagger reads annotations from routes and controllers
};

module.exports = swaggerJsdoc(options);
