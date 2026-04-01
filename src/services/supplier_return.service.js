const srModel = require('../models/supplier_return.model');
const stockModel = require('../models/stock_movement.model');

const createSupplierReturn = async (data) => {
  const { po_id, purchase_order_id, product_id, quantity_returned, reason, return_reason, unit_price } = data;
  
  // Map po_id to purchase_order_id
  const poId = po_id || purchase_order_id;
  
  if (!poId) {
    const err = new Error('po_id or purchase_order_id is required');
    err.status = 400;
    throw err;
  }
  
  // Create supplier return without product_id (that's the parent record)
  const sr = await srModel.createSupplierReturn({
    purchase_order_id: poId,
    return_reason: return_reason || reason
  });
  
  // If product_id and quantity_returned are provided, add the item
  if (product_id && quantity_returned) {
    await srModel.addSupplierReturnItem({
      supplier_return_id: sr.id,
      product_id,
      quantity: quantity_returned,
      unit_price: unit_price || 0,
      reason: reason || return_reason
    });
    
    // Reload with items
    return await srModel.getSupplierReturnById(sr.id);
  }
  
  return sr;
};

const getSupplierReturnById = async (id) => {
  const sr = await srModel.getSupplierReturnById(id);
  if (!sr) {
    const err = new Error('Supplier return not found');
    err.status = 404;
    throw err;
  }
  return sr;
};

const getSupplierReturns = async (filter = {}, pagination = {}) => {
  const srs = await srModel.getSupplierReturns(filter);
  
  // Apply pagination
  const page = pagination.page || 1;
  const limit = pagination.limit || 10;
  const offset = (page - 1) * limit;
  
  const paginated = srs.slice(offset, offset + limit);
  
  return {
    data: paginated,
    pagination: {
      page,
      limit,
      total: srs.length,
      pages: Math.ceil(srs.length / limit)
    }
  };
};

const updateSupplierReturn = async (id, data) => {
  await getSupplierReturnById(id);
  return await srModel.updateSupplierReturn(id, data);
};

const updateSupplierReturnStatus = async (id, status, credit_amount, userId) => {
  const sr = await getSupplierReturnById(id);
  
  const validStatuses = ['pending', 'approved', 'credited', 'rejected'];
  if (!validStatuses.includes(status)) {
    const err = new Error(`Invalid status. Must be one of: ${validStatuses.join(',')}`);
    err.status = 400;
    throw err;
  }

  if (status === 'approved' && sr.items) {
    // Add back stock for each returned item
    for (const item of sr.items) {
      await stockModel.updateStock(
        item.product_id,
        item.quantity,
        'supplier_return',
        id,
        `Supplier return approved #${id}`,
        userId
      );
    }
  }

  return await srModel.updateSupplierReturnStatus(id, status, credit_amount);
};

const deleteSupplierReturn = async (id) => {
  await getSupplierReturnById(id);
  return await srModel.deleteSupplierReturn(id);
};

const addSupplierReturnItem = async (srId, data) => {
  await getSupplierReturnById(srId);
  const { product_id, quantity, unit_price, reason } = data;
  if (!product_id || !quantity || !unit_price) {
    const err = new Error('product_id, quantity, and unit_price are required');
    err.status = 400;
    throw err;
  }
  return await srModel.addSupplierReturnItem({
    supplier_return_id: srId,
    product_id,
    quantity,
    unit_price,
    reason
  });
};

const processCredit = async (id, credit_amount, userId) => {
  const sr = await getSupplierReturnById(id);
  
  if (sr.status !== 'approved') {
    const err = new Error('Return must be approved before processing credit');
    err.status = 400;
    throw err;
  }

  // TODO: Process actual credit (payment, etc.)
  
  return await srModel.updateSupplierReturnStatus(id, 'credited', credit_amount);
};

const getReturnReport = async (filter = {}) => {
  const srs = await srModel.getSupplierReturns(filter);
  
  const summary = {
    total_returns: srs.length,
    pending: srs.filter(sr => sr.status === 'pending').length,
    approved: srs.filter(sr => sr.status === 'approved').length,
    credited: srs.filter(sr => sr.status === 'credited').length,
    rejected: srs.filter(sr => sr.status === 'rejected').length,
    total_credited: srs.reduce((sum, sr) => sum + (sr.credit_amount || 0), 0),
    by_reason: {},
    by_supplier: {}
  };

  srs.forEach(sr => {
    const reason = sr.return_reason || 'Not specified';
    summary.by_reason[reason] = (summary.by_reason[reason] || 0) + 1;
    
    const supplier = sr.supplier_name || 'Unknown';
    summary.by_supplier[supplier] = (summary.by_supplier[supplier] || 0) + 1;
  });

  return {
    summary,
    details: srs
  };
};

module.exports = {
  createSupplierReturn,
  getSupplierReturnById,
  getSupplierReturns,
  updateSupplierReturn,
  updateSupplierReturnStatus,
  deleteSupplierReturn,
  addSupplierReturnItem,
  processCredit,
  getReturnReport
};
