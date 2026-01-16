const historyService = require('../services/history.service');
const logger = require('../config/logger');

const getAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.user_id) filter.user_id = Number(req.query.user_id);
    if (req.query.entity_type) filter.entity_type = req.query.entity_type;
    if (req.query.entity_id) filter.entity_id = Number(req.query.entity_id);

    const entries = await historyService.getHistory(filter);
    const userInfo = req.user ? `${req.user.first_name} ${req.user.last_name} (${req.user.id})` : 'anonymous';
    logger.info(`ACTION getHistory count=${Array.isArray(entries) ? entries.length : 0} filter=${JSON.stringify(filter)} by=${userInfo}`);
    res.status(200).json(entries);
  } catch (err) {
    const userInfo = req.user ? `${req.user.first_name} ${req.user.last_name} (${req.user.id})` : 'anonymous';
    logger.error(`ERROR getHistory: ${err.message}`, { query: req.query, user: userInfo });
    next(err);
  }
};

module.exports = { getAll };