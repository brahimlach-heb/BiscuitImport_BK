const db = require('../config/database');

// Create table suppliers
db.run(`CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  payment_terms TEXT,
  is_active INTEGER DEFAULT 1,
  soft_delete_flag INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Create table supplier_products
db.run(`CREATE TABLE IF NOT EXISTS supplier_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  supplier_sku TEXT,
  lead_time_days INTEGER,
  min_order_qty INTEGER,
  unit_price REAL,
  last_order_date DATETIME,
  performance_rating REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (product_id) REFERENCES product(id),
  UNIQUE(supplier_id, product_id)
)`);

const createSupplier = (data) => {
  return new Promise((resolve, reject) => {
    const { name, email, phone, address, city, postal_code, country, payment_terms, is_active } = data;
    const sql = `INSERT INTO suppliers (name, email, phone, address, city, postal_code, country, payment_terms, is_active)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, 1))`;
    db.run(sql, [name, email || null, phone || null, address || null, city || null, postal_code || null, country || null, payment_terms || null, is_active], function (err) {
      if (err) return reject(err);
      getAllSuppliers({ id: this.lastID }).then(suppliers => {
        resolve(suppliers[0] || null);
      }).catch(reject);
    });
  });
};

const getSupplierById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM suppliers WHERE id = ? AND soft_delete_flag = 0', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

const getAllSuppliers = (filter = {}) => {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM suppliers WHERE soft_delete_flag = 0';
    const params = [];

    if (filter.id) {
      sql += ' AND id = ?';
      params.push(filter.id);
    }
    if (filter.name) {
      sql += ' AND name LIKE ?';
      params.push(`%${filter.name}%`);
    }
    if (filter.is_active !== undefined) {
      sql += ' AND is_active = ?';
      params.push(filter.is_active ? 1 : 0);
    }

    sql += ' ORDER BY created_at DESC';

    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

const updateSupplier = (id, data) => {
  return new Promise((resolve, reject) => {
    const { name, email, phone, address, city, postal_code, country, payment_terms, is_active } = data;
    const sql = `UPDATE suppliers SET name = ?, email = ?, phone = ?, address = ?, city = ?, postal_code = ?, country = ?, payment_terms = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ? AND soft_delete_flag = 0`;
    db.run(sql, [name || null, email || null, phone || null, address || null, city || null, postal_code || null, country || null, payment_terms || null, is_active !== undefined ? (is_active ? 1 : 0) : 1, id], (err) => {
      if (err) return reject(err);
      getSupplierById(id).then(resolve).catch(reject);
    });
  });
};

const softDeleteSupplier = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE suppliers SET soft_delete_flag = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    db.run(sql, [id], (err) => {
      if (err) return reject(err);
      resolve({ success: true });
    });
  });
};

const addProductToSupplier = (data) => {
  return new Promise((resolve, reject) => {
    const { supplier_id, product_id, supplier_sku, lead_time_days, min_order_qty, unit_price } = data;
    const sql = `INSERT INTO supplier_products (supplier_id, product_id, supplier_sku, lead_time_days, min_order_qty, unit_price)
                 VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [supplier_id, product_id, supplier_sku || null, lead_time_days || null, min_order_qty || 0, unit_price || 0], function (err) {
      if (err) return reject(err);
      getSupplierProduct(this.lastID).then(resolve).catch(reject);
    });
  });
};

const getSupplierProduct = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM supplier_products WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

const getSupplierProducts = (supplier_id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT sp.*, p.name as product_name, p.price, p.stock, p.category_id
                 FROM supplier_products sp
                 LEFT JOIN product p ON sp.product_id = p.id
                 WHERE sp.supplier_id = ?
                 ORDER BY sp.created_at DESC`;
    db.all(sql, [supplier_id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

const updateSupplierProduct = (id, data) => {
  return new Promise((resolve, reject) => {
    const { supplier_sku, lead_time_days, min_order_qty, unit_price } = data;
    const sql = `UPDATE supplier_products SET supplier_sku = ?, lead_time_days = ?, min_order_qty = ?, unit_price = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`;
    db.run(sql, [supplier_sku || null, lead_time_days || null, min_order_qty || 0, unit_price || 0, id], (err) => {
      if (err) return reject(err);
      getSupplierProduct(id).then(resolve).catch(reject);
    });
  });
};

const deleteSupplierProduct = (supplier_id, product_id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM supplier_products WHERE supplier_id = ? AND product_id = ?', [supplier_id, product_id], (err) => {
      if (err) return reject(err);
      resolve({ success: true });
    });
  });
};

module.exports = {
  createSupplier,
  getSupplierById,
  getAllSuppliers,
  updateSupplier,
  softDeleteSupplier,
  addProductToSupplier,
  getSupplierProduct,
  getSupplierProducts,
  updateSupplierProduct,
  deleteSupplierProduct
};
