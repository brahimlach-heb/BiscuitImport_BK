const roleService = require('../services/role.service');
const response = require('../utils/response');

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: List of roles
 */
const getAllRoles = async (req, res, next) => {
  try {
    const roles = await roleService.getAllRoles();
    response.success(res, roles);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Get a role by ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role found
 *       404:
 *         description: Role not found
 */
const getRoleById = async (req, res, next) => {
  try {
    const role = await roleService.getRoleById(req.params.id);
    if (!role) {
      return response.notFound(res, 'Role not found');
    }
    response.success(res, role);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/roles/code/{code}:
 *   get:
 *     summary: Get a role by code
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role found
 *       404:
 *         description: Role not found
 */
const getRoleByCode = async (req, res, next) => {
  try {
    const role = await roleService.getRoleByCode(req.params.code);
    if (!role) {
      return response.notFound(res, 'Role not found');
    }
    response.success(res, role);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               label:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Role created successfully
 */
const createRole = async (req, res, next) => {
  try {
    const role = await roleService.createRole(req.body);
    response.created(res, role);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Update a role
 *     tags: [Roles]
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
 *               code:
 *                 type: string
 *               label:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Role updated successfully
 */
const updateRole = async (req, res, next) => {
  try {
    const role = await roleService.updateRole(req.params.id, req.body);
    response.success(res, role);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Delete a role
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role deleted successfully
 */
const deleteRole = async (req, res, next) => {
  try {
    const result = await roleService.deleteRole(req.params.id);
    response.success(res, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  getRoleByCode,
  createRole,
  updateRole,
  deleteRole
};
