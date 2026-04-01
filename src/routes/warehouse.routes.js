/**
 * @swagger
 * tags:
 *   - name: Warehouses
 *     description: Warehouse inventory management
 *   - name: Warehouse Stock
 *     description: Stock status and capacity monitoring
 *   - name: Warehouse Transfers
 *     description: Inter-warehouse stock transfers
 */

const express = require('express');
const controller = require('../controllers/warehouse.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/warehouses:
 *   get:
 *     summary: Get all warehouses (paginated, with filters)
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name, location, or city
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of warehouses with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Warehouse'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', authMiddleware, controller.getAllWarehouses);

/**
 * @swagger
 * /api/warehouses:
 *   post:
 *     summary: Create new warehouse (ADMIN only)
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, location, capacity]
 *             properties:
 *               name: { type: string }
 *               location: { type: string }
 *               city: { type: string }
 *               capacity: { type: integer, description: "Warehouse capacity in units" }
 *               is_active: { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Warehouse created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Warehouse'
 */
router.post('/', authMiddleware, controller.createWarehouse);

/**
 * @swagger
 * /api/warehouses/transfer:
 *   post:
 *     summary: "Transfer stock between warehouses (TRANSACTION, MANAGER/ADMIN only)"
 *     tags: [Warehouse Transfers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [from_warehouse_id, to_warehouse_id, product_id, quantity]
 *             properties:
 *               from_warehouse_id: { type: integer, description: "Source warehouse ID" }
 *               to_warehouse_id: { type: integer, description: "Destination warehouse ID" }
 *               product_id: { type: integer }
 *               quantity: { type: integer }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: "Transfer completed (TRANSACTION: updates both warehouse stock levels)"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer }
 *                 message: { type: string }
 */
router.post('/transfer', authMiddleware, controller.transferStock);

/**
 * @swagger
 * /api/warehouses/{id}:
 *   get:
 *     summary: Get warehouse by ID
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Warehouse details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Warehouse'
 *       404:
 *         description: Warehouse not found
 */
router.get('/:id', authMiddleware, controller.getWarehouseById);

/**
 * @swagger
 * /api/warehouses/{id}/stock:
 *   get:
 *     summary: Get warehouse stock status
 *     tags: [Warehouse Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Warehouse stock information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer }
 *                 name: { type: string }
 *                 total_stock: { type: integer }
 *                 used_capacity: { type: integer }
 *                 capacity_percentage: { type: number, format: float }
 */
router.get('/:id/stock', authMiddleware, controller.getWarehouseStock);

/**
 * @swagger
 * /api/warehouses/{id}/transfers:
 *   get:
 *     summary: Get warehouse transfers (paginated)
 *     tags: [Warehouse Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [completed, pending, cancelled] }
 *     responses:
 *       200:
 *         description: List of warehouse transfers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WarehouseTransfer'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/:id/transfers', authMiddleware, controller.getWarehouseTransfers);

/**
 * @swagger
 * /api/warehouses/{id}/capacity:
 *   get:
 *     summary: Get warehouse capacity information
 *     tags: [Warehouse Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Warehouse capacity details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer }
 *                 name: { type: string }
 *                 capacity: { type: integer, description: "Total capacity" }
 *                 used_capacity: { type: integer }
 *                 available_capacity: { type: integer }
 *                 usage_percentage: { type: number, format: float }
 *                 status: { type: string, enum: [normal, warning, critical] }
 */
router.get('/:id/capacity', authMiddleware, controller.getWarehouseCapacity);

/**
 * @swagger
 * /api/warehouses/{id}:
 *   put:
 *     summary: Update warehouse
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               location: { type: string }
 *               city: { type: string }
 *               capacity: { type: integer }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Warehouse updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Warehouse'
 */
router.put('/:id', authMiddleware, controller.updateWarehouse);

/**
 * @swagger
 * /api/warehouses/{id}:
 *   delete:
 *     summary: Delete warehouse (soft delete, ADMIN only)
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Warehouse deleted
 */
router.delete('/:id', authMiddleware, controller.deleteWarehouse);

module.exports = router;
