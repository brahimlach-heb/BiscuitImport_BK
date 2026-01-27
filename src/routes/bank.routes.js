/**
 * @swagger
 * tags:
 *   - name: Banks
 *     description: Bank management
 */

const express = require('express');
const controller = require('../controllers/bank.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/banks:
 *   post:
 *     summary: Create a new bank
 *     tags: [Banks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - label
 *             properties:
 *               code:
 *                 type: string
 *                 description: Unique bank code
 *               label:
 *                 type: string
 *                 description: Bank name/label
 *     responses:
 *       201:
 *         description: Bank created
 */

/**
 * @swagger
 * /api/banks:
 *   get:
 *     summary: Get all banks
 *     tags: [Banks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of banks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   code:
 *                     type: string
 *                   label:
 *                     type: string
 */

/**
 * @swagger
 * /api/banks/{id}:
 *   get:
 *     summary: Get bank by ID
 *     tags: [Banks]
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
 *         description: Bank details
 */

/**
 * @swagger
 * /api/banks/{id}:
 *   put:
 *     summary: Update a bank
 *     tags: [Banks]
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
 *               - code
 *               - label
 *             properties:
 *               code:
 *                 type: string
 *               label:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bank updated
 */

/**
 * @swagger
 * /api/banks/{id}:
 *   delete:
 *     summary: Delete a bank
 *     tags: [Banks]
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
 *         description: Bank deleted
 */

router.post('/', authMiddleware, controller.create);
router.get('/', authMiddleware, controller.getAll);
router.get('/:id', authMiddleware, controller.getById);
router.put('/:id', authMiddleware, controller.update);
router.delete('/:id', authMiddleware, controller.remove);

module.exports = router;
