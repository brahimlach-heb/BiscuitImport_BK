const orderService = require('../services/order.service');
const logger = require('../config/logger');

const create = async (req, res, next) => {
  try {
    const data = req.body;
    const order = await orderService.createOrder(data);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION createOrder id=${order.id} user_id=${data.user_id} subtotal=${data.subtotal || data.total} total=${data.total} lines=${Array.isArray(data.lines) ? data.lines.length : 0} customer=${data.customer_name || 'N/A'} by=${userInfo}`);
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
    if (!req.user || !req.user.id) {
      logger.warn(`ACTION getOrdersByUser_unauthorized`);
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Vérifier si l'utilisateur est MANAGER ou ADMIN
    const allowedRoles = ['MANAGER', 'ADMIN'];
    if (!req.user.role_code || !allowedRoles.includes(req.user.role_code.toUpperCase())) {
      logger.warn(`ACTION getOrdersByUser_forbidden user_id=${req.user.id} role=${req.user.role_code}`);
      return res.status(403).json({ error: 'Access forbidden: Only MANAGER and ADMIN can access orders' });
    }
    
    // MANAGER et ADMIN voient toutes les commandes
    const rows = await orderService.getAllOrders();
    logger.info(`ACTION getAllOrders count=${Array.isArray(rows) ? rows.length : 0} by=${req.user.id}`);
    res.status(200).json(rows);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR getOrdersByUser: ${err.message}`, { user: userInfo });
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status, notes } = req.body;
    
    if (!status) {
      logger.warn(`ACTION updateOrderStatus_missing_status id=${id}`);
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const changed_by = req.user ? req.user.id : null;
    const order = await orderService.updateOrderStatus(id, status, changed_by, notes);
    
    if (!order) {
      logger.info(`ACTION updateOrderStatus_not_found id=${id}`);
      return res.status(404).json({ error: 'Order not found' });
    }
    
    logger.info(`ACTION updateOrderStatus id=${id} status=${status} by=${changed_by}`);
    res.status(200).json(order);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR updateOrderStatus id=${req.params.id}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

const addPayment = async (req, res, next) => {
  try {
    const order_id = Number(req.params.id);
    const paymentData = req.body;
    const created_by = req.user ? req.user.id : null;
    
    const payment = await orderService.addPayment(order_id, paymentData, created_by);
    logger.info(`ACTION addPayment order_id=${order_id} payment_id=${payment.id} by=${created_by}`);
    res.status(201).json(payment);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR addPayment order_id=${req.params.id}: ${err.message}`, { body: req.body, user: userInfo });
    next(err);
  }
};

const getPayments = async (req, res, next) => {
  try {
    const order_id = Number(req.params.id);
    const payments = await orderService.getPaymentsByOrder(order_id);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION getPayments order_id=${order_id} count=${payments.length} by=${userInfo}`);
    res.status(200).json(payments);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR getPayments order_id=${req.params.id}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

const deletePayment = async (req, res, next) => {
  try {
    const payment_id = Number(req.params.paymentId);
    await orderService.deletePayment(payment_id);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION deletePayment payment_id=${payment_id} by=${userInfo}`);
    res.status(200).json({ success: true, message: 'Payment deleted' });
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR deletePayment payment_id=${req.params.paymentId}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

module.exports = { create, getById, getByUser, updateStatus, addPayment, getPayments, deletePayment };