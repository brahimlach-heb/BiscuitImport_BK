const orderService = require('../services/order.service');

const create = async (req, res, next) => {
  try {
    const data = req.body;
    const order = await orderService.createOrder(data);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION createOrder id=${order.id} user_id=${data.user_id} total=${data.total} lines=${Array.isArray(data.lines) ? data.lines.length : 0} by=${userInfo}`);
    res.status(201).json(order);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR createOrder: ${err.message}`, { body: req.body, user: userInfo });
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const o = await orderService.getOrderById(id);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    if (!o) {
      logger.info(`ACTION getOrderById_not_found id=${id} by=${userInfo}`);
      return res.status(404).json({ error: 'Order not found' });
    }
    logger.info(`ACTION getOrderById id=${id} user_id=${o.user_id} status=${o.status} by=${userInfo}`);
    res.status(200).json(o);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR getOrderById id=${req.params.id}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

const getByUser = async (req, res, next) => {
  try {
    const user_id = Number(req.query.user_id || (req.user ? req.user.id : 0));
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    if (!user_id) {
      logger.warn(`ACTION getOrdersByUser_missing_user_id by=${userInfo}`);
      return res.status(400).json({ error: 'user_id required' });
    }
    const rows = await orderService.getOrdersByUser(user_id);
    logger.info(`ACTION getOrdersByUser user_id=${user_id} count=${Array.isArray(rows) ? rows.length : 0} by=${userInfo}`);
    res.status(200).json(rows);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR getOrdersByUser user_id=${req.query.user_id}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

module.exports = { create, getById, getByUser };