const crModel = require('../models/customer_return.model');
const stockModel = require('../models/stock_movement.model');

const createCustomerReturn = async (data) => {
  const { order_id, return_reason, reason, return_date, product_id, quantity_returned, unit_price } = data;
  if (!order_id) {
    const err = new Error('order_id is required');
    err.status = 400;
    throw err;
  }
  
  // Create the return record
  const cr = await crModel.createCustomerReturn({
    order_id, 
    return_reason: return_reason || reason,
    return_date
  });
  
  // If product_id and quantity_returned are provided, add the item
  if (product_id && quantity_returned) {
    await crModel.addCustomerReturnItem({
      customer_return_id: cr.id,
      product_id,
      quantity: quantity_returned,
      unit_price: unit_price || 0,
      reason: reason || return_reason
    });
    
    // Reload with items
    return await crModel.getCustomerReturnById(cr.id);
  }
  
  return cr;
};

const getCustomerReturnById = async (id) => {
  const cr = await crModel.getCustomerReturnById(id);
  if (!cr) {
    const err = new Error('Customer return not found');
    err.status = 404;
    throw err;
  }
  return cr;
};

const getCustomerReturns = async (filter = {}, pagination = {}) => {
  const crs = await crModel.getCustomerReturns(filter);
  
  // Apply pagination
  const page = pagination.page || 1;
  const limit = pagination.limit || 10;
  const offset = (page - 1) * limit;
  
  const paginated = crs.slice(offset, offset + limit);
  
  return {
    data: paginated,
    pagination: {
      page,
      limit,
      total: crs.length,
      pages: Math.ceil(crs.length / limit)
    }
  };
};

const updateCustomerReturn = async (id, data) => {
  await getCustomerReturnById(id);
  return await crModel.updateCustomerReturn(id, data);
};

const updateCustomerReturnStatus = async (id, status, refund_amount, refund_method, userId) => {
  const cr = await getCustomerReturnById(id);
  
  const validStatuses = ['pending', 'approved', 'rejected', 'refunded'];
  if (!validStatuses.includes(status)) {
    const err = new Error(`Invalid status. Must be one of: ${validStatuses.join(',')}`);
    err.status = 400;
    throw err;
  }

  if (status === 'approved' && cr.items) {
    // Remove stock for each returned item
    for (const item of cr.items) {
      await stockModel.updateStock(
        item.product_id,
        -item.quantity,
        'customer_return',
        id,
        `Customer return approved #${id}`,
        userId
      );
    }
  }

  return await crModel.updateCustomerReturnStatus(id, status, refund_amount, refund_method);
};

const deleteCustomerReturn = async (id) => {
  await getCustomerReturnById(id);
  return await crModel.deleteCustomerReturn(id);
};

const addCustomerReturnItem = async (crId, data) => {
  await getCustomerReturnById(crId);
  const { product_id, quantity, unit_price, reason } = data;
  if (!product_id || !quantity || !unit_price) {
    const err = new Error('product_id, quantity, and unit_price are required');
    err.status = 400;
    throw err;
  }
  return await crModel.addCustomerReturnItem({
    customer_return_id: crId,
    product_id,
    quantity,
    unit_price,
    reason
  });
};

const processRefund = async (id, refund_amount, refund_method, userId) => {
  const cr = await getCustomerReturnById(id);
  
  if (cr.status !== 'approved') {
    const err = new Error('Return must be approved before processing refund');
    err.status = 400;
    throw err;
  }

  // TODO: Process actual refund (payment gateway, etc.)
  
  return await crModel.updateCustomerReturnStatus(id, 'refunded', refund_amount, refund_method);
};

const getReturnReport = async (filter = {}) => {
  const crs = await crModel.getCustomerReturns(filter);
  
  const summary = {
    total_returns: crs.length,
    pending: crs.filter(cr => cr.status === 'pending').length,
    approved: crs.filter(cr => cr.status === 'approved').length,
    refunded: crs.filter(cr => cr.status === 'refunded').length,
    rejected: crs.filter(cr => cr.status === 'rejected').length,
    total_refunded: crs.reduce((sum, cr) => sum + (cr.refund_amount || 0), 0),
    by_reason: {}
  };

  crs.forEach(cr => {
    const reason = cr.return_reason || 'Not specified';
    summary.by_reason[reason] = (summary.by_reason[reason] || 0) + 1;
  });

  return {
    summary,
    details: crs
  };
};

module.exports = {
  createCustomerReturn,
  getCustomerReturnById,
  getCustomerReturns,
  updateCustomerReturn,
  updateCustomerReturnStatus,
  deleteCustomerReturn,
  addCustomerReturnItem,
  processRefund,
  getReturnReport
};
