const userModel = require('../models/user.model');
const roleModel = require('../models/role.model');

const createUser = async (data) => {
  const { first_name, last_name, email, phone, address, password, role_id, discount_percent, is_active, deactivated_at } = data;
  if (!first_name || !last_name || !email || !password || !role_id) {
    const err = new Error('first_name, last_name, email, password, and role_id are required');
    err.status = 400;
    throw err;
  }
  const user = await userModel.createUser({ first_name, last_name, email, phone, address, password, role_id, discount_percent, is_active, deactivated_at });
  return user;
};

const getAllUsers = async () => {
  const users = await userModel.getAllUsers();
  // Ajouter le role_label pour chaque utilisateur
  const usersWithRoles = await Promise.all(users.map(async (user) => {
    const role = await roleModel.getRoleById(user.role_id);
    return {
      ...user,
      role_label: role ? role.label : null,
      
    };
  }));
  return usersWithRoles;
};

const getUserById = async (id) => {
  const user = await userModel.getUserById(id);
  return user ? { ...user } : null;
};

const updateUser = async (id, data) => {
  const { first_name, last_name, email, phone, address, password, role_id, discount_percent, is_active, modified_by } = data;
  const updated = await userModel.updateUser(id, { first_name, last_name, email, phone, address, password, role_id, discount_percent, is_active, modified_by });
  return updated;
};

const deleteUser = async (id) => {
  const deleted = await userModel.deleteUser(id);
  return deleted;
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};
