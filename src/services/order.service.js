const orderModel = require('../models/order.model');
const logger = require('../config/logger');

const createOrder = async (data) => {
  if (!data || !data.user_id || typeof data.total === 'undefined' || !Array.isArray(data.lines)) {
    const err = new Error('user_id, total and lines are required');
    err.status = 400;
    throw err;
  }
  logger.info(`DB createOrder: user_id=${data.user_id} total=${data.total} lines=${data.lines.length}`);
  const order = await orderModel.createOrder(data);
  logger.info(`ORDER CREATED: id=${order.id} user=${data.user_id} total=${data.total}`);
  return order;
};

const getOrderById = async (id) => {
  logger.debug(`DB getOrderById: id=${id}`);
  return await orderModel.getOrderById(id);
};

const getOrdersByUser = async (user_id) => {
  logger.debug(`DB getOrdersByUser: user_id=${user_id}`);
  return await orderModel.getOrdersByUser(user_id);
};

module.exports = {
  createOrder,
  getOrderById,
  getOrdersByUser
};