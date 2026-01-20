const categoryService = require('../services/category.service');
const logger = require('../config/logger');

const getAll = async (req, res, next) => {
  try {
    const cats = await categoryService.getAllCategories();
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION getAllCategories count=${Array.isArray(cats) ? cats.length : 0} by=${userInfo}`);
    res.status(200).json(cats);
  } catch (err) {
    logger.error(`ERROR getAllCategories: ${err.message}`);
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const cat = await categoryService.getCategoryById(id);
    if (!cat) {
      const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
      logger.info(`ACTION getCategoryById_not_found id=${id} by=${userInfo}`);
      return res.status(404).json({ error: 'Category not found' });
    }
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION getCategoryById id=${id} name=${cat.name} by=${userInfo}`);
    res.status(200).json(cat);
  } catch (err) {
    logger.error(`ERROR getCategoryById id=${req.params.id}: ${err.message}`);
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const actor = req.user ? req.user.id : null;
    const cat = await categoryService.createCategory(req.body, actor);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION createCategory id=${cat.id} name=${cat.name} by=${userInfo}`);
    res.status(201).json(cat);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR createCategory: ${err.message}`, { body: req.body, user: userInfo });
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actor = req.user ? req.user.id : null;
    const updated = await categoryService.updateCategory(id, req.body, actor);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    if (!updated) {
      logger.info(`ACTION updateCategory_not_found id=${id} by=${userInfo}`);
      return res.status(404).json({ error: 'Category not found' });
    }
    logger.info(`ACTION updateCategory id=${id} by=${userInfo}`);
    res.status(200).json({ success: true });
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR updateCategory id=${req.params.id}: ${err.message}`, { body: req.body, user: userInfo });
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actor = req.user ? req.user.id : null;
    const deleted = await categoryService.deleteCategory(id, actor);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    if (!deleted) {
      logger.info(`ACTION deleteCategory_not_found id=${id} by=${userInfo}`);
      return res.status(404).json({ error: 'Category not found' });
    }
    logger.info(`ACTION deleteCategory id=${id} by=${userInfo}`);
    res.status(200).json({ success: true });
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR deleteCategory id=${req.params.id}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };