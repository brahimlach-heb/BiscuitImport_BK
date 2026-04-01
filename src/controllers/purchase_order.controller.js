const poService = require('../services/purchase_order.service');
const logger = require('../config/logger');

const getAllPurchaseOrders = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.supplier_id) filter.supplier_id = req.query.supplier_id;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.search = req.query.search;

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    const result = await poService.getPurchaseOrders(filter, pagination);
    logger.info(`ACTION getAllPurchaseOrders count=${result.pagination.total} status=${req.query.status} by user_id=${req.user?.id}`);
    res.json(result);
  } catch (err) {
    logger.error(`ERROR getAllPurchaseOrders: ${err.message}`);
    next(err);
  }
};

const getPurchaseOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const po = await poService.getPurchaseOrderById(id);
    logger.info(`ACTION getPurchaseOrderById id=${id} by user_id=${req.user?.id}`);
    res.json(po);
  } catch (err) {
    logger.error(`ERROR getPurchaseOrderById: ${err.message}`);
    next(err);
  }
};

const getSupplierPurchaseOrders = async (req, res, next) => {
  try {
    const { supplierId } = req.params;
    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    const result = await poService.getSupplierPurchaseOrders(supplierId, pagination);
    logger.info(`ACTION getSupplierPurchaseOrders supplier_id=${supplierId} count=${result.pagination.total} by user_id=${req.user?.id}`);
    res.json(result);
  } catch (err) {
    logger.error(`ERROR getSupplierPurchaseOrders: ${err.message}`);
    next(err);
  }
};

const createPurchaseOrder = async (req, res, next) => {
  try {
    const po = await poService.createPurchaseOrder({
      ...req.body,
      created_by: req.user?.id
    });
    logger.info(`ACTION createPurchaseOrder id=${po.id} supplier_id=${po.supplier_id} by user_id=${req.user?.id}`);
    res.status(201).json(po);
  } catch (err) {
    logger.error(`ERROR createPurchaseOrder: ${err.message}`);
    next(err);
  }
};

const updatePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const po = await poService.updatePurchaseOrder(id, req.body);
    logger.info(`ACTION updatePurchaseOrder id=${id} by user_id=${req.user?.id}`);
    res.json(po);
  } catch (err) {
    logger.error(`ERROR updatePurchaseOrder: ${err.message}`);
    next(err);
  }
};

const deletePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    await poService.deletePurchaseOrder(id);
    logger.info(`ACTION deletePurchaseOrder id=${id} by user_id=${req.user?.id}`);
    res.json({ success: true, message: 'Purchase order deleted' });
  } catch (err) {
    logger.error(`ERROR deletePurchaseOrder: ${err.message}`);
    next(err);
  }
};

const addPurchaseOrderLine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const line = await poService.addPurchaseOrderLine(id, req.body);
    logger.info(`ACTION addPurchaseOrderLine po_id=${id} product_id=${req.body.product_id} by user_id=${req.user?.id}`);
    res.status(201).json(line);
  } catch (err) {
    logger.error(`ERROR addPurchaseOrderLine: ${err.message}`);
    next(err);
  }
};

const deletePurchaseOrderLine = async (req, res, next) => {
  try {
    const { id, lineId } = req.params;
    await poService.deletePurchaseOrderLine(lineId);
    logger.info(`ACTION deletePurchaseOrderLine po_id=${id} line_id=${lineId} by user_id=${req.user?.id}`);
    res.json({ success: true, message: 'Line deleted' });
  } catch (err) {
    logger.error(`ERROR deletePurchaseOrderLine: ${err.message}`);
    next(err);
  }
};

const updatePurchaseOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const po = await poService.updatePurchaseOrderStatus(id, status);
    logger.info(`ACTION updatePurchaseOrderStatus id=${id} status=${status} by user_id=${req.user?.id}`);
    res.json(po);
  } catch (err) {
    logger.error(`ERROR updatePurchaseOrderStatus: ${err.message}`);
    next(err);
  }
};

const receivePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const po = await poService.receivePurchaseOrder(id, req.user?.id);
    logger.info(`ACTION receivePurchaseOrder id=${id} items=${po.lines.length} by user_id=${req.user?.id}`);
    res.json(po);
  } catch (err) {
    logger.error(`ERROR receivePurchaseOrder: ${err.message}`);
    next(err);
  }
};

const getPurchaseOrderHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await poService.getPurchaseOrderHistory(id);
    logger.info(`ACTION getPurchaseOrderHistory id=${id} by user_id=${req.user?.id}`);
    res.json({ history });
  } catch (err) {
    logger.error(`ERROR getPurchaseOrderHistory: ${err.message}`);
    next(err);
  }
};

module.exports = {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  getSupplierPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  addPurchaseOrderLine,
  deletePurchaseOrderLine,
  updatePurchaseOrderStatus,
  receivePurchaseOrder,
  getPurchaseOrderHistory
};
