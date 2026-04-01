const stockService = require('../services/stock.service');
const logger = require('../config/logger');

const getAllStock = async (req, res, next) => {
  try {
    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await stockService.getAllStock(pagination);
    logger.info(`ACTION getAllStock count=${result.pagination.total} by user_id=${req.user?.id}`);
    res.json(result);
  } catch (err) {
    logger.error(`ERROR getAllStock: ${err.message}`);
    next(err);
  }
};

const getStockByProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const stock = await stockService.getStockByProduct(productId);
    logger.info(`ACTION getStockByProduct product_id=${productId} by user_id=${req.user?.id}`);
    res.json(stock);
  } catch (err) {
    logger.error(`ERROR getStockByProduct: ${err.message}`);
    next(err);
  }
};

const getStockMovements = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.reference_type) filter.reference_type = req.query.reference_type;

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    let result;
    const { productId } = req.params;
    if (productId) {
      result = await stockService.getStockMovements(productId, filter, pagination);
    } else {
      result = await stockService.getStockMovements(null, filter, pagination);
    }

    logger.info(`ACTION getStockMovements count=${result.pagination.total} by user_id=${req.user?.id}`);
    res.json(result);
  } catch (err) {
    logger.error(`ERROR getStockMovements: ${err.message}`);
    next(err);
  }
};

const getStockReport = async (req, res, next) => {
  try {
    const report = await stockService.getStockReport();
    logger.info(`ACTION getStockReport total_products=${report.summary.total_products} by user_id=${req.user?.id}`);
    res.json(report);
  } catch (err) {
    logger.error(`ERROR getStockReport: ${err.message}`);
    next(err);
  }
};

const getStockAlerts = async (req, res, next) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const alerts = await stockService.getStockAlerts(threshold);
    logger.info(`ACTION getStockAlerts count=${alerts.alert_count} threshold=${threshold} by user_id=${req.user?.id}`);
    res.json(alerts);
  } catch (err) {
    logger.error(`ERROR getStockAlerts: ${err.message}`);
    next(err);
  }
};

const updateStock = async (req, res, next) => {
  try {
    const { product_id, quantity_change, reference_type, reference_id, notes } = req.body;
    
    const movement = await stockService.updateStock(
      product_id,
      quantity_change,
      reference_type,
      reference_id,
      notes,
      req.user?.id
    );

    logger.info(`ACTION updateStock product_id=${product_id} change=${quantity_change} by user_id=${req.user?.id}`);
    res.json(movement);
  } catch (err) {
    logger.error(`ERROR updateStock: ${err.message}`);
    next(err);
  }
};

const adjustStock = async (req, res, next) => {
  try {
    // Check role permission (MANAGER only)
    const roleCode = req.user?.role_code?.toUpperCase();
    if (roleCode !== 'MANAGER' && roleCode !== 'ADMIN') {
      return res.status(403).json({ error: 'Only MANAGER/ADMIN can adjust stock' });
    }

    const { product_id, new_quantity, reason } = req.body;
    
    const movement = await stockService.adjustStock(
      product_id,
      new_quantity,
      reason,
      req.user?.id
    );

    logger.info(`ACTION adjustStock product_id=${product_id} new_qty=${new_quantity} by user_id=${req.user?.id}`);
    res.json(movement);
  } catch (err) {
    logger.error(`ERROR adjustStock: ${err.message}`);
    next(err);
  }
};

const transferStock = async (req, res, next) => {
  try {
    // Check role permission (MANAGER only)
    const roleCode = req.user?.role_code?.toUpperCase();
    if (roleCode !== 'MANAGER' && roleCode !== 'ADMIN') {
      return res.status(403).json({ error: 'Only MANAGER/ADMIN can transfer stock' });
    }

    const { from_product_id, to_product_id, quantity, reason } = req.body;
    
    const result = await stockService.transferStock(
      from_product_id,
      to_product_id,
      quantity,
      reason,
      req.user?.id
    );

    logger.info(`ACTION transferStock from=${from_product_id} to=${to_product_id} qty=${quantity} by user_id=${req.user?.id}`);
    res.json(result);
  } catch (err) {
    logger.error(`ERROR transferStock: ${err.message}`);
    next(err);
  }
};

const importStock = async (req, res, next) => {
  try {
    // Check role permission (MANAGER only)
    const roleCode = req.user?.role_code?.toUpperCase();
    if (roleCode !== 'MANAGER' && roleCode !== 'ADMIN') {
      return res.status(403).json({ error: 'Only MANAGER/ADMIN can import stock' });
    }

    const { import_data } = req.body;
    
    const result = await stockService.importStock(import_data, req.user?.id);

    logger.info(`ACTION importStock success=${result.success} failed=${result.failed} by user_id=${req.user?.id}`);
    res.json(result);
  } catch (err) {
    logger.error(`ERROR importStock: ${err.message}`);
    next(err);
  }
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
