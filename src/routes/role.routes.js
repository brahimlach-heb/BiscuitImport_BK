const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Get all roles
router.get('/', roleController.getAllRoles);

// Get role by ID
router.get('/:id', roleController.getRoleById);

// Get role by code
router.get('/code/:code', roleController.getRoleByCode);

// Create a new role (protected, admin only)
router.post('/', authMiddleware.authenticate, roleController.createRole);

// Update a role (protected, admin only)
router.put('/:id', authMiddleware.authenticate, roleController.updateRole);

// Delete a role (protected, admin only)
router.delete('/:id', authMiddleware.authenticate, roleController.deleteRole);

module.exports = router;
