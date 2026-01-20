const roleModel = require('../models/role.model');

const createRole = async (roleData) => {
  try {
    const role = await roleModel.createRole(roleData);
    return role;
  } catch (error) {
    throw error;
  }
};

const getAllRoles = async () => {
  try {
    const roles = await roleModel.getAllRoles();
    return roles;
  } catch (error) {
    throw error;
  }
};

const getRoleById = async (id) => {
  try {
    const role = await roleModel.getRoleById(id);
    return role;
  } catch (error) {
    throw error;
  }
};

const getRoleByCode = async (code) => {
  try {
    const role = await roleModel.getRoleByCode(code);
    return role;
  } catch (error) {
    throw error;
  }
};

const updateRole = async (id, roleData) => {
  try {
    const updated = await roleModel.updateRole(id, roleData);
    if (!updated) {
      throw new Error('Role not found or not updated');
    }
    return await roleModel.getRoleById(id);
  } catch (error) {
    throw error;
  }
};

const deleteRole = async (id) => {
  try {
    const deleted = await roleModel.deleteRole(id);
    if (!deleted) {
      throw new Error('Role not found');
    }
    return { message: 'Role deleted successfully' };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  getRoleByCode,
  updateRole,
  deleteRole
};
