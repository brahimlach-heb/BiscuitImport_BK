const productModel = require('../models/product.model');
const historyModel = require('../models/history.model');
const logger = require('../config/logger');

const createProduct = async (data, actorUserId) => {
  if (!data || !data.name || typeof data.price === 'undefined') {
    const err = new Error('Name and price are required');
    err.status = 400;
    throw err;
  }
  logger.info(`DB createProduct: name=${data.name} price=${data.price} actor=${actorUserId || 'system'}`);
  const prod = await productModel.createProduct(data);
  if (actorUserId) {
    await historyModel.createHistory({ user_id: actorUserId, action_type: 'ADD_PRODUCT', entity_id: prod.id, entity_type: 'PRODUCT', description: JSON.stringify(prod) });
    logger.info(`AUDIT ADD_PRODUCT: id=${prod.id} user=${actorUserId}`);
  }
  return prod;
};

const getAllProducts = async (filter) => {
  logger.debug(`DB getAllProducts: filter=${JSON.stringify(filter)}`);
  return await productModel.getAllProducts(filter);
};

const getProductById = async (id) => {
  logger.debug(`DB getProductById: id=${id}`);
  const prod = await productModel.getProductById(id);
  if (!prod) return null;
  prod.flavors = await productModel.getFlavorsForProduct(id);
  return prod;
};

const updateProduct = async (id, data, actorUserId) => {
  logger.info(`DB updateProduct: id=${id} actor=${actorUserId || 'system'}`);
  const updated = await productModel.updateProduct(id, data);
  if (updated && actorUserId) {
    await historyModel.createHistory({ user_id: actorUserId, action_type: 'UPDATE_PRODUCT', entity_id: id, entity_type: 'PRODUCT', description: JSON.stringify(data) });
    logger.info(`AUDIT UPDATE_PRODUCT: id=${id} user=${actorUserId}`);
  }
  return updated;
};

const deleteProduct = async (id, actorUserId) => {
  logger.info(`DB deleteProduct: id=${id} actor=${actorUserId || 'system'}`);
  const deleted = await productModel.deleteProduct(id);
  if (deleted && actorUserId) {
    await historyModel.createHistory({ user_id: actorUserId, action_type: 'DELETE_PRODUCT', entity_id: id, entity_type: 'PRODUCT' });
    logger.info(`AUDIT DELETE_PRODUCT: id=${id} user=${actorUserId}`);
  }
  return deleted;
};

const addFlavorToProduct = async (product_id, flavor_id) => {
  logger.info(`DB addFlavorToProduct: product_id=${product_id} flavor_id=${flavor_id}`);
  return await productModel.addFlavorToProduct(product_id, flavor_id);
};

const removeFlavorFromProduct = async (product_id, flavor_id) => {
  logger.info(`DB removeFlavorFromProduct: product_id=${product_id} flavor_id=${flavor_id}`);
  return await productModel.removeFlavorFromProduct(product_id, flavor_id);
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addFlavorToProduct,
  removeFlavorFromProduct
};