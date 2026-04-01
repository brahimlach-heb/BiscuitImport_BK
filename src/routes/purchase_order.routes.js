/**
 * @swagger
 * tags:
 *   - name: Purchase Orders
 *     description: Complete purchase order management from suppliers
 *   - name: Purchase Order Lines
 *     description: Line items in purchase orders with quantities and pricing
 *   - name: Purchase Order Operations
 *     description: Complex operations like receiving PO and viewing history
 */

const express = require('express');
const controller = require('../controllers/purchase_order.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/purchase-orders:
 *   get:
 *     summary: Get all purchase orders (paginated, with filters)
 *     tags: [Purchase Orders]
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
 *         name: supplier_id
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, sent, received, cancelled] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by supplier name
 *     responses:
 *       200:
 *         description: List of purchase orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PurchaseOrder'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', authMiddleware, controller.getAllPurchaseOrders);

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   get:
 *     summary: Get purchase order by ID (with items + history)
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Purchase order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrder'
 */
router.get('/:id', authMiddleware, controller.getPurchaseOrderById);

/**
 * @swagger
 * /api/purchase-orders/{id}/history:
 *   get:
 *     summary: Get purchase order history
 *     tags: [Purchase Order Operations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Historical changes for PO
 */
router.get('/:id/history', authMiddleware, controller.getPurchaseOrderHistory);

/**
 * @swagger
 * /api/purchase-orders:
 *   post:
 *     summary: Create new purchase order with optional line items
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplier_id
 *             properties:
 *               supplier_id: { type: integer }
 *               warehouse_id: { type: integer }
 *               expected_delivery:
 *                 type: string
 *                 format: date-time
 *               notes: { type: string }
 *               lines:
 *                 type: array
 *                 description: "Line items for the purchase order"
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - quantity
 *                     - unit_price
 *                   properties:
 *                     product_id: { type: integer }
 *                     quantity: { type: number }
 *                     unit_price: { type: number }
 *                     received_quantity: { type: number, description: "Quantity already received" }
 *     responses:
 *       201:
 *         description: "Purchase order created (status: draft) with lines"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrder'
 */
router.post('/', authMiddleware, controller.createPurchaseOrder);

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   put:
 *     summary: Update purchase order (draft only)
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               supplier_id: { type: integer }
 *               warehouse_id: { type: integer }
 *               expected_delivery:
 *                 type: string
 *                 format: date-time
 *               total_amount: { type: number }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Purchase order updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrder'
 */
router.put('/:id', authMiddleware, controller.updatePurchaseOrder);

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   delete:
 *     summary: Delete purchase order (draft/cancelled only)
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Purchase order deleted
 */
router.delete('/:id', authMiddleware, controller.deletePurchaseOrder);

/**
 * @swagger
 * /api/purchase-orders/{id}/status:
 *   put:
 *     summary: Update purchase order status
 *     tags: [Purchase Order Operations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, sent, received, cancelled]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:id/status', authMiddleware, controller.updatePurchaseOrderStatus);

/**
 * @swagger
 * /api/purchase-orders/{id}/lines:
 *   post:
 *     summary: Add line to purchase order
 *     tags: [Purchase Order Lines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity
 *               - unit_price
 *             properties:
 *               product_id: { type: integer }
 *               quantity: { type: integer }
 *               unit_price: { type: number, format: double }
 *     responses:
 *       201:
 *         description: Line added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrderLine'
 */
router.post('/:id/lines', authMiddleware, controller.addPurchaseOrderLine);

/**
 * @swagger
 * /api/purchase-orders/{id}/lines/{lineId}:
 *   delete:
 *     summary: Delete line from purchase order
 *     tags: [Purchase Order Lines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: lineId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Line deleted
 */
router.delete('/:id/lines/:lineId', authMiddleware, controller.deletePurchaseOrderLine);

/**
 * @swagger
 * /api/purchase-orders/{id}/receive:
 *   post:
 *     summary: Receive purchase order (mark as received and update stock)
 *     tags: [Purchase Order Operations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Purchase order received - all items received with ordered quantities, stock updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrder'
 */
router.post('/:id/receive', authMiddleware, controller.receivePurchaseOrder);

module.exports = router;
