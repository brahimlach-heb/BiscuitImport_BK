/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Order management
 */

const express = require('express');
const controller = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by id
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get orders for authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders for the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *                 enum: [PENDING, CONFIRMED, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order with updated status and history
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 */

/**
 * @swagger
 * /api/orders/{id}/payments:
 *   post:
 *     summary: Add payment to order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_method
 *               - amount
 *             properties:
 *               bank_id:
 *                 type: integer
 *                 description: Bank ID (optional for cash payments)
 *               payment_method:
 *                 type: string
 *                 enum: [CASH, CARD, TRANSFER, CHECK, OTHER]
 *               amount:
 *                 type: number
 *                 format: double
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment added
 *   get:
 *     summary: Get all payments for an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of payments
 */

/**
 * @swagger
 * /api/orders/{id}/payments/{paymentId}:
 *   delete:
 *     summary: Delete a payment
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment deleted
 */

/**
 * @swagger
 * /api/orders/{id}/remise:
 *   patch:
 *     summary: Update discount (remise) for an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - remise
 *             properties:
 *               remise:
 *                 type: number
 *                 format: double
 *                 minimum: 0
 *                 description: Discount amount
 *                 example: 10.50
 *     responses:
 *       200:
 *         description: Order updated with new discount
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid remise value
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/orders/{id}/devis:
 *   get:
 *     summary: Download order quotation (devis) PDF
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: PDF file downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Order or devis file not found
 */

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete an order (only if status is PENDING)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       403:
 *         description: Only pending orders can be deleted
 *       404:
 *         description: Order not found
 */

router.post('/', authMiddleware, controller.create);
router.get('/:id', authMiddleware, controller.getById);
router.get('/', authMiddleware, controller.getByUser);
router.get('/:id/devis', authMiddleware, controller.downloadDevis);
router.patch('/:id/status', authMiddleware, controller.updateStatus);
router.patch('/:id/remise', authMiddleware, controller.updateRemise);
router.delete('/:id', authMiddleware, controller.deleteOrder);
router.post('/:id/payments', authMiddleware, controller.addPayment);
router.get('/:id/payments', authMiddleware, controller.getPayments);
router.delete('/:id/payments/:paymentId', authMiddleware, controller.deletePayment);

module.exports = router;