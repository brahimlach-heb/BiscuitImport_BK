const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./config/logger');
const loggerMiddleware = require('./middlewares/logger.middleware');
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

// Ensure database tables are created on startup
require('./models/role.model');
require('./models/user.model');
require('./models/category.model');
require('./models/flavor.model');
require('./models/product.model');
require('./models/product_price_role.model');
require('./models/order.model');
require('./models/history.model');

const app = express();

// CORS configuration
app.use(cors({
  origin: '*',
  credentials: true
}));

// Middlewares
app.use(loggerMiddleware);
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount user routes
app.use('/api/users', require('./routes/user.routes'));

// Auth routes
app.use('/auth', require('./routes/auth.routes'));

// Roles routes
app.use('/api/roles', require('./routes/role.routes'));

// Product, Category, Flavor, Order routes
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/flavors', require('./routes/flavor.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/history', require('./routes/history.routes'));

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'BiscuitImport API' });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
