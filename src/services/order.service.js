const orderModel = require('../models/order.model');
const logger = require('../config/logger');

const createOrder = async (data) => {
  if (!data || !data.user_id || typeof data.total === 'undefined' || !Array.isArray(data.lines)) {
    const err = new Error('user_id, total and lines are required');
    err.status = 400;
    throw err;
  }
  logger.info(`DB createOrder: user_id=${data.user_id} subtotal=${data.subtotal || data.total} total=${data.total} remise=${data.remise || 0} lines=${data.lines.length} customer=${data.customer_name || 'N/A'}`);
  const order = await orderModel.createOrder({
    user_id: data.user_id,
    subtotal: data.subtotal,
    total: data.total,
    remise: data.remise,
    status: data.status,
    lines: data.lines,
    customer_name: data.customer_name,
    customer_email: data.customer_email,
    customer_phone: data.customer_phone,
    customer_address: data.customer_address
  });
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

const getAllOrders = async () => {
  logger.debug(`DB getAllOrders`);
  return await orderModel.getAllOrders();
};

const updateOrderStatus = async (order_id, status, changed_by, notes = null) => {
  logger.info(`DB updateOrderStatus: order_id=${order_id} new_status=${status} by=${changed_by}`);
  const success = await orderModel.updateOrderStatus(order_id, status, changed_by, notes);
  if (!success) {
    const err = new Error('Failed to update order status');
    err.status = 500;
    throw err;
  }
  logger.info(`ORDER STATUS UPDATED: id=${order_id} status=${status}`);
  return await orderModel.getOrderById(order_id);
};

const addPayment = async (order_id, paymentData, created_by) => {
  const { bank_id, payment_method, amount, notes } = paymentData;
  
  if (!payment_method || !amount) {
    const err = new Error('Payment method and amount are required');
    err.status = 400;
    throw err;
  }
  
  logger.info(`DB addPayment: order_id=${order_id} method=${payment_method} amount=${amount} by=${created_by}`);
  const payment = await orderModel.addPayment(order_id, { bank_id, payment_method, amount, notes, created_by });
  logger.info(`PAYMENT ADDED: id=${payment.id} order_id=${order_id}`);
  return payment;
};

const getPaymentsByOrder = async (order_id) => {
  logger.debug(`DB getPaymentsByOrder: order_id=${order_id}`);
  return await orderModel.getPaymentsByOrder(order_id);
};

const deletePayment = async (id, changed_by = null) => {
  logger.info(`DB deletePayment: id=${id}`);
  const payment = await orderModel.getPaymentById(id);
  if (!payment) {
    const err = new Error('Payment not found');
    err.status = 404;
    throw err;
  }

  const success = await orderModel.deletePayment(id);
  if (!success) {
    const err = new Error('Payment not found');
    err.status = 404;
    throw err;
  }

  logger.info(`PAYMENT DELETED: id=${id} order_id=${payment.order_id}`);

  const order = await orderModel.getOrderById(payment.order_id);
  if (order) {
    const amountPaid = Array.isArray(order.payments)
      ? order.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
      : 0;
    const orderTotal = Number(order.total || 0);
    const currentStatus = String(order.status || '').toUpperCase();

    if (currentStatus === 'PAID' && amountPaid < orderTotal) {
      await orderModel.updateOrderStatus(order.id, 'CONFIRMED', changed_by, 'payment deleted');
      logger.info(`ORDER STATUS UPDATED: id=${order.id} status=CONFIRMED reason=payment_deleted`);
    }
  }

  return true;
};

const updateRemise = async (order_id, remise) => {
  if (typeof remise !== 'number' || remise < 0) {
    const err = new Error('Remise must be a positive number');
    err.status = 400;
    throw err;
  }
  
  logger.info(`DB updateRemise: order_id=${order_id} remise=${remise}`);
  const order = await orderModel.updateRemise(order_id, remise);
  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }
  logger.info(`ORDER REMISE UPDATED: id=${order_id} remise=${remise}`);
  return order;
};

const deleteOrder = async (order_id) => {
  logger.info(`DB deleteOrder: order_id=${order_id}`);
  const success = await orderModel.deleteOrder(order_id);
  if (!success) {
    const err = new Error('Failed to delete order');
    err.status = 500;
    throw err;
  }
  logger.info(`ORDER DELETED: id=${order_id}`);
  return true;
};

module.exports = {
  createOrder,
  getOrderById,
  getOrdersByUser,
  getAllOrders,
  updateOrderStatus,
  addPayment,
  getPaymentsByOrder,
  deletePayment,
  updateRemise,
  deleteOrder
};