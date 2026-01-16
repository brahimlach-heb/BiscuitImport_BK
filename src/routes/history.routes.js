/**
 * @swagger
 * tags:
 *   - name: History
 *     description: Audit history
 */

const express = require('express');
const controller = require('../controllers/history.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/history:
 *   get:
 *     summary: Get history entries
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: entity_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: entity_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of history entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/History'
 */

router.get('/', authMiddleware, controller.getAll);

module.exports = router;