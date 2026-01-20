const db = require('../config/database');

// Create table product
db.run(`CREATE TABLE IF NOT EXISTS product (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  ingredients TEXT,
  allergens TEXT,
  price REAL NOT NULL,
  image TEXT,
  stock INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  category_id INTEGER,
  FOREIGN KEY (category_id) REFERENCES category(id)
)`);

// Try to add columns if missing (for migrations)
const tryAddColumn = (sql) => {
  db.run(sql, (err) => {
    // ignore error (column exists)
  });
};

tryAddColumn("ALTER TABLE product ADD COLUMN allergens TEXT");

// Create association table product_flavor if not exists
db.run(`CREATE TABLE IF NOT EXISTS product_flavor (
  product_id INTEGER NOT NULL,
  flavor_id INTEGER NOT NULL,
  PRIMARY KEY (product_id, flavor_id),
  FOREIGN KEY (product_id) REFERENCES product(id),
  FOREIGN KEY (flavor_id) REFERENCES flavor(id)
)`);

const createProduct = ({ name, description, ingredients, allergens, price, image, stock, is_active, category_id }) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO product (name, description, ingredients, allergens, price, image, stock, is_active, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, 1), ?)';
    db.run(sql, [name, description || null, ingredients || null, allergens || null, price, image || null, typeof stock !== 'undefined' ? stock : 0, typeof is_active !== 'undefined' ? (is_active ? 1 : 0) : null, category_id || null], function (err) {
      if (err) return reject(err);
      db.get('SELECT * FROM product WHERE id = ?', [this.lastID], (err2, row) => {
        if (err2) return reject(err2);
        resolve(row);
      });
    });
  });
};

const getAllProducts = (filter = {}) => {
  return new Promise((resolve, reject) => {
    const params = [];
    let sql = 'SELECT * FROM product';
    if (filter.category_id) {
      sql += ' WHERE category_id = ?';
      params.push(filter.category_id);
    }
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const getProductById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM product WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

const updateProduct = (id, { name, description, ingredients, allergens, price, image, stock, is_active, category_id }) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE product SET name = COALESCE(?, name), description = COALESCE(?, description), ingredients = COALESCE(?, ingredients), allergens = COALESCE(?, allergens), price = COALESCE(?, price), image = COALESCE(?, image), stock = COALESCE(?, stock), is_active = COALESCE(?, is_active), category_id = COALESCE(?, category_id) WHERE id = ?';
    db.run(sql, [name || null, description || null, ingredients || null, allergens || null, typeof price !== 'undefined' ? price : null, image || null, typeof stock !== 'undefined' ? stock : null, typeof is_active !== 'undefined' ? (is_active ? 1 : 0) : null, typeof category_id !== 'undefined' ? category_id : null, id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
};

const deleteProduct = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM product WHERE id = ?';
    db.run(sql, [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
};

// Product <-> Flavor association helpers
const addFlavorToProduct = (product_id, flavor_id) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO product_flavor (product_id, flavor_id) VALUES (?, ?)';
    db.run(sql, [product_id, flavor_id], function (err) {
      if (err) return reject(err);
      resolve(true);
    });
  });
};

const removeFlavorFromProduct = (product_id, flavor_id) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM product_flavor WHERE product_id = ? AND flavor_id = ?';
    db.run(sql, [product_id, flavor_id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
};

const getFlavorsForProduct = (product_id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT f.* FROM flavor f JOIN product_flavor pf ON pf.flavor_id = f.id WHERE pf.product_id = ?`;
    db.all(sql, [product_id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addFlavorToProduct,
  removeFlavorFromProduct,
  getFlavorsForProduct
};