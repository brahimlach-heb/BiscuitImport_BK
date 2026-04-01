const poModel = require('../models/purchase_order.model');
const stockModel = require('../models/stock_movement.model');
const supplierModel = require('../models/supplier.model');

const createPurchaseOrder = async (data) => {
  const { supplier_id, warehouse_id, expected_delivery, notes, created_by, lines = [] } = data;
  if (!supplier_id) {
    const err = new Error('supplier_id is required');
    err.status = 400;
    throw err;
  }
  
  // Create purchase order without total_amount (will be calculated from lines)
  const po = await poModel.createPurchaseOrder({
    supplier_id, warehouse_id, expected_delivery, notes, created_by
  });

  // Add lines if provided
  if (Array.isArray(lines) && lines.length > 0) {
    for (const line of lines) {
      const { product_id, quantity, unit_price, received_quantity } = line;
      if (!product_id || !quantity || !unit_price) {
        const err = new Error('Each line must have product_id, quantity, and unit_price');
        err.status = 400;
        throw err;
      }
      await poModel.addPurchaseOrderLine({
        purchase_order_id: po.id,
        product_id,
        quantity,
        unit_price,
        received_quantity
      });
    }
  }

  // Return purchase order with updated lines
  return await poModel.getPurchaseOrderById(po.id);
};

const getPurchaseOrderById = async (id) => {
  const po = await poModel.getPurchaseOrderById(id);
  if (!po) {
    const err = new Error('Purchase order not found');
    err.status = 404;
    throw err;
  }
  return po;
};

const getPurchaseOrders = async (filter = {}, pagination = {}) => {
  const pos = await poModel.getPurchaseOrders(filter);
  
  // Apply pagination
  const page = pagination.page || 1;
  const limit = pagination.limit || 10;
  const offset = (page - 1) * limit;
  
  const paginated = pos.slice(offset, offset + limit);
  
  return {
    data: paginated,
    pagination: {
      page,
      limit,
      total: pos.length,
      pages: Math.ceil(pos.length / limit)
    }
  };
};

const getSupplierPurchaseOrders = async (supplierId, pagination = {}) => {
  await supplierModel.getSupplierById(supplierId);
  return await getPurchaseOrders({ supplier_id: supplierId }, pagination);
};

const updatePurchaseOrder = async (id, data) => {
  await getPurchaseOrderById(id);
  
  // Destructure lines from data
  const { lines = [], ...poData } = data;
  
  // Update purchase order data
  const updatedPo = await poModel.updatePurchaseOrder(id, poData);
  
  // If lines are provided, update them
  if (Array.isArray(lines) && lines.length > 0) {
    // Delete existing lines
    await poModel.deletePurchaseOrderlines(id);
    
    // Add new lines
    for (const line of lines) {
      const { product_id, quantity, unit_price, received_quantity } = line;
      if (product_id && quantity && unit_price) {
        await poModel.addPurchaseOrderLine({
          purchase_order_id: id,
          product_id,
          quantity,
          unit_price,
          received_quantity
        });
      }
    }
    
    // Return updated PO with new lines
    return await poModel.getPurchaseOrderById(id);
  }
  
  return updatedPo;
};

const updatePurchaseOrderStatus = async (id, status) => {
  await getPurchaseOrderById(id);
  const validStatuses = ['draft', 'sent', 'received', 'cancelled'];
  if (!validStatuses.includes(status)) {
    const err = new Error(`Invalid status. Must be one of: ${validStatuses.join(',')}`);
    err.status = 400;
    throw err;
  }
  return await poModel.updatePurchaseOrderStatus(id, status);
};

const deletePurchaseOrder = async (id) => {
  await getPurchaseOrderById(id);
  return await poModel.deletePurchaseOrder(id);
};

const addPurchaseOrderLine = async (poId, data) => {
  await getPurchaseOrderById(poId);
  const { product_id, quantity, unit_price } = data;
  if (!product_id || !quantity || !unit_price) {
    const err = new Error('product_id, quantity, and unit_price are required');
    err.status = 400;
    throw err;
  }
  return await poModel.addPurchaseOrderLine({
    purchase_order_id: poId,
    product_id,
    quantity,
    unit_price
  });
};

const deletePurchaseOrderLine = async (lineId) => {
  return await poModel.deletePurchaseOrderLine(lineId);
};

const receivePurchaseOrder = async (poId, userId) => {
  const po = await getPurchaseOrderById(poId);
  
  if (po.status !== 'sent') {
    const err = new Error('Purchase order must be in sent status to be received');
    err.status = 400;
    throw err;
  }

  // If there are lines, receive them
  let receivedItems = [];
  
  if (po.lines && po.lines.length > 0) {
    // Update stock for each product line
    for (const line of po.lines) {
      await stockModel.updateStock(
        line.product_id,
        line.quantity,
        'purchase_order',
        poId,
        `Received from PO #${poId} - Line #${line.id}`,
        userId
      );
    }

    // Create received items array for model update
    receivedItems = po.lines.map(line => ({
      line_id: line.id,
      received_quantity: line.quantity
    }));
  }

  return await poModel.receivePurchaseOrder(poId, receivedItems);
};

const getPurchaseOrderHistory = async (id) => {
  await getPurchaseOrderById(id);
  // TODO: Implement history tracking
  return [];
};

module.exports = {
  createPurchaseOrder,
  getPurchaseOrderById,
  getPurchaseOrders,
  getSupplierPurchaseOrders,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
  addPurchaseOrderLine,
  deletePurchaseOrderLine,
  receivePurchaseOrder,
  getPurchaseOrderHistory
};
