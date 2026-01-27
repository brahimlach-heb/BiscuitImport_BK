const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Get all roles
router.get('/', authMiddleware, roleController.getAllRoles);

// Get role by ID
router.get('/:id', authMiddleware, roleController.getRoleById);

// Get role by code
router.get('/code/:code', authMiddleware, roleController.getRoleByCode);

// Create a new role (protected, admin only)
router.post('/', authMiddleware, roleController.createRole);

// Update a role (protected, admin only)
router.put('/:id', authMiddleware, roleController.updateRole);

// Delete a role (protected, admin only)
router.delete('/:id', authMiddleware, roleController.deleteRole);

module.exports = router;
