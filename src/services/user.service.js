const userModel = require('../models/user.model');

const createUser = async (data) => {
  if (!data || !data.name || !data.email) {
    const err = new Error('Name and email are required');
    err.status = 400;
    throw err;
  }
  // Basic create; unique email constraint enforced by DB
  const user = await userModel.createUser({ name: data.name, email: data.email });
  return user;
};

const getAllUsers = async () => {
  return await userModel.getAllUsers();
};

const getUserById = async (id) => {
  const user = await userModel.getUserById(id);
  return user;
};

const updateUser = async (id, data) => {
  if (!data || !data.name || !data.email) {
    const err = new Error('Name and email are required');
    err.status = 400;
    throw err;
  }
  const updated = await userModel.updateUser(id, { name: data.name, email: data.email });
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
