/**
 * @swagger
 * tags:
 *   - name: Customer Returns
 *     description: Customer refund and return management
 *   - name: Customer Return Items
 *     description: Items in customer returns
 *   - name: Customer Return Reports
 *     description: Return analytics and reporting
 */

const express = require('express');
const controller = require('../controllers/customer_return.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/customer-returns:
 *   get:
 *     summary: Get all customer returns (paginated, with filters)
 *     tags: [Customer Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: order_id
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected, refunded] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of customer returns
 */
router.get('/', authMiddleware, controller.getAllCustomerReturns);

/**
 * @swagger
 * /api/customer-returns/{id}:
 *   get:
 *     summary: Get customer return by ID (with items)
 *     tags: [Customer Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Customer return details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerReturn'
 *       404:
 *         description: Customer return not found
 */
router.get('/:id', authMiddleware, controller.getCustomerReturnById);

/**
 * @swagger
 * /api/customer-returns:
 *   post:
 *     summary: "Create new customer return (status: pending)"
 *     tags: [Customer Returns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id, return_reason]
 *             properties:
 *               order_id: { type: integer, description: "Order ID" }
 *               return_reason: { type: string, description: "Reason for return" }
 *               return_date: { type: string, format: "date-time" }
 *     responses:
 *       201:
 *         description: Customer return created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerReturn'
 */
router.post('/', authMiddleware, controller.createCustomerReturn);

/**
 * @swagger
 * /api/customer-returns/{id}:
 *   put:
 *     summary: Update customer return (pending status only)
 *     tags: [Customer Returns]
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
 *               return_reason: { type: string }
 *               return_date: { type: string, format: "date-time" }
 *     responses:
 *       200:
 *         description: Customer return updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerReturn'
 */
router.put('/:id', authMiddleware, controller.updateCustomerReturn);

/**
 * @swagger
 * /api/customer-returns/{id}/status:
 *   patch:
 *     summary: Update return status (TRANSACTION - pending→approved→refunded)
 *     tags: [Customer Returns]
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, approved, rejected, refunded], description: "New status" }
 *               customNotes: { type: string }
 *     responses:
 *       200:
 *         description: "Status updated (TRANSACTION: approves return, decreases stock, processes refund)"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerReturn'
 */
router.patch('/:id/status', authMiddleware, controller.updateCustomerReturnStatus);

/**
 * @swagger
 * /api/customer-returns/{id}/refund:
 *   post:
 *     summary: Process refund for approved customer return
 *     tags: [Customer Returns]
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
 *             required: [refund_method]
 *             properties:
 *               refund_method: { type: string, description: "e.g., credit_card, bank_transfer" }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Refund processed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerReturn'
 */
router.post('/:id/refund', authMiddleware, controller.processRefund);

/**
 * @swagger
 * /api/customer-returns/{id}:
 *   delete:
 *     summary: Delete customer return (pending status only)
 *     tags: [Customer Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Customer return deleted
 */
router.delete('/:id', authMiddleware, controller.deleteCustomerReturn);

/**
 * @swagger
 * /api/customer-returns/report/all:
 *   get:
 *     summary: Get customer returns report (analytics)
 *     tags: [Customer Return Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: "date" }
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: "date" }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Returns report with summary statistics
 */
router.get('/report/all', authMiddleware, controller.getReturnReport);

/**
 * @swagger
 * /api/customer-returns/{id}/items:
 *   post:
 *     summary: Add item to customer return
 *     tags: [Customer Return Items]
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
 *             required: [product_id, quantity, unit_price]
 *             properties:
 *               product_id: { type: integer }
 *               quantity: { type: integer }
 *               unit_price: { type: number, format: "double" }
 *               reason: { type: string }
 *     responses:
 *       201:
 *         description: Item added to return
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerReturnItem'
 */
router.post('/:id/items', authMiddleware, controller.addCustomerReturnItem);

module.exports = router;
