/**
 * @swagger
 * tags:
 *   - name: Stock Inventory
 *     description: Current stock levels and inventory status
 *   - name: Stock Movements
 *     description: Stock transaction history and complete tracking
 *   - name: Stock Analysis
 *     description: Alerts, comprehensive reports, and stock analytics
 *   - name: Stock Operations
 *     description: Adjust, transfer, import stock (restricted to MANAGER)
 */

const express = require('express');
const controller = require('../controllers/stock.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /stock/all:
 *   get:
 *     summary: Get all stock (paginated)
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of all product stock
 */
/**
 * @swagger
 * /api/stock/all:
 *   get:
 *     summary: Get all stock (paginated)
 *     tags: [Stock Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of all product stock
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Stock'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/all', authMiddleware, controller.getAllStock);

/**
 * @swagger
 * /api/stock/product/{productId}:
 *   get:
 *     summary: Get stock for specific product
 *     tags: [Stock Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Product stock details with movements
 */
router.get('/product/:productId', authMiddleware, controller.getStockByProduct);

/**
 * @swagger
 * /api/stock/movements:
 *   get:
 *     summary: Get all stock movements (paginated)
 *     tags: [Stock Movements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [in, out, adjustment, transfer, return] }
 *       - in: query
 *         name: reference_type
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of stock movements
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StockMovement'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/movements', authMiddleware, controller.getStockMovements);

/**
 * @swagger
 * /api/stock/movements/{productId}:
 *   get:
 *     summary: Get stock movements for specific product
 *     tags: [Stock Movements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Movement history for product
 */
router.get('/movements/:productId', authMiddleware, controller.getStockMovements);

/**
 * @swagger
 * /api/stock/report:
 *   get:
 *     summary: Get stock report with summary
 *     tags: [Stock Analysis]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comprehensive stock report
 */
router.get('/report', authMiddleware, controller.getStockReport);

/**
 * @swagger
 * /api/stock/alerts:
 *   get:
 *     summary: Get low stock alerts
 *     tags: [Stock Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema: { type: integer, default: 10 }
 *         description: Alert threshold
 *     responses:
 *       200:
 *         description: Products below threshold
 */
router.get('/alerts', authMiddleware, controller.getStockAlerts);

/**
 * @swagger
 * /api/stock/update:
 *   put:
 *     summary: Update stock (for manual updates)
 *     tags: [Stock Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity_change
 *             properties:
 *               product_id: { type: integer }
 *               quantity_change: { type: integer }
 *               reference_type: { type: string }
 *               reference_id: { type: integer }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Stock updated with movement record
 */
router.put('/update', authMiddleware, controller.updateStock);

/**
 * @swagger
 * /api/stock/adjust:
 *   post:
 *     summary: Adjust stock to specific quantity (MANAGER only)
 *     tags: [Stock Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - new_quantity
 *             properties:
 *               product_id: { type: integer }
 *               new_quantity: { type: integer }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Stock adjusted
 *       403:
 *         description: Only MANAGER/ADMIN can adjust stock
 */
router.post('/adjust', authMiddleware, controller.adjustStock);

/**
 * @swagger
 * /api/stock/transfer:
 *   post:
 *     summary: Transfer stock between products (MANAGER only)
 *     tags: [Stock Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - from_product_id
 *               - to_product_id
 *               - quantity
 *             properties:
 *               from_product_id: { type: integer }
 *               to_product_id: { type: integer }
 *               quantity: { type: integer }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Stock transferred
 *       403:
 *         description: Only MANAGER/ADMIN can transfer stock
 */
router.post('/transfer', authMiddleware, controller.transferStock);

/**
 * @swagger
 * /api/stock/import:
 *   post:
 *     summary: Import/adjust stock in bulk (MANAGER only)
 *     tags: [Stock Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - import_data
 *             properties:
 *               import_data:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id: { type: integer }
 *                     quantity: { type: integer }
 *                     reason: { type: string }
 *     responses:
 *       200:
 *         description: Stock imported with results
 *       403:
 *         description: Only MANAGER/ADMIN can import stock
 */
router.post('/import', authMiddleware, controller.importStock);

module.exports = router;
