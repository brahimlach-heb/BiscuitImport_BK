const db = require('../config/database');

// Create table product_price_role
db.run(`CREATE TABLE IF NOT EXISTS product_price_role (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  price REAL NOT NULL,
  UNIQUE (product_id, role_id),
  FOREIGN KEY (product_id) REFERENCES product(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
)`);

// Create indexes
db.run('CREATE INDEX IF NOT EXISTS idx_price_role ON product_price_role(role_id)', (err) => {
  // ignore errors
});
db.run('CREATE INDEX IF NOT EXISTS idx_price_product ON product_price_role(product_id)', (err) => {
  // ignore errors
});

const createProductPriceRole = ({ product_id, role_id, price }) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO product_price_role (product_id, role_id, price) VALUES (?, ?, ?)';
    db.run(sql, [product_id, role_id, price], function (err) {
      if (err) return reject(err);
      db.get('SELECT * FROM product_price_role WHERE id = ?', [this.lastID], (err2, row) => {
        if (err2) return reject(err2);
        resolve(row);
      });
    });
  });
};

const getProductPriceByRole = (product_id, role_id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM product_price_role WHERE product_id = ? AND role_id = ?';
    db.get(sql, [product_id, role_id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

const getAllPricesForProduct = (product_id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT ppr.*, r.code, r.label FROM product_price_role ppr LEFT JOIN roles r ON r.id = ppr.role_id WHERE ppr.product_id = ?';
    db.all(sql, [product_id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const updateProductPriceRole = (id, { price }) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE product_price_role SET price = ? WHERE id = ?';
    db.run(sql, [price, id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
};

const deleteProductPriceRole = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM product_price_role WHERE id = ?';
    db.run(sql, [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
};

const deleteAllPricesForProduct = (product_id) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM product_price_role WHERE product_id = ?';
    db.run(sql, [product_id], function (err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });
};

module.exports = {
  createProductPriceRole,
  getProductPriceByRole,
  getAllPricesForProduct,
  updateProductPriceRole,
  deleteProductPriceRole,
  deleteAllPricesForProduct
};
