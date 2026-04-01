const logger = require('../config/logger');
const service = require('../services/warehouse.service');

/**
 * Get all warehouses
 */
const getAllWarehouses = async (req, res) => {
  try {
    const { page, limit, search, city, is_active } = req.query;
    const filter = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search: search || null,
      city: city || null,
      is_active: is_active !== undefined ? is_active === 'true' : undefined
    };

    const result = await service.getAllWarehouses(filter);
    logger.info(`GET /api/warehouses - Found ${result.data.length} warehouses`);
    res.json(result);
  } catch (error) {
    logger.error('Error fetching warehouses:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
};

/**
 * Get warehouse by ID
 */
const getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await service.getWarehouseById(id);
    logger.info(`GET /api/warehouses/${id} - Success`);
    res.json(warehouse);
  } catch (error) {
    logger.error(`Error fetching warehouse ${req.params.id}:`, error);
    res.status(error.status || 500).json({ error: error.message });
  }
};

/**
 * Get warehouse stock
 */
const getWarehouseStock = async (req, res) => {
  try {
    const { id } = req.params;
    const stock = await service.getWarehouseStockStatus(id);
    logger.info(`GET /api/warehouses/${id}/stock - Success`);
    res.json(stock);
  } catch (error) {
    logger.error(`Error fetching warehouse stock ${req.params.id}:`, error);
    res.status(error.status || 500).json({ error: error.message });
  }
};

/**
 * Get warehouse transfers
 */
const getWarehouseTransfers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page, limit, status } = req.query;
    
    const filter = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status: status || null
    };

    const transfers = await service.getWarehouseTransfers(id, filter);
    logger.info(`GET /api/warehouses/${id}/transfers - Found ${transfers.data.length} transfers`);
    res.json(transfers);
  } catch (error) {
    logger.error(`Error fetching warehouse transfers ${req.params.id}:`, error);
    res.status(error.status || 500).json({ error: error.message });
  }
};

/**
 * Get warehouse capacity
 */
const getWarehouseCapacity = async (req, res) => {
  try {
    const { id } = req.params;
    const capacity = await service.getWarehouseCapacity(id);
    logger.info(`GET /api/warehouses/${id}/capacity - Success`);
    res.json(capacity);
  } catch (error) {
    logger.error(`Error fetching warehouse capacity ${req.params.id}:`, error);
    res.status(error.status || 500).json({ error: error.message });
  }
};

/**
 * Create warehouse
 */
const createWarehouse = async (req, res) => {
  try {
    // Check authorization - ADMIN only
    if (req.user?.role_code !== 'ADMIN') {
      logger.warn(`Unauthorized warehouse creation attempt by user ${req.user?.id}`);
      return res.status(403).json({ error: 'Only ADMIN can create warehouses' });
    }

    const warehouse = await service.createWarehouse(req.body);
    logger.info(`POST /api/warehouses - Created warehouse ${warehouse.data[0].id}`);
    res.status(201).json(warehouse);
  } catch (error) {
    logger.error('Error creating warehouse:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
};

/**
 * Update warehouse
 */
const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await service.updateWarehouse(id, req.body);
    logger.info(`PUT /api/warehouses/${id} - Updated successfully`);
    res.json(warehouse);
  } catch (error) {
    logger.error(`Error updating warehouse ${req.params.id}:`, error);
    res.status(error.status || 500).json({ error: error.message });
  }
};

/**
 * Delete warehouse (soft delete)
 */
const deleteWarehouse = async (req, res) => {
  try {
    // Check authorization - ADMIN only
    if (req.user?.role_code !== 'ADMIN') {
      logger.warn(`Unauthorized warehouse deletion attempt by user ${req.user?.id}`);
      return res.status(403).json({ error: 'Only ADMIN can delete warehouses' });
    }

    const { id } = req.params;
    const result = await service.deleteWarehouse(id);
    logger.info(`DELETE /api/warehouses/${id} - Deleted successfully`);
    res.json(result);
  } catch (error) {
    logger.error(`Error deleting warehouse ${req.params.id}:`, error);
    res.status(error.status || 500).json({ error: error.message });
  }
};

/**
 * Transfer stock between warehouses
 */
const transferStock = async (req, res) => {
  try {
    // Check authorization - MANAGER only
    if (req.user?.role_code !== 'MANAGER' && req.user?.role_code !== 'ADMIN') {
      logger.warn(`Unauthorized stock transfer attempt by user ${req.user?.id}`);
      return res.status(403).json({ error: 'Only MANAGER or ADMIN can transfer stock' });
    }

    const { from_warehouse_id, to_warehouse_id, product_id, quantity, notes } = req.body;
    
    const result = await service.transferStock(
      from_warehouse_id,
      to_warehouse_id,
      product_id,
      quantity,
      notes,
      req.user.id
    );

    logger.info(`POST /api/warehouses/transfer - Transfer from warehouse ${from_warehouse_id} to ${to_warehouse_id}`);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error transferring stock:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
};

module.exports = {
  getAllWarehouses,
  getWarehouseById,
  getWarehouseStock,
  getWarehouseTransfers,
  getWarehouseCapacity,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  transferStock
};
