const orderService = require('../services/order.service');
const logger = require('../config/logger');
const path = require('path');
const fs = require('fs');
const { PDFDocument, rgb, StandardFonts, PDFName } = require('pdf-lib');

const create = async (req, res, next) => {
  try {
    const data = req.body;
    const order = await orderService.createOrder(data);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION createOrder id=${order.id} user_id=${data.user_id} subtotal=${data.subtotal || data.total} total=${data.total} lines=${Array.isArray(data.lines) ? data.lines.length : 0} customer=${data.customer_name || 'N/A'} by=${userInfo}`);
    res.status(201).json(order);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR createOrder: ${err.message}`, { body: req.body, user: userInfo });
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const o = await orderService.getOrderById(id);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    if (!o) {
      logger.info(`ACTION getOrderById_not_found id=${id} by=${userInfo}`);
      return res.status(404).json({ error: 'Order not found' });
    }
    logger.info(`ACTION getOrderById id=${id} user_id=${o.user_id} status=${o.status} by=${userInfo}`);
    res.status(200).json(o);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR getOrderById id=${req.params.id}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

const getByUser = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      logger.warn(`ACTION getOrdersByUser_unauthorized`);
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Vérifier si l'utilisateur est MANAGER ou ADMIN
    const allowedRoles = ['MANAGER', 'ADMIN'];
    const isManagerOrAdmin = req.user.role_code && allowedRoles.includes(req.user.role_code.toUpperCase());

    if (isManagerOrAdmin) {
      // MANAGER et ADMIN voient toutes les commandes
      const rows = await orderService.getAllOrders();
      logger.info(`ACTION getAllOrders count=${Array.isArray(rows) ? rows.length : 0} by=${req.user.id}`);
      res.status(200).json(rows);
    } else {
      // Les autres utilisateurs voient uniquement leurs propres commandes
      const rows = await orderService.getOrdersByUser(req.user.id);
      logger.info(`ACTION getOrdersByUser user_id=${req.user.id} count=${Array.isArray(rows) ? rows.length : 0}`);
      res.status(200).json(rows);
    }
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR getOrdersByUser: ${err.message}`, { user: userInfo });
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status, notes } = req.body;

    if (!status) {
      logger.warn(`ACTION updateOrderStatus_missing_status id=${id}`);
      return res.status(400).json({ error: 'Status is required' });
    }

    const changed_by = req.user ? req.user.id : null;
    const order = await orderService.updateOrderStatus(id, status, changed_by, notes);

    if (!order) {
      logger.info(`ACTION updateOrderStatus_not_found id=${id}`);
      return res.status(404).json({ error: 'Order not found' });
    }

    logger.info(`ACTION updateOrderStatus id=${id} status=${status} by=${changed_by}`);
    res.status(200).json(order);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR updateOrderStatus id=${req.params.id}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

const addPayment = async (req, res, next) => {
  try {
    const order_id = Number(req.params.id);
    const paymentData = req.body;
    const created_by = req.user ? req.user.id : null;

    const payment = await orderService.addPayment(order_id, paymentData, created_by);
    logger.info(`ACTION addPayment order_id=${order_id} payment_id=${payment.id} by=${created_by}`);
    res.status(201).json(payment);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR addPayment order_id=${req.params.id}: ${err.message}`, { body: req.body, user: userInfo });
    next(err);
  }
};

const getPayments = async (req, res, next) => {
  try {
    const order_id = Number(req.params.id);
    const payments = await orderService.getPaymentsByOrder(order_id);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION getPayments order_id=${order_id} count=${payments.length} by=${userInfo}`);
    res.status(200).json(payments);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR getPayments order_id=${req.params.id}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

const deletePayment = async (req, res, next) => {
  try {
    const payment_id = Number(req.params.paymentId);
    const changed_by = req.user ? req.user.id : null;
    await orderService.deletePayment(payment_id, changed_by);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION deletePayment payment_id=${payment_id} by=${userInfo}`);
    res.status(200).json({ success: true, message: 'Payment deleted' });
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR deletePayment payment_id=${req.params.paymentId}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

const updateRemise = async (req, res, next) => {
  try {
    const order_id = Number(req.params.id);
    const { remise } = req.body;
    const order = await orderService.updateRemise(order_id, remise);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION updateRemise order_id=${order_id} remise=${remise} by=${userInfo}`);
    res.status(200).json(order);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR updateRemise order_id=${req.params.id}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    const order_id = Number(req.params.id);
    await orderService.deleteOrder(order_id);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION deleteOrder order_id=${order_id} by=${userInfo}`);
    res.status(200).json({ success: true, message: 'Order deleted' });
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR deleteOrder order_id=${req.params.id}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

const downloadDevis = async (req, res, next) => {
  try {
    const order_id = Number(req.params.id);
    const order = await orderService.getOrderById(order_id);

    if (!order) {
      logger.info(`ACTION downloadDevis_order_not_found id=${order_id}`);
      return res.status(404).json({ error: 'Order not found' });
    }

    const devisPath = path.join(__dirname, '..', '..', 'Devis', 'AMSDevis.pdf');

    // Vérifier si le fichier existe
    if (!fs.existsSync(devisPath)) {
      logger.warn(`ACTION downloadDevis_file_not_found path=${devisPath}`);
      return res.status(404).json({ error: 'Devis file not found' });
    }

    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION downloadDevis order_id=${order_id} by=${userInfo}`);

    // Lire le PDF existant
    const existingPdfBytes = fs.readFileSync(devisPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Obtenir la première page
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Formater la date de commande
    const orderDate = order.created_at ? new Date(order.created_at) : new Date();
    const currentDate = orderDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Ajouter la date en haut à droite du PDF
    firstPage.drawText(`${currentDate}`, {
      x: 430,
      y: height - 144,
      size: 12,
      color: rgb(0, 0, 0)
    });

    // Ajouter le numéro de commande
    firstPage.drawText(`${order_id}`, {
      x: 480,
      y: height - 124,
      size: 12,
      color: rgb(0, 0, 0)
    });

    // Dessiner le tableau des lignes de commande
    let currentY = height - 350;
    if (order.lines && Array.isArray(order.lines) && order.lines.length > 0) {
      const tableStartY = height - 350;
      const tableStartX = 50;
      const colWidths = [80, 200, 60, 60, 80];
      const rowHeight = 20;
      
      // Charger la police en gras pour les en-têtes
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // En-têtes du tableau
      const headers = ['N° Cmd', 'Produit', 'Qté', 'Prix U.', 'Total'];
      let currentX = tableStartX;
      currentY = tableStartY;
      
      // Dessiner les en-têtes en gras
      headers.forEach((header, i) => {
        firstPage.drawText(header, {
          x: currentX,
          y: currentY,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0)
        });
        currentX += colWidths[i];
      });
      
      // Ligne de séparation sous les en-têtes
      firstPage.drawLine({
        start: { x: tableStartX, y: currentY - 5 },
        end: { x: tableStartX + colWidths.reduce((a, b) => a + b, 0), y: currentY - 5 },
        thickness: 1,
        color: rgb(0, 0, 0)
      });
      
      currentY -= rowHeight;
      
      // Dessiner les lignes de commande
      order.lines.forEach((line, index) => {
        currentX = tableStartX;
        const lineTotal = (line.quantity || 0) * (line.unit_price || 0);
        
        const rowData = [
          `${order_id}`,
          (line.name || line.product_name || 'N/A').substring(0, 25),
          `${line.quantity || 0}`,
          `${(line.unit_price || 0).toFixed(2)} DH`,
          `${lineTotal.toFixed(2)} DH`
        ];
        
        rowData.forEach((data, i) => {
          firstPage.drawText(data, {
            x: currentX,
            y: currentY,
            size: 9,
            color: rgb(0, 0, 0)
          });
          currentX += colWidths[i];
        });
        
        currentY -= rowHeight;
      });
      
      // Ligne de séparation avant les totaux
      currentY -= 5;
      firstPage.drawLine({
        start: { x: tableStartX, y: currentY },
        end: { x: tableStartX + colWidths.reduce((a, b) => a + b, 0), y: currentY },
        thickness: 1,
        color: rgb(0, 0, 0)
      });
      
      // Sous-total
      currentY -= rowHeight;
      const subtotal = order.subtotal || 0;
      firstPage.drawText('Sous-total:', {
        x: tableStartX + colWidths[0] + colWidths[1] + colWidths[2],
        y: currentY,
        size: 10,
        color: rgb(0, 0, 0)
      });
      
      firstPage.drawText(`${subtotal.toFixed(2)} DH`, {
        x: tableStartX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
        y: currentY,
        size: 10,
        color: rgb(0, 0, 0)
      });
      
      // Remise si > 0 (en pourcentage)
      let remiseAmount = 0;
      if (order.remise && order.remise > 0) {
        remiseAmount = (subtotal * order.remise) / 100;
        currentY -= rowHeight;
        firstPage.drawText(`Remise (${order.remise}%):`, {
          x: tableStartX + colWidths[0] + colWidths[1] + colWidths[2],
          y: currentY,
          size: 10,
          color: rgb(0, 0, 0)
        });
        
        firstPage.drawText(`    -${remiseAmount.toFixed(2)} DH`, {
          x: tableStartX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
          y: currentY,
          size: 10,
          color: rgb(0, 0, 0)
        });
      }
      
      // Montant après remise
      const amountAfterRemise = subtotal - remiseAmount;
      
      // TVA (20%)
      currentY -= rowHeight;
      const tvaRate = 0.20;
      const tvaAmount = amountAfterRemise * tvaRate;
      
      firstPage.drawText('TVA (20%):', {
        x: tableStartX + colWidths[0] + colWidths[1] + colWidths[2],
        y: currentY,
        size: 10,
        color: rgb(0, 0, 0)
      });
      
      firstPage.drawText(`${tvaAmount.toFixed(2)} DH`, {
        x: tableStartX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
        y: currentY,
        size: 10,
        color: rgb(0, 0, 0)
      });
      
      // Total final = sous-total - remise + TVA
      currentY -= rowHeight;
      const totalFinal = amountAfterRemise + tvaAmount;
      
      firstPage.drawText('TOTAL:', {
        x: tableStartX + colWidths[0] + colWidths[1] + colWidths[2],
        y: currentY,
        size: 11,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      
      firstPage.drawText(`${totalFinal.toFixed(2)} DH`, {
        x: tableStartX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
        y: currentY,
        size: 11,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
    }

    // Ajouter les termes et conditions
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Si tout tient sur une page (currentY > 150), mettre les termes en bas à droite
    let termsX, termsY, paymentX, paymentY;
    if (currentY > 150) {
      // Placer en bas à droite pour les termes
      termsX = width - 300;
      termsY = 150;
      // Placer en bas à gauche pour le règlement
      paymentX = 50;
      paymentY = 150;
    } else {
      // Placer sous le tableau
      termsX = 50;
      termsY = currentY - 40;
      paymentX = 50;
      paymentY = currentY - 40;
    }
    
    // Section RÈGLEMENT à gauche
    firstPage.drawText('RÈGLEMENT :', {
      x: paymentX,
      y: paymentY,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    
    const paymentInfo = [
      "Banque :",
      "IBAN :",
      "RIB :"
    ];
    
    let paymentCurrentY = paymentY - 15;
    paymentInfo.forEach(line => {
      firstPage.drawText(line, {
        x: paymentX,
        y: paymentCurrentY,
        size: 8,
        color: rgb(0, 0, 0)
      });
      paymentCurrentY -= 10;
    });
    
    // Section TERMES & CONDITIONS
    firstPage.drawText('TERMES & CONDITIONS', {
      x: termsX,
      y: termsY,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    
    const termsText = [
      "En cas de retard de paiement, et conformément au code",
      "de commerce, une indemnité calculée à trois fois le taux",
      "d'intérêt légal ainsi qu'un frais de recouvrement de 40",
      "DH sont exigibles.",
      "",
      "Conditions générales de vente consultables sur le site :",
      "www.amsfood.com"
    ];
    
    let termsCurrentY = termsY - 15;
    termsText.forEach(line => {
      firstPage.drawText(line, {
        x: termsX,
        y: termsCurrentY,
        size: 8,
        color: rgb(0, 0, 0)
      });
      termsCurrentY -= 10;
    });

    // Supprimer la 2ème page si elle n'a pas de texte
    const allPages = pdfDoc.getPages();
    if (allPages.length > 1) {
      const secondPage = allPages[1];
      let shouldRemove = false;
      try {
        const contentsRef = secondPage.node?.get(PDFName.of('Contents'));
        if (!contentsRef) {
          shouldRemove = true;
        } else {
          const contents = pdfDoc.context.lookup(contentsRef);
          const getStreamBytes = (stream) => {
            if (!stream) return null;
            if (typeof stream.getContents === 'function') {
              return stream.getContents() || null;
            }
            if (stream.contents && typeof stream.contents.length === 'number') {
              return stream.contents;
            }
            return null;
          };

          let combined = '';
          if (contents && typeof contents.size === 'function' && typeof contents.get === 'function') {
            for (let i = 0; i < contents.size(); i += 1) {
              const item = pdfDoc.context.lookup(contents.get(i));
              const bytes = getStreamBytes(item);
              if (bytes && bytes.length) {
                combined += Buffer.from(bytes).toString('latin1');
              }
            }
          } else {
            const bytes = getStreamBytes(contents);
            if (bytes && bytes.length) {
              combined += Buffer.from(bytes).toString('latin1');
            }
          }

          const hasText = /\b(Tj|TJ)\b/.test(combined);
          shouldRemove = !hasText;
        }
      } catch (e) {
        // Si on ne peut pas déterminer le contenu, on ne supprime pas
      }
      if (shouldRemove) {
        pdfDoc.removePage(1);
      }
    }

    // Générer le PDF modifié
    const pdfBytes = await pdfDoc.save();

    // Envoyer le PDF modifié
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Devis_Commande_${order_id}.pdf"`);
    res.send(Buffer.from(pdfBytes));

  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR downloadDevis order_id=${req.params.id}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

module.exports = { create, getById, getByUser, updateStatus, addPayment, getPayments, deletePayment, updateRemise, deleteOrder, downloadDevis };