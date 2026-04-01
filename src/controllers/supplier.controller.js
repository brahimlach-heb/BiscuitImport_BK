const supplierService = require('../services/supplier.service');
const logger = require('../config/logger');

const getAllSuppliers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.name) filter.name = req.query.name;
    if (req.query.is_active !== undefined) filter.is_active = req.query.is_active === 'true';

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    const result = await supplierService.getAllSuppliers(filter, pagination);
    logger.info(`ACTION getAllSuppliers count=${result.pagination.total} by user_id=${req.user?.id}`);
    res.json(result);
  } catch (err) {
    logger.error(`ERROR getAllSuppliers: ${err.message}`);
    next(err);
  }
};

const getSupplierById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supplier = await supplierService.getSupplierById(id);
    logger.info(`ACTION getSupplierById id=${id} by user_id=${req.user?.id}`);
    res.json(supplier);
  } catch (err) {
    logger.error(`ERROR getSupplierById: ${err.message}`);
    next(err);
  }
};

const getSupplierProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const products = await supplierService.getSupplierProducts(id);
    logger.info(`ACTION getSupplierProducts supplier_id=${id} count=${products.length} by user_id=${req.user?.id}`);
    res.json({ products });
  } catch (err) {
    logger.error(`ERROR getSupplierProducts: ${err.message}`);
    next(err);
  }
};

const getSupplierPerformance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const performance = await supplierService.getSupplierPerformance(id);
    logger.info(`ACTION getSupplierPerformance supplier_id=${id} by user_id=${req.user?.id}`);
    res.json(performance);
  } catch (err) {
    logger.error(`ERROR getSupplierPerformance: ${err.message}`);
    next(err);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const supplier = await supplierService.createSupplier(req.body);
    logger.info(`ACTION createSupplier name=${supplier.name} by user_id=${req.user?.id}`);
    res.status(201).json(supplier);
  } catch (err) {
    logger.error(`ERROR createSupplier: ${err.message}`);
    next(err);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supplier = await supplierService.updateSupplier(id, req.body);
    logger.info(`ACTION updateSupplier id=${id} by user_id=${req.user?.id}`);
    res.json(supplier);
  } catch (err) {
    logger.error(`ERROR updateSupplier: ${err.message}`);
    next(err);
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    await supplierService.deleteSupplier(id);
    logger.info(`ACTION deleteSupplier id=${id} by user_id=${req.user?.id}`);
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (err) {
    logger.error(`ERROR deleteSupplier: ${err.message}`);
    next(err);
  }
};

const addProductToSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await supplierService.addProductToSupplier(id, req.body);
    logger.info(`ACTION addProductToSupplier supplier_id=${id} product_id=${req.body.product_id} by user_id=${req.user?.id}`);
    res.status(201).json(product);
  } catch (err) {
    logger.error(`ERROR addProductToSupplier: ${err.message}`);
    next(err);
  }
};

const updateSupplierProduct = async (req, res, next) => {
  try {
    const { id, productId } = req.params;
    const product = await supplierService.updateSupplierProduct(id, productId, req.body);
    logger.info(`ACTION updateSupplierProduct supplier_id=${id} product_id=${productId} by user_id=${req.user?.id}`);
    res.json(product);
  } catch (err) {
    logger.error(`ERROR updateSupplierProduct: ${err.message}`);
    next(err);
  }
};

const deleteSupplierProduct = async (req, res, next) => {
  try {
    const { id, productId } = req.params;
    await supplierService.deleteSupplierProduct(id, productId);
    logger.info(`ACTION deleteSupplierProduct supplier_id=${id} product_id=${productId} by user_id=${req.user?.id}`);
    res.json({ success: true, message: 'Product removed from supplier' });
  } catch (err) {
    logger.error(`ERROR deleteSupplierProduct: ${err.message}`);
    next(err);
  }
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  getSupplierProducts,
  getSupplierPerformance,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  addProductToSupplier,
  updateSupplierProduct,
  deleteSupplierProduct
};
