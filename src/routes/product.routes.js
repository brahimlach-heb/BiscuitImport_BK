/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Product management
 */

const express = require('express');
const controller = require('../controllers/product.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products (optional category filter)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by id (includes flavors)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /api/products/{id}/flavors:
 *   post:
 *     summary: Add flavor to product
 *     tags: [Products]
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
 *             properties:
 *               flavor_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Association created
 */

/**
 * @swagger
 * /api/products/{id}/flavors/{flavor_id}:
 *   delete:
 *     summary: Remove flavor from product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: flavor_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Association removed
 */

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', authMiddleware, controller.create);
router.put('/:id', authMiddleware, controller.update);
router.delete('/:id', authMiddleware, controller.remove);

// flavor association
router.post('/:id/flavors', authMiddleware, controller.addFlavor);
router.delete('/:id/flavors/:flavor_id', authMiddleware, controller.removeFlavor);

module.exports = router;