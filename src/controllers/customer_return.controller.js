const crService = require('../services/customer_return.service');
const logger = require('../config/logger');

const getAllCustomerReturns = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.order_id) filter.order_id = req.query.order_id;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.search = req.query.search;

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    const result = await crService.getCustomerReturns(filter, pagination);
    logger.info(`ACTION getAllCustomerReturns count=${result.pagination.total} status=${req.query.status} by user_id=${req.user?.id}`);
    res.json(result);
  } catch (err) {
    logger.error(`ERROR getAllCustomerReturns: ${err.message}`);
    next(err);
  }
};

const getCustomerReturnById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cr = await crService.getCustomerReturnById(id);
    logger.info(`ACTION getCustomerReturnById id=${id} by user_id=${req.user?.id}`);
    res.json(cr);
  } catch (err) {
    logger.error(`ERROR getCustomerReturnById: ${err.message}`);
    next(err);
  }
};

const createCustomerReturn = async (req, res, next) => {
  try {
    const cr = await crService.createCustomerReturn(req.body);
    logger.info(`ACTION createCustomerReturn id=${cr.id} order_id=${cr.order_id} by user_id=${req.user?.id}`);
    res.status(201).json(cr);
  } catch (err) {
    logger.error(`ERROR createCustomerReturn: ${err.message}`);
    next(err);
  }
};

const updateCustomerReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cr = await crService.updateCustomerReturn(id, req.body);
    logger.info(`ACTION updateCustomerReturn id=${id} by user_id=${req.user?.id}`);
    res.json(cr);
  } catch (err) {
    logger.error(`ERROR updateCustomerReturn: ${err.message}`);
    next(err);
  }
};

const updateCustomerReturnStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, refund_amount, refund_method } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const cr = await crService.updateCustomerReturnStatus(id, status, refund_amount, refund_method, req.user?.id);
    logger.info(`ACTION updateCustomerReturnStatus id=${id} status=${status} by user_id=${req.user?.id}`);
    res.json(cr);
  } catch (err) {
    logger.error(`ERROR updateCustomerReturnStatus: ${err.message}`);
    next(err);
  }
};

const processRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { refund_amount, refund_method } = req.body;
    
    if (!refund_amount) {
      return res.status(400).json({ error: 'refund_amount is required' });
    }

    const cr = await crService.processRefund(id, refund_amount, refund_method, req.user?.id);
    logger.info(`ACTION processRefund id=${id} amount=${refund_amount} by user_id=${req.user?.id}`);
    res.json(cr);
  } catch (err) {
    logger.error(`ERROR processRefund: ${err.message}`);
    next(err);
  }
};

const deleteCustomerReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    await crService.deleteCustomerReturn(id);
    logger.info(`ACTION deleteCustomerReturn id=${id} by user_id=${req.user?.id}`);
    res.json({ success: true, message: 'Return deleted' });
  } catch (err) {
    logger.error(`ERROR deleteCustomerReturn: ${err.message}`);
    next(err);
  }
};

const addCustomerReturnItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await crService.addCustomerReturnItem(id, req.body);
    logger.info(`ACTION addCustomerReturnItem cr_id=${id} product_id=${req.body.product_id} by user_id=${req.user?.id}`);
    res.status(201).json(item);
  } catch (err) {
    logger.error(`ERROR addCustomerReturnItem: ${err.message}`);
    next(err);
  }
};

const getReturnReport = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const report = await crService.getReturnReport(filter);
    logger.info(`ACTION getReturnReport total=${report.summary.total_returns} by user_id=${req.user?.id}`);
    res.json(report);
  } catch (err) {
    logger.error(`ERROR getReturnReport: ${err.message}`);
    next(err);
  }
};

module.exports = {
  getAllCustomerReturns,
  getCustomerReturnById,
  createCustomerReturn,
  updateCustomerReturn,
  updateCustomerReturnStatus,
  processRefund,
  deleteCustomerReturn,
  addCustomerReturnItem,
  getReturnReport
};
