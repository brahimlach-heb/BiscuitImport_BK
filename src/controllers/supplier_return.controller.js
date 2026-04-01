const srService = require('../services/supplier_return.service');
const logger = require('../config/logger');

const getAllSupplierReturns = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.purchase_order_id) filter.purchase_order_id = req.query.purchase_order_id;
    if (req.query.supplier_id) filter.supplier_id = req.query.supplier_id;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.search = req.query.search;

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    const result = await srService.getSupplierReturns(filter, pagination);
    logger.info(`ACTION getAllSupplierReturns count=${result.pagination.total} status=${req.query.status} by user_id=${req.user?.id}`);
    res.json(result);
  } catch (err) {
    logger.error(`ERROR getAllSupplierReturns: ${err.message}`);
    next(err);
  }
};

const getSupplierReturnById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sr = await srService.getSupplierReturnById(id);
    logger.info(`ACTION getSupplierReturnById id=${id} by user_id=${req.user?.id}`);
    res.json(sr);
  } catch (err) {
    logger.error(`ERROR getSupplierReturnById: ${err.message}`);
    next(err);
  }
};

const createSupplierReturn = async (req, res, next) => {
  try {
    const sr = await srService.createSupplierReturn(req.body);
    logger.info(`ACTION createSupplierReturn id=${sr.id} po_id=${sr.purchase_order_id} by user_id=${req.user?.id}`);
    res.status(201).json(sr);
  } catch (err) {
    logger.error(`ERROR createSupplierReturn: ${err.message}`);
    next(err);
  }
};

const updateSupplierReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sr = await srService.updateSupplierReturn(id, req.body);
    logger.info(`ACTION updateSupplierReturn id=${id} by user_id=${req.user?.id}`);
    res.json(sr);
  } catch (err) {
    logger.error(`ERROR updateSupplierReturn: ${err.message}`);
    next(err);
  }
};

const updateSupplierReturnStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, credit_amount } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const sr = await srService.updateSupplierReturnStatus(id, status, credit_amount, req.user?.id);
    logger.info(`ACTION updateSupplierReturnStatus id=${id} status=${status} by user_id=${req.user?.id}`);
    res.json(sr);
  } catch (err) {
    logger.error(`ERROR updateSupplierReturnStatus: ${err.message}`);
    next(err);
  }
};

const processCredit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { credit_amount } = req.body;
    
    if (!credit_amount) {
      return res.status(400).json({ error: 'credit_amount is required' });
    }

    const sr = await srService.processCredit(id, credit_amount, req.user?.id);
    logger.info(`ACTION processCredit id=${id} amount=${credit_amount} by user_id=${req.user?.id}`);
    res.json(sr);
  } catch (err) {
    logger.error(`ERROR processCredit: ${err.message}`);
    next(err);
  }
};

const deleteSupplierReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    await srService.deleteSupplierReturn(id);
    logger.info(`ACTION deleteSupplierReturn id=${id} by user_id=${req.user?.id}`);
    res.json({ success: true, message: 'Return deleted' });
  } catch (err) {
    logger.error(`ERROR deleteSupplierReturn: ${err.message}`);
    next(err);
  }
};

const addSupplierReturnItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await srService.addSupplierReturnItem(id, req.body);
    logger.info(`ACTION addSupplierReturnItem sr_id=${id} product_id=${req.body.product_id} by user_id=${req.user?.id}`);
    res.status(201).json(item);
  } catch (err) {
    logger.error(`ERROR addSupplierReturnItem: ${err.message}`);
    next(err);
  }
};

const getReturnReport = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.supplier_id) filter.supplier_id = req.query.supplier_id;

    const report = await srService.getReturnReport(filter);
    logger.info(`ACTION getReturnReport total=${report.summary.total_returns} by user_id=${req.user?.id}`);
    res.json(report);
  } catch (err) {
    logger.error(`ERROR getReturnReport: ${err.message}`);
    next(err);
  }
};

module.exports = {
  getAllSupplierReturns,
  getSupplierReturnById,
  createSupplierReturn,
  updateSupplierReturn,
  updateSupplierReturnStatus,
  processCredit,
  deleteSupplierReturn,
  addSupplierReturnItem,
  getReturnReport
};
