const categoryModel = require('../models/category.model');
const historyModel = require('../models/history.model');
const logger = require('../config/logger');

const createCategory = async (data, actorUserId) => {
  if (!data || !data.name) {
    const err = new Error('Name is required');
    err.status = 400;
    throw err;
  }
  logger.info(`DB createCategory: name=${data.name} actor=${actorUserId || 'system'}`);
  const cat = await categoryModel.createCategory(data);
  // Log history
  if (actorUserId) {
    await historyModel.createHistory({ user_id: actorUserId, action_type: 'ADD_CATEGORY', entity_id: cat.id, entity_type: 'CATEGORY', description: JSON.stringify(cat) });
    logger.info(`AUDIT ADD_CATEGORY: id=${cat.id} user=${actorUserId}`);
  }
  return cat;
};

const getAllCategories = async () => {
  logger.debug('DB getAllCategories');
  return await categoryModel.getAllCategories();
};

const getCategoryById = async (id) => {
  logger.debug(`DB getCategoryById: id=${id}`);
  return await categoryModel.getCategoryById(id);
};

const updateCategory = async (id, data, actorUserId) => {
  logger.info(`DB updateCategory: id=${id} actor=${actorUserId || 'system'}`);
  const updated = await categoryModel.updateCategory(id, data);
  if (updated && actorUserId) {
    await historyModel.createHistory({ user_id: actorUserId, action_type: 'UPDATE_CATEGORY', entity_id: id, entity_type: 'CATEGORY', description: JSON.stringify(data) });
    logger.info(`AUDIT UPDATE_CATEGORY: id=${id} user=${actorUserId}`);
  }
  return updated;
};

const deleteCategory = async (id, actorUserId) => {
  logger.info(`DB deleteCategory: id=${id} actor=${actorUserId || 'system'}`);
  const deleted = await categoryModel.deleteCategory(id);
  if (deleted && actorUserId) {
    await historyModel.createHistory({ user_id: actorUserId, action_type: 'DELETE_CATEGORY', entity_id: id, entity_type: 'CATEGORY' });
    logger.info(`AUDIT DELETE_CATEGORY: id=${id} user=${actorUserId}`);
  }
  return deleted;
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};