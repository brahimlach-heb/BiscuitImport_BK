/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Product management
 */

const express = require('express');
const controller = require('../controllers/product.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authOptionalMiddleware = require('../middlewares/auth.optional.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with role-based pricing (authentication required)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Optional category filter
 *     responses:
 *       200:
 *         description: List of products with prices based on user role
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       401:
 *         description: Authentication required
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
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - category_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Biscuit Petit Beurre"
 *               description:
 *                 type: string
 *                 example: "Délicieux biscuit au beurre"
 *               ingredients:
 *                 type: string
 *                 example: "Farine, sucre, beurre, sel"
 *               price:
 *                 type: number
 *                 example: 25.50
 *               stock:
 *                 type: integer
 *                 example: 100
 *               is_active:
 *                 type: boolean
 *                 example: true
 *               category_id:
 *                 type: integer
 *                 example: 1
 *               marque:
 *                 type: string
 *                 example: "LU"
 *               packageUnit:
 *                 type: integer
 *                 example: 12
 *                 description: "Number of products in package (defaults to 1)"
 *               flavors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Vanille"
 *                     description:
 *                       type: string
 *                       example: "Arôme naturel de vanille"
 *                     color:
 *                       type: string
 *                       example: "#FFF5E1"
 *                     image:
 *                       type: string
 *                       example: "vanilla.jpg"
 *                 description: "Optional array of flavors to create and associate with the product"
 *               price_roles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role_id:
 *                       type: integer
 *                       example: 2
 *                     price:
 *                       type: number
 *                       example: 20.00
 *                 description: "Optional role-based pricing"
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by id (includes flavors and price_roles)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product details with flavors and role-based pricing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *   put:
 *     summary: Update a product
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               ingredients:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               is_active:
 *                 type: boolean
 *               category_id:
 *                 type: integer
 *               marque:
 *                 type: string
 *               packageUnit:
 *                 type: integer
 *                 description: "Number of products in package"
 *               price_roles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role_id:
 *                       type: integer
 *                     price:
 *                       type: number
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
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
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
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

router.get('/', authMiddleware, controller.getAll);
router.get('/:id', authMiddleware, controller.getById);
router.post('/', authMiddleware, controller.create);
router.put('/:id', authMiddleware, controller.update);
router.delete('/:id', authMiddleware, controller.remove);

// flavor association
router.post('/:id/flavors', authMiddleware, controller.addFlavor);
router.delete('/:id/flavors/:flavor_id', authMiddleware, controller.removeFlavor);

module.exports = router;