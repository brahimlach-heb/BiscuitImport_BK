const productService = require('../services/product.service');
const logger = require('../config/logger');

const getAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category_id) filter.category_id = Number(req.query.category_id);
    const roleId = req.user.role_id;
    const rows = await productService.getAllProducts(filter, roleId);
    const userInfo = `user_id=${req.user.id}`;
    logger.info(`ACTION getAllProducts count=${Array.isArray(rows) ? rows.length : 0} filter=${JSON.stringify(filter)} by=${userInfo}`);
    res.status(200).json(rows);
  } catch (err) {
    logger.error(`ERROR getAllProducts: ${err.message}`, { query: req.query });
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const row = await productService.getProductById(id);
    const userInfo = `user_id=${req.user.id}`;
    if (!row) {
      logger.info(`ACTION getProductById_not_found id=${id} by=${userInfo}`);
      return res.status(404).json({ error: 'Product not found' });
    }
    logger.info(`ACTION getProductById id=${id} name=${row.name} flavors=${Array.isArray(row.flavors) ? row.flavors.length : 0} by=${userInfo}`);
    res.status(200).json(row);
  } catch (err) {
    logger.error(`ERROR getProductById id=${req.params.id}: ${err.message}`);
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const actor = req.user ? req.user.id : null;
    const p = await productService.createProduct(req.body, actor);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION createProduct id=${p.id} name=${p.name} price=${p.price} category=${p.category_id} by=${userInfo}`);
    res.status(201).json(p);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR createProduct: ${err.message}`, { body: req.body, user: userInfo });
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actor = req.user ? req.user.id : null;
    const updated = await productService.updateProduct(id, req.body, actor);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    if (!updated) {
      logger.info(`ACTION updateProduct_not_found id=${id} by=${userInfo}`);
      return res.status(404).json({ error: 'Product not found' });
    }
    logger.info(`ACTION updateProduct id=${id} by=${userInfo}`);
    res.status(200).json({ success: true });
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR updateProduct id=${req.params.id}: ${err.message}`, { body: req.body, user: userInfo });
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actor = req.user ? req.user.id : null;
    const deleted = await productService.deleteProduct(id, actor);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    if (!deleted) {
      logger.info(`ACTION deleteProduct_not_found id=${id} by=${userInfo}`);
      return res.status(404).json({ error: 'Product not found' });
    }
    logger.info(`ACTION deleteProduct id=${id} by=${userInfo}`);
    res.status(200).json({ success: true });
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR deleteProduct id=${req.params.id}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

// Flavor association endpoints
const addFlavor = async (req, res, next) => {
  try {
    const product_id = Number(req.params.id);
    const flavor_id = Number(req.body.flavor_id);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    if (!flavor_id) {
      logger.warn(`ACTION addFlavorToProduct_missing_flavor_id product_id=${product_id} by=${userInfo}`);
      return res.status(400).json({ error: 'flavor_id is required' });
    }
    await productService.addFlavorToProduct(product_id, flavor_id);
    logger.info(`ACTION addFlavorToProduct product_id=${product_id} flavor_id=${flavor_id} by=${userInfo}`);
    res.status(200).json({ success: true });
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR addFlavorToProduct product_id=${req.params.id} flavor_id=${req.body.flavor_id}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

const removeFlavor = async (req, res, next) => {
  try {
    const product_id = Number(req.params.id);
    const flavor_id = Number(req.params.flavor_id);
    const removed = await productService.removeFlavorFromProduct(product_id, flavor_id);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    if (!removed) {
      logger.info(`ACTION removeFlavorFromProduct_not_found product_id=${product_id} flavor_id=${flavor_id} by=${userInfo}`);
      return res.status(404).json({ error: 'Association not found' });
    }
    logger.info(`ACTION removeFlavorFromProduct product_id=${product_id} flavor_id=${flavor_id} by=${userInfo}`);
    res.status(200).json({ success:true });
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR removeFlavorFromProduct product_id=${req.params.id} flavor_id=${req.params.flavor_id}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove, addFlavor, removeFlavor };