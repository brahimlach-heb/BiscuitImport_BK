/**
 * @swagger
 * tags:
 *   - name: Flavors
 *     description: Flavor management
 */

const express = require('express');
const controller = require('../controllers/flavor.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const flavorUploadDir = path.join(process.cwd(), 'uploads', 'flavors');
fs.mkdirSync(flavorUploadDir, { recursive: true });

const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, flavorUploadDir),
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname) || '.png';
		const base = path.basename(file.originalname, ext).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'flavor';
		cb(null, `${Date.now()}-${base}${ext}`);
	}
});

const upload = multer({ storage });

const router = express.Router();

/**
 * @swagger
 * /api/flavors:
 *   get:
 *     summary: Get all flavors
 *     tags: [Flavors]
 *     responses:
 *       200:
 *         description: List of flavors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Flavor'
 */

/**
 * @swagger
 * /api/flavors:
 *   post:
 *     summary: Create a flavor
 *     tags: [Flavors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Flavor'
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /api/flavors/{id}:
 *   get:
 *     summary: Get flavor by id
 *     tags: [Flavors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Flavor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Flavor'
 */

/**
 * @swagger
 * /api/flavors/{id}:
 *   put:
 *     summary: Update a flavor
 *     tags: [Flavors]
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
 *             $ref: '#/components/schemas/Flavor'
 *     responses:
 *       200:
 *         description: Updated
 */

/**
 * @swagger
 * /api/flavors/{id}:
 *   delete:
 *     summary: Delete a flavor
 *     tags: [Flavors]
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
 *         description: Deleted
 */

router.get('/', authMiddleware, controller.getAll);
router.get('/:id', authMiddleware, controller.getById);
router.post('/', authMiddleware, upload.single('image'), controller.create);
router.put('/:id', authMiddleware, upload.single('image'), controller.update);
router.delete('/:id', authMiddleware, controller.remove);

module.exports = router;