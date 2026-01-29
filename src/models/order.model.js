const db = require('../config/database');
const productModel = require('./product.model');
const logger = require('../config/logger');

// Create table orders and order_line
db.run(`CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'PENDING',
  subtotal REAL NOT NULL,
  total REAL NOT NULL,
  remise REAL DEFAULT 0,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

db.run(`CREATE TABLE IF NOT EXISTS order_line (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price REAL NOT NULL,
  final_price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES product(id)
)`);

// Create table for order status tracking
db.run(`CREATE TABLE IF NOT EXISTS order_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  changed_by INTEGER,
  notes TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
)`);

// Create table for order payments
db.run(`CREATE TABLE IF NOT EXISTS order_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  bank_id INTEGER,
  payment_method TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_by INTEGER,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (bank_id) REFERENCES banks(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
)`);

// Try to add columns if missing (for migrations)
const tryAddColumn = (sql) => {
  db.run(sql, (err) => {
    // ignore error (column exists)
  });
};

tryAddColumn("ALTER TABLE order_line ADD COLUMN final_price REAL");
tryAddColumn("ALTER TABLE orders ADD COLUMN subtotal REAL");
tryAddColumn("ALTER TABLE orders ADD COLUMN remise REAL DEFAULT 0");
tryAddColumn("ALTER TABLE orders ADD COLUMN customer_name TEXT");
tryAddColumn("ALTER TABLE orders ADD COLUMN customer_email TEXT");
tryAddColumn("ALTER TABLE orders ADD COLUMN customer_phone TEXT");
tryAddColumn("ALTER TABLE orders ADD COLUMN customer_address TEXT");

const createOrder = async ({ user_id, subtotal, total, remise = 0, status = 'PENDING', lines = [], customer_name, customer_email, customer_phone, customer_address }) => {
  return new Promise((resolve, reject) => {
    // Vérifier le stock avant de créer la commande
    const checkStock = (i) => {
      if (i >= lines.length) {
        // Tous les stocks sont OK, continuer avec la création
        createOrderInternal();
        return;
      }
      
      const ln = lines[i];
      db.get('SELECT id, name, stock FROM product WHERE id = ?', [ln.product_id], (errProduct, product) => {
        if (errProduct) {
          return reject(errProduct);
        }
        
        if (!product) {
          const err = new Error(`Product with id ${ln.product_id} not found`);
          err.status = 404;
          return reject(err);
        }
        
        if (product.stock < (ln.quantity || 1)) {
          const err = new Error(`Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${ln.quantity || 1}`);
          err.status = 400;
          logger.warn(`INSUFFICIENT STOCK: product_id=${ln.product_id} name="${product.name}" available=${product.stock} requested=${ln.quantity || 1}`);
          return reject(err);
        }
        
        checkStock(i + 1);
      });
    };
    
    const createOrderInternal = () => {
      db.run('BEGIN TRANSACTION', (bErr) => {
        if (bErr) return reject(bErr);
        const orderStatus = status.toUpperCase();
        const sql = 'INSERT INTO orders (user_id, subtotal, total, remise, status, customer_name, customer_email, customer_phone, customer_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        db.run(sql, [user_id, subtotal || total, total, remise, orderStatus, customer_name || null, customer_email || null, customer_phone || null, customer_address || null], function (err) {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
          const orderId = this.lastID;
          // Insert initial status in history
          const sqlHistory = 'INSERT INTO order_status_history (order_id, status, changed_by, notes) VALUES (?, ?, ?, ?)';
          db.run(sqlHistory, [orderId, orderStatus, user_id, 'created'], (errHistory) => {
            if (errHistory) {
              db.run('ROLLBACK');
              return reject(errHistory);
            }
            // insert lines sequentially
            const insertLine = (i) => {
            if (i >= lines.length) {
            db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err2, row) => {
              if (err2) {
                db.run('ROLLBACK');
                return reject(err2);
              }
              db.run('COMMIT', () => resolve(row));
            });
            return;
          }
          const ln = lines[i];
          const sqlLine = 'INSERT INTO order_line (order_id, product_id, quantity, unit_price, final_price) VALUES (?, ?, ?, ?, ?)';
          db.run(sqlLine, [orderId, ln.product_id, ln.quantity || 1, ln.unit_price, ln.final_price], function (err3) {
            if (err3) {
              db.run('ROLLBACK');
              return reject(err3);
            }
            // Déduire la quantité du stock
            const sqlUpdateStock = 'UPDATE product SET stock = stock - ? WHERE id = ?';
            db.run(sqlUpdateStock, [ln.quantity || 1, ln.product_id], (err4) => {
              if (err4) {
                db.run('ROLLBACK');
                return reject(err4);
              }
              logger.info(`STOCK DECREASED: product_id=${ln.product_id} quantity=-${ln.quantity || 1} order_id=${orderId}`);
              insertLine(i + 1);
            });
          });
        };
        insertLine(0);
        });
      });
    });
    };
    
    // Commencer par vérifier le stock
    checkStock(0);
  });
};

const getOrderById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM orders WHERE id = ?', [id], (err, order) => {
      if (err) return reject(err);
      if (!order) return resolve(null);
      db.all('SELECT ol.*, p.name FROM order_line ol LEFT JOIN product p ON p.id = ol.product_id WHERE ol.order_id = ?', [id], (err2, lines) => {
        if (err2) return reject(err2);
        order.lines = lines || [];
        // Get status history
        db.all('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY changed_at ASC', [id], (err3, history) => {
          if (err3) return reject(err3);
          order.status_history = history || [];
          // Get payments
          db.all(`SELECT op.*, b.code as bank_code, b.label as bank_label 
                  FROM order_payments op 
                  LEFT JOIN banks b ON b.id = op.bank_id 
                  WHERE op.order_id = ? 
                  ORDER BY op.payment_date ASC`, [id], (err4, payments) => {
            if (err4) return reject(err4);
            order.payments = payments || [];
            resolve(order);
          });
        });
      });
    });
  });
};

const getOrdersByUser = (user_id) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT o.*, 
            COUNT(ol.id) as total_products,
            COALESCE(SUM(op.amount), 0) as amount_paid
            FROM orders o
            LEFT JOIN order_line ol ON ol.order_id = o.id
            LEFT JOIN order_payments op ON op.order_id = o.id
            WHERE o.user_id = ?
            GROUP BY o.id
            ORDER BY o.created_at DESC`, [user_id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const getAllOrders = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT o.*, 
            COUNT(ol.id) as total_products,
            COALESCE(SUM(op.amount), 0) as amount_paid
            FROM orders o
            LEFT JOIN order_line ol ON ol.order_id = o.id
            LEFT JOIN order_payments op ON op.order_id = o.id
            GROUP BY o.id
            ORDER BY o.created_at DESC`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const updateOrderStatus = (order_id, status, changed_by, notes = null) => {
  return new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION', (bErr) => {
      if (bErr) return reject(bErr);
      const orderStatus = status.toUpperCase();
      
      // Si le statut est CANCELLED, récupérer les lignes pour remettre le stock
      if (orderStatus === 'CANCELLED') {
        db.all('SELECT product_id, quantity FROM order_line WHERE order_id = ?', [order_id], (errLines, lines) => {
          if (errLines) {
            db.run('ROLLBACK');
            return reject(errLines);
          }
          
          // Remettre les quantités dans le stock
          const restoreStock = (i) => {
            if (i >= lines.length) {
              // Continuer avec la mise à jour du statut
              updateStatus();
              return;
            }
            const line = lines[i];
            db.run('UPDATE product SET stock = stock + ? WHERE id = ?', [line.quantity, line.product_id], (errStock) => {
              if (errStock) {
                db.run('ROLLBACK');
                return reject(errStock);
              }
              logger.info(`STOCK RESTORED: product_id=${line.product_id} quantity=+${line.quantity} order_id=${order_id} reason=CANCELLED`);
              restoreStock(i + 1);
            });
          };
          
          restoreStock(0);
        });
      } else {
        // Pas d'annulation, continuer normalement
        updateStatus();
      }
      
      function updateStatus() {
        // Update order status
        db.run('UPDATE orders SET status = ? WHERE id = ?', [orderStatus, order_id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
          // Insert in history
          db.run('INSERT INTO order_status_history (order_id, status, changed_by, notes) VALUES (?, ?, ?, ?)', 
            [order_id, orderStatus, changed_by, notes], (err2) => {
            if (err2) {
              db.run('ROLLBACK');
              return reject(err2);
            }
            db.run('COMMIT', () => resolve(true));
          });
        });
      }
    });
  });
};

const addPayment = (order_id, { bank_id, payment_method, amount, notes, created_by }) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO order_payments (order_id, bank_id, payment_method, amount, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)';
    db.run(sql, [order_id, bank_id || null, payment_method.toUpperCase(), amount, notes || null, created_by || null], function (err) {
      if (err) return reject(err);
      db.get('SELECT * FROM order_payments WHERE id = ?', [this.lastID], (err2, row) => {
        if (err2) return reject(err2);
        resolve(row);
      });
    });
  });
};

const getPaymentsByOrder = (order_id) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT op.*, b.code as bank_code, b.label as bank_label 
            FROM order_payments op 
            LEFT JOIN banks b ON b.id = op.bank_id 
            WHERE op.order_id = ? 
            ORDER BY op.payment_date ASC`, [order_id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const getPaymentById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM order_payments WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

const deletePayment = (id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM order_payments WHERE id = ?', [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
};

const updateRemise = (order_id, remise) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE orders SET remise = ? WHERE id = ?', [remise, order_id], function (err) {
      if (err) return reject(err);
      if (this.changes === 0) return resolve(false);
      db.get('SELECT * FROM orders WHERE id = ?', [order_id], (err2, row) => {
        if (err2) return reject(err2);
        resolve(row);
      });
    });
  });
};

const deleteOrder = (order_id) => {
  return new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION', (bErr) => {
      if (bErr) return reject(bErr);
      
      // Vérifier que la commande est en attente
      db.get('SELECT status FROM orders WHERE id = ?', [order_id], (errGet, order) => {
        if (errGet) {
          db.run('ROLLBACK');
          return reject(errGet);
        }
        
        if (!order) {
          db.run('ROLLBACK');
          const err = new Error('Order not found');
          err.status = 404;
          return reject(err);
        }
        
        if (order.status !== 'PENDING') {
          db.run('ROLLBACK');
          const err = new Error('Only pending orders can be deleted');
          err.status = 403;
          return reject(err);
        }
        
        // Récupérer les lignes pour restaurer le stock
        db.all('SELECT product_id, quantity FROM order_line WHERE order_id = ?', [order_id], (errLines, lines) => {
          if (errLines) {
            db.run('ROLLBACK');
            return reject(errLines);
          }
          
          // Restaurer le stock
          const restoreStock = (i) => {
            if (i >= lines.length) {
              // Supprimer les lignes de commande
              db.run('DELETE FROM order_line WHERE order_id = ?', [order_id], (errDelLines) => {
                if (errDelLines) {
                  db.run('ROLLBACK');
                  return reject(errDelLines);
                }
                
                // Supprimer l'historique de statut
                db.run('DELETE FROM order_status_history WHERE order_id = ?', [order_id], (errDelHistory) => {
                  if (errDelHistory) {
                    db.run('ROLLBACK');
                    return reject(errDelHistory);
                  }
                  
                  // Supprimer les paiements
                  db.run('DELETE FROM order_payments WHERE order_id = ?', [order_id], (errDelPayments) => {
                    if (errDelPayments) {
                      db.run('ROLLBACK');
                      return reject(errDelPayments);
                    }
                    
                    // Supprimer la commande
                    db.run('DELETE FROM orders WHERE id = ?', [order_id], (errDelOrder) => {
                      if (errDelOrder) {
                        db.run('ROLLBACK');
                        return reject(errDelOrder);
                      }
                      
                      db.run('COMMIT', () => resolve(true));
                    });
                  });
                });
              });
              return;
            }
            
            const line = lines[i];
            db.run('UPDATE product SET stock = stock + ? WHERE id = ?', [line.quantity, line.product_id], (errStock) => {
              if (errStock) {
                db.run('ROLLBACK');
                return reject(errStock);
              }
              logger.info(`STOCK RESTORED: product_id=${line.product_id} quantity=+${line.quantity} order_id=${order_id} reason=DELETED`);
              restoreStock(i + 1);
            });
          };
          
          restoreStock(0);
        });
      });
    });
  });
};

module.exports = {
  createOrder,
  getOrderById,
  getOrdersByUser,
  getAllOrders,
  updateOrderStatus,
  addPayment,
  getPaymentsByOrder,
  getPaymentById,
  deletePayment,
  updateRemise,
  deleteOrder
};