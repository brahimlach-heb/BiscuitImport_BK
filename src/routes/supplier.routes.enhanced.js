/**
 * @swagger
 * tags:
 *   - name: Suppliers
 *     description: Supplier management and catalogs
 *   - name: Supplier Products
 *     description: Products associated with suppliers
 */

const express = require('express');
const controller = require('../controllers/supplier.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: Get all suppliers (paginated)
 *     tags: [Suppliers]
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
 *         name: name
 *         schema: { type: string }
 *         description: Filter by supplier name
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of suppliers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Supplier'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, controller.getAllSuppliers);

/**
 * @swagger
 * /api/suppliers/{id}:
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 *       404:
 *         description: Supplier not found
 */
router.get('/:id', authMiddleware, controller.getSupplierById);

/**
 * @swagger
 * /api/suppliers/{id}/products:
 *   get:
 *     summary: Get products associated with supplier
 *     tags: [Supplier Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of supplier products with pricing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SupplierProduct'
 */
router.get('/:id/products', authMiddleware, controller.getSupplierProducts);

/**
 * @swagger
 * /api/suppliers/{id}/performance:
 *   get:
 *     summary: Get supplier performance metrics
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
 *         description: Supplier performance KPIs
 */
router.get('/:id/performance', authMiddleware, controller.getSupplierPerformance);

/**
 * @swagger
 * /api/suppliers:
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
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Fournisseur ABC"
 *               email:
 *                 type: string
 *                 format: email
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
 *                 example: "Net 30"
 *     responses:
 *       201:
 *         description: Supplier created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 *       403:
 *         description: Only ADMIN can create suppliers
 */
router.post('/', authMiddleware, (req, res, next) => {
  if (req.user?.role_code?.toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ error: 'Only ADMIN can create suppliers' });
  }
  controller.createSupplier(req, res, next);
});

/**
 * @swagger
 * /api/suppliers/{id}:
 *   put:
 *     summary: Update supplier
 *     tags: [Suppliers]
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
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               address: { type: string }
 *               city: { type: string }
 *               postal_code: { type: string }
 *               country: { type: string }
 *               payment_terms: { type: string }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Supplier updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 */
router.put('/:id', authMiddleware, controller.updateSupplier);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   delete:
 *     summary: Delete supplier (soft delete, ADMIN only)
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
 *         description: Supplier deleted (soft delete)
 *       403:
 *         description: Only ADMIN can delete suppliers
 */
router.delete('/:id', authMiddleware, (req, res, next) => {
  if (req.user?.role_code?.toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ error: 'Only ADMIN can delete suppliers' });
  }
  controller.deleteSupplier(req, res, next);
});

/**
 * @swagger
 * /api/suppliers/{id}/products:
 *   post:
 *     summary: Add product to supplier catalog
 *     tags: [Supplier Products]
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
 *             properties:
 *               product_id:
 *                 type: integer
 *               supplier_sku:
 *                 type: string
 *                 example: "SKU123"
 *               lead_time_days:
 *                 type: integer
 *                 example: 7
 *               min_order_qty:
 *                 type: integer
 *                 example: 100
 *               unit_price:
 *                 type: number
 *                 format: double
 *                 example: 2.50
 *     responses:
 *       201:
 *         description: Product added to supplier
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupplierProduct'
 */
router.post('/:id/products', authMiddleware, controller.addProductToSupplier);

/**
 * @swagger
 * /api/suppliers/{id}/products/{productId}:
 *   put:
 *     summary: Update supplier product pricing/details
 *     tags: [Supplier Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Product updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupplierProduct'
 */
router.put('/:id/products/:productId', authMiddleware, controller.updateSupplierProduct);

/**
 * @swagger
 * /api/suppliers/{id}/products/{productId}:
 *   delete:
 *     summary: Remove product from supplier
 *     tags: [Supplier Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Product removed from supplier
 */
router.delete('/:id/products/:productId', authMiddleware, controller.deleteSupplierProduct);

module.exports = router;
