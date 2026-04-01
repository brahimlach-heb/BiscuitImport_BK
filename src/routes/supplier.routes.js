/**
 * @swagger
 * tags:
 *   - name: Suppliers
 *     description: Supplier management
 */

const express = require('express');
const controller = require('../controllers/supplier.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: Get all suppliers (paginated)
 *     tags: [Suppliers]
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
 *         name: name
 *         schema: { type: string }
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of suppliers
 */
router.get('/', authMiddleware, controller.getAllSuppliers);

/**
 * @swagger
 * /suppliers/{id}:
 *   get:
 *     summary: Get supplier by ID
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Supplier details
 *       404:
 *         description: Supplier not found
 */
router.get('/:id', authMiddleware, controller.getSupplierById);

/**
 * @swagger
 * /suppliers/{id}/products:
 *   get:
 *     summary: Get products associated with supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/products', authMiddleware, controller.getSupplierProducts);

/**
 * @swagger
 * /suppliers/{id}/performance:
 *   get:
 *     summary: Get supplier performance metrics
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/performance', authMiddleware, controller.getSupplierPerformance);

/**
 * @swagger
 * /suppliers:
 *   post:
 *     summary: Create new supplier (ADMIN only)
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               country:
 *                 type: string
 *               payment_terms:
 *                 type: string
 */
router.post('/', authMiddleware, (req, res, next) => {
  if (req.user?.role_code?.toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ error: 'Only ADMIN can create suppliers' });
  }
  controller.createSupplier(req, res, next);
});

/**
 * @swagger
 * /suppliers/{id}:
 *   put:
 *     summary: Update supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authMiddleware, controller.updateSupplier);

/**
 * @swagger
 * /suppliers/{id}:
 *   delete:
 *     summary: Delete supplier (soft delete, ADMIN only)
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authMiddleware, (req, res, next) => {
  if (req.user?.role_code?.toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ error: 'Only ADMIN can delete suppliers' });
  }
  controller.deleteSupplier(req, res, next);
});

/**
 * @swagger
 * /suppliers/{id}/products:
 *   post:
 *     summary: Add product to supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/products', authMiddleware, controller.addProductToSupplier);

/**
 * @swagger
 * /suppliers/{id}/products/{productId}:
 *   put:
 *     summary: Update supplier product
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/products/:productId', authMiddleware, controller.updateSupplierProduct);

/**
 * @swagger
 * /suppliers/{id}/products/{productId}:
 *   delete:
 *     summary: Remove product from supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id/products/:productId', authMiddleware, controller.deleteSupplierProduct);

module.exports = router;
