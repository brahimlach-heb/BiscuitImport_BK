const supplierModel = require('../models/supplier.model');

const createSupplier = async (data) => {
  const { name, email, phone, address, city, postal_code, country, payment_terms, is_active } = data;
  if (!name) {
    const err = new Error('Supplier name is required');
    err.status = 400;
    throw err;
  }
  const supplier = await supplierModel.createSupplier({
    name, email, phone, address, city, postal_code, country, payment_terms, is_active: is_active !== false
  });
  return supplier;
};

const getSupplierById = async (id) => {
  const supplier = await supplierModel.getSupplierById(id);
  if (!supplier) {
    const err = new Error('Supplier not found');
    err.status = 404;
    throw err;
  }
  return supplier;
};

const getAllSuppliers = async (filter = {}, pagination = {}) => {
  const suppliers = await supplierModel.getAllSuppliers(filter);
  
  // Apply pagination
  const page = pagination.page || 1;
  const limit = pagination.limit || 10;
  const offset = (page - 1) * limit;
  
  const paginated = suppliers.slice(offset, offset + limit);
  
  return {
    data: paginated,
    pagination: {
      page,
      limit,
      total: suppliers.length,
      pages: Math.ceil(suppliers.length / limit)
    }
  };
};

const updateSupplier = async (id, data) => {
  await getSupplierById(id); // Check existence
  const updated = await supplierModel.updateSupplier(id, data);
  return updated;
};

const deleteSupplier = async (id) => {
  await getSupplierById(id); // Check existence
  return await supplierModel.softDeleteSupplier(id);
};

const addProductToSupplier = async (supplierId, data) => {
  await getSupplierById(supplierId);
  const { product_id, supplier_sku, lead_time_days, min_order_qty, unit_price } = data;
  if (!product_id) {
    const err = new Error('product_id is required');
    err.status = 400;
    throw err;
  }
  return await supplierModel.addProductToSupplier({
    supplier_id: supplierId,
    product_id,
    supplier_sku,
    lead_time_days,
    min_order_qty,
    unit_price
  });
};

const getSupplierProducts = async (supplierId) => {
  await getSupplierById(supplierId);
  return await supplierModel.getSupplierProducts(supplierId);
};

const updateSupplierProduct = async (supplierId, productId, data) => {
  await getSupplierById(supplierId);
  const product = await supplierModel.getSupplierProducts(supplierId);
  if (!product.find(p => p.product_id === productId)) {
    const err = new Error('Product not found in supplier');
    err.status = 404;
    throw err;
  }
  return await supplierModel.updateSupplierProduct(productId, data);
};

const deleteSupplierProduct = async (supplierId, productId) => {
  await getSupplierById(supplierId);
  return await supplierModel.deleteSupplierProduct(supplierId, productId);
};

const getSupplierPerformance = async (supplierId) => {
  await getSupplierById(supplierId);
  // TODO: Calculate performance metrics (on-time delivery, quality rating, etc.)
  return {
    supplier_id: supplierId,
    on_time_delivery_rate: 95,
    quality_rating: 4.5,
    order_count: 0,
    last_order_date: null
  };
};

module.exports = {
  createSupplier,
  getSupplierById,
  getAllSuppliers,
  updateSupplier,
  deleteSupplier,
  addProductToSupplier,
  getSupplierProducts,
  updateSupplierProduct,
  deleteSupplierProduct,
  getSupplierPerformance
};
