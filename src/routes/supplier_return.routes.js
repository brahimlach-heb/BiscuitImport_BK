/**
 * @swagger
 * tags:
 *   - name: Supplier Returns
 *     description: Supplier return and credit management
 *   - name: Supplier Return Items
 *     description: Items in supplier returns
 *   - name: Supplier Return Reports
 *     description: Return analytics and reporting by supplier
 */

const express = require('express');
const controller = require('../controllers/supplier_return.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/supplier-returns:
 *   get:
 *     summary: Get all supplier returns (paginated, with filters)
 *     tags: [Supplier Returns]
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
 *         name: purchase_order_id
 *         schema: { type: integer }
 *       - in: query
 *         name: supplier_id
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, credited, rejected] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of supplier returns
 */
router.get('/', authMiddleware, controller.getAllSupplierReturns);

/**
 * @swagger
 * /api/supplier-returns/{id}:
 *   get:
 *     summary: Get supplier return by ID (with items + PO info)
 *     tags: [Supplier Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Supplier return details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupplierReturn'
 *       404:
 *         description: Supplier return not found
 */
router.get('/:id', authMiddleware, controller.getSupplierReturnById);

/**
 * @swagger
 * /api/supplier-returns:
 *   post:
 *     summary: "Create new supplier return (status: pending)"
 *     tags: [Supplier Returns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [purchase_order_id, supplier_id, return_reason]
 *             properties:
 *               purchase_order_id: { type: integer }
 *               supplier_id: { type: integer }
 *               return_reason: { type: string }
 *               return_date: { type: string, format: "date-time" }
 *     responses:
 *       201:
 *         description: Supplier return created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupplierReturn'
 */
router.post('/', authMiddleware, controller.createSupplierReturn);

/**
 * @swagger
 * /api/supplier-returns/{id}:
 *   put:
 *     summary: Update supplier return (pending status only)
 *     tags: [Supplier Returns]
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
 *         description: Supplier return updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupplierReturn'
 */
router.put('/:id', authMiddleware, controller.updateSupplierReturn);

/**
 * @swagger
 * /api/supplier-returns/{id}/status:
 *   patch:
 *     summary: Update return status (TRANSACTION - pending→approved→credited)
 *     tags: [Supplier Returns]
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
 *               status: { type: string, enum: [pending, approved, credited, rejected], description: "New status" }
 *               customNotes: { type: string }
 *     responses:
 *       200:
 *         description: "Status updated (TRANSACTION: approves return, increases stock, processes credit)"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupplierReturn'
 */
router.patch('/:id/status', authMiddleware, controller.updateSupplierReturnStatus);

/**
 * @swagger
 * /api/supplier-returns/{id}/credit:
 *   post:
 *     summary: Process credit memo for approved supplier return
 *     tags: [Supplier Returns]
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
 *               credit_method: { type: string, description: "e.g., account_credit, next_invoice" }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Credit processed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupplierReturn'
 */
router.post('/:id/credit', authMiddleware, controller.processCredit);

/**
 * @swagger
 * /api/supplier-returns/{id}:
 *   delete:
 *     summary: Delete supplier return (pending status only)
 *     tags: [Supplier Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Supplier return deleted
 */
router.delete('/:id', authMiddleware, controller.deleteSupplierReturn);

/**
 * @swagger
 * /api/supplier-returns/report/all:
 *   get:
 *     summary: Get supplier returns report (analytics by supplier)
 *     tags: [Supplier Return Reports]
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
 *         name: supplier_id
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Returns report with supplier breakdown
 */
router.get('/report/all', authMiddleware, controller.getReturnReport);

/**
 * @swagger
 * /api/supplier-returns/{id}/items:
 *   post:
 *     summary: Add item to supplier return
 *     tags: [Supplier Return Items]
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
 *               $ref: '#/components/schemas/SupplierReturnItem'
 */
router.post('/:id/items', authMiddleware, controller.addSupplierReturnItem);

module.exports = router;
