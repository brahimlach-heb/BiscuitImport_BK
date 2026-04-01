const logger = require('../config/logger');
const warehouseModel = require('../models/warehouse.model');

/**
 * Create warehouse
 */
const createWarehouse = async (data) => {
  const { name, location, city, capacity } = data;

  if (!name) {
    const err = new Error('Warehouse name is required');
    err.status = 400;
    throw err;
  }

  if (!location) {
    const err = new Error('Warehouse location is required');
    err.status = 400;
    throw err;
  }

  if (!capacity || capacity <= 0) {
    const err = new Error('Warehouse capacity must be greater than 0');
    err.status = 400;
    throw err;
  }

  return await warehouseModel.createWarehouse(data);
};

/**
 * Get all warehouses
 */
const getAllWarehouses = async (filter) => {
  return await warehouseModel.getAllWarehouses(filter);
};

/**
 * Get warehouse by ID
 */
const getWarehouseById = async (id) => {
  if (!id) {
    const err = new Error('Warehouse ID is required');
    err.status = 400;
    throw err;
  }

  const warehouse = await warehouseModel.getWarehouseById(id);
  if (!warehouse) {
    const err = new Error('Warehouse not found');
    err.status = 404;
    throw err;
  }

  return warehouse;
};

/**
 * Get warehouse stock status
 */
const getWarehouseStockStatus = async (warehouseId) => {
  const warehouse = await warehouseModel.getWarehouseById(warehouseId);
  if (!warehouse) {
    const err = new Error('Warehouse not found');
    err.status = 404;
    throw err;
  }

  return await warehouseModel.getWarehouseStockStatus(warehouseId);
};

/**
 * Get warehouse transfers
 */
const getWarehouseTransfers = async (warehouseId, filter) => {
  const warehouse = await warehouseModel.getWarehouseById(warehouseId);
  if (!warehouse) {
    const err = new Error('Warehouse not found');
    err.status = 404;
    throw err;
  }

  return await warehouseModel.getWarehouseTransfers(warehouseId, filter);
};

/**
 * Get warehouse capacity
 */
const getWarehouseCapacity = async (warehouseId) => {
  const warehouse = await warehouseModel.getWarehouseById(warehouseId);
  if (!warehouse) {
    const err = new Error('Warehouse not found');
    err.status = 404;
    throw err;
  }

  return await warehouseModel.getWarehouseCapacity(warehouseId);
};

/**
 * Update warehouse
 */
const updateWarehouse = async (id, data) => {
  if (!id) {
    const err = new Error('Warehouse ID is required');
    err.status = 400;
    throw err;
  }

  const warehouse = await warehouseModel.getWarehouseById(id);
  if (!warehouse) {
    const err = new Error('Warehouse not found');
    err.status = 404;
    throw err;
  }

  return await warehouseModel.updateWarehouse(id, data);
};

/**
 * Delete warehouse (soft delete)
 */
const deleteWarehouse = async (id) => {
  if (!id) {
    const err = new Error('Warehouse ID is required');
    err.status = 400;
    throw err;
  }

  const warehouse = await warehouseModel.getWarehouseById(id);
  if (!warehouse) {
    const err = new Error('Warehouse not found');
    err.status = 404;
    throw err;
  }

  return await warehouseModel.softDeleteWarehouse(id);
};

/**
 * Transfer stock between warehouses
 */
const transferStock = async (fromWarehouseId, toWarehouseId, productId, quantity, notes, userId) => {
  if (!fromWarehouseId || !toWarehouseId || !productId || !quantity) {
    const err = new Error('All fields are required: fromWarehouseId, toWarehouseId, productId, quantity');
    err.status = 400;
    throw err;
  }

  if (quantity <= 0) {
    const err = new Error('Quantity must be greater than 0');
    err.status = 400;
    throw err;
  }

  if (fromWarehouseId === toWarehouseId) {
    const err = new Error('Source and destination warehouses must be different');
    err.status = 400;
    throw err;
  }

  // Verify both warehouses exist
  const fromWarehouse = await warehouseModel.getWarehouseById(fromWarehouseId);
  if (!fromWarehouse) {
    const err = new Error('Source warehouse not found');
    err.status = 404;
    throw err;
  }

  const toWarehouse = await warehouseModel.getWarehouseById(toWarehouseId);
  if (!toWarehouse) {
    const err = new Error('Destination warehouse not found');
    err.status = 404;
    throw err;
  }

  return await warehouseModel.transferStock(fromWarehouseId, toWarehouseId, productId, quantity, notes, userId);
};

module.exports = {
  createWarehouse,
  getAllWarehouses,
  getWarehouseById,
  getWarehouseStockStatus,
  getWarehouseTransfers,
  getWarehouseCapacity,
  updateWarehouse,
  deleteWarehouse,
  transferStock
};
