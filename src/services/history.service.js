const historyModel = require('../models/history.model');
const logger = require('../config/logger');

const getHistory = async (filter) => {
  logger.debug(`DB getHistory: filter=${JSON.stringify(filter)}`);
  return await historyModel.getHistory(filter || {});
};

module.exports = { getHistory };