const stockModel = require('../models/stock_movement.model');

const getAllStock = async (pagination = {}) => {
  const stocks = await stockModel.getAllStock();
  
  // Apply pagination
  const page = pagination.page || 1;
  const limit = pagination.limit || 20;
  const offset = (page - 1) * limit;
  
  const paginated = stocks.slice(offset, offset + limit);
  
  return {
    data: paginated,
    pagination: {
      page,
      limit,
      total: stocks.length,
      pages: Math.ceil(stocks.length / limit)
    }
  };
};

const getStockByProduct = async (productId) => {
  const movements = await stockModel.getStockMovementsByProduct(productId);
  
  if (movements.length === 0) {
    const err = new Error('Product not found or has no stock movements');
    err.status = 404;
    throw err;
  }

  const latestMovement = movements[0];
  return {
    product_id: productId,
    current_quantity: latestMovement.quantity_after,
    movements: movements
  };
};

const getStockMovements = async (productId = null, filter = {}, pagination = {}) => {
  let query = filter;
  if (productId) {
    query.product_id = productId;
  }

  const movements = await stockModel.getStockMovements(query);
  
  // Apply pagination
  const page = pagination.page || 1;
  const limit = pagination.limit || 20;
  const offset = (page - 1) * limit;
  
  const paginated = movements.slice(offset, offset + limit);
  
  return {
    data: paginated,
    pagination: {
      page,
      limit,
      total: movements.length,
      pages: Math.ceil(movements.length / limit)
    }
  };
};

const getStockReport = async () => {
  const stocks = await stockModel.getAllStock();
  
  const summary = {
    total_products: stocks.length,
    total_quantity: 0,
    total_value: 0,
    low_stock_count: 0,
    products_by_category: {}
  };

  stocks.forEach(stock => {
    summary.total_quantity += stock.stock || 0;
    summary.total_value += (stock.stock || 0) * (stock.price || 0);
    
    if (stock.stock < (stock.stock_securite || 10)) {
      summary.low_stock_count++;
    }

    const category = stock.category_name || 'Uncategorized';
    if (!summary.products_by_category[category]) {
      summary.products_by_category[category] = {
        count: 0,
        quantity: 0,
        value: 0
      };
    }
    summary.products_by_category[category].count++;
    summary.products_by_category[category].quantity += stock.stock || 0;
    summary.products_by_category[category].value += (stock.stock || 0) * (stock.price || 0);
  });

  return {
    summary,
    products: stocks
  };
};

const getStockAlerts = async (threshold = 10) => {
  const alerts = await stockModel.getStockLowAlerts(threshold);
  
  return {
    threshold,
    alert_count: alerts.length,
    alerts: alerts
  };
};

const updateStock = async (product_id, quantity_change, reference_type, reference_id, notes, userId) => {
  if (!product_id || quantity_change === undefined) {
    const err = new Error('product_id and quantity_change are required');
    err.status = 400;
    throw err;
  }

  return await stockModel.updateStock(product_id, quantity_change, reference_type, reference_id, notes, userId);
};

const adjustStock = async (product_id, new_quantity, reason, userId) => {
  if (!product_id || new_quantity === undefined) {
    const err = new Error('product_id and new_quantity are required');
    err.status = 400;
    throw err;
  }

  if (new_quantity < 0) {
    const err = new Error('new_quantity cannot be negative');
    err.status = 400;
    throw err;
  }

  return await stockModel.adjustStock(product_id, new_quantity, reason, userId);
};

const transferStock = async (from_product_id, to_product_id, quantity, reason, userId) => {
  if (!from_product_id || !to_product_id || !quantity) {
    const err = new Error('from_product_id, to_product_id, and quantity are required');
    err.status = 400;
    throw err;
  }

  if (quantity <= 0) {
    const err = new Error('quantity must be greater than 0');
    err.status = 400;
    throw err;
  }

  if (from_product_id === to_product_id) {
    const err = new Error('Cannot transfer to the same product');
    err.status = 400;
    throw err;
  }

  return await stockModel.transferStock(from_product_id, to_product_id, quantity, reason, userId);
};

const importStock = async (importData, userId) => {
  if (!Array.isArray(importData) || importData.length === 0) {
    const err = new Error('Import data must be a non-empty array');
    err.status = 400;
    throw err;
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [],
    imported: []
  };

  for (const item of importData) {
    try {
      const result = await stockModel.adjustStock(item.product_id, item.quantity, item.reason || 'Stock import', userId);
      results.success++;
      results.imported.push(result);
    } catch (err) {
      results.failed++;
      results.errors.push({
        product_id: item.product_id,
        error: err.message
      });
    }
  }

  return results;
};

module.exports = {
  getAllStock,
  getStockByProduct,
  getStockMovements,
  getStockReport,
  getStockAlerts,
  updateStock,
  adjustStock,
  transferStock,
  importStock
};
