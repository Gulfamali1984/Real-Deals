import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { erpStore } from './server/erpStore';
import { googleSheetsService } from './server/googleSheets';
import { SHEETS_SCHEMA } from './server/sheetsSchema';
import {
  Product,
  IncomingShipment,
  OutgoingShipment,
  StockMovement,
  WarehouseTransfer,
  PurchaseRequest,
  PurchaseOrder,
  Supplier,
  Customer,
  ShipmentTrackingRecord,
  StockAdjustment,
  ProductCondition,
  ImportLog,
} from './src/types/erp';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to extract OAuth Bearer token from authorization header
function extractBearerToken(req: express.Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      googleSheetsService.setOAuthToken(token);
      return token;
    }
  }
  return undefined;
}

// Auto-sync middleware: triggers debounced synchronization whenever data-mutating requests complete
app.use((req, res, next) => {
  const token = extractBearerToken(req);

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    const originalJson = res.json;
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const isSheetsRoute = req.path.startsWith('/api/sheets');
        const isAuthSwitch = req.path === '/api/auth/switch-user';
        if (!isSheetsRoute && !isAuthSwitch) {
          googleSheetsService.triggerAutoSync(erpStore, token);
        }
      }
      return originalJson.call(this, body);
    };
  }
  next();
});

// Active user session simulation (default: Super Admin)
let currentUser = erpStore.users[0]; // Imtiaz Khan

// ==========================================
// 1. AUTH & USER ROLES API
// ==========================================
app.get('/api/auth/current', (req, res) => {
  res.json({
    user: currentUser,
    availableUsers: erpStore.users,
  });
});

app.post('/api/auth/switch-user', (req, res) => {
  const { userId } = req.body;
  const user = erpStore.users.find((u) => u.userId === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  currentUser = user;
  erpStore.logAudit(
    currentUser.userId,
    currentUser.name,
    'SWITCH_USER',
    'User',
    currentUser.userId,
    `Switched active session to ${user.name} (${user.role})`
  );
  res.json({ user: currentUser });
});

app.get('/api/users', (req, res) => {
  res.json(erpStore.users);
});

app.post('/api/users', (req, res) => {
  const newUser = {
    userId: `USR-00${erpStore.users.length + 1}`,
    ...req.body,
    active: true,
  };
  erpStore.users.push(newUser);
  erpStore.logAudit(currentUser.userId, currentUser.name, 'CREATE_USER', 'User', newUser.userId, JSON.stringify(newUser));
  res.json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const index = erpStore.users.findIndex((u) => u.userId === id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });
  erpStore.users[index] = { ...erpStore.users[index], ...req.body };
  erpStore.logAudit(currentUser.userId, currentUser.name, 'UPDATE_USER', 'User', id, JSON.stringify(req.body));
  res.json(erpStore.users[index]);
});

// ==========================================
// 2. GOOGLE SHEETS INTEGRATION & AUTO-SYNC API
// ==========================================
app.get('/api/sheets/config', (req, res) => {
  extractBearerToken(req);
  const config = googleSheetsService.getConfigurationInfo();
  res.json(config);
});

app.post('/api/sheets/create-master', async (req, res) => {
  const token = extractBearerToken(req);
  const { title } = req.body;
  try {
    const createResult = await googleSheetsService.createMasterSpreadsheet(token, title);
    // Immediately sync all 20 worksheets with all initial ERP data
    const syncResult = await googleSheetsService.syncAllSheets(createResult.spreadsheetId, erpStore, token);

    erpStore.logAudit(
      currentUser.userId,
      currentUser.name,
      'CREATE_MASTER_SPREADSHEET',
      'GoogleSheets',
      createResult.spreadsheetId,
      `Auto-created master Google Sheet with all 20 worksheets: ${createResult.title}`
    );

    res.json({
      success: true,
      createResult,
      syncResult,
      spreadsheetId: createResult.spreadsheetId,
      url: createResult.url,
      message: `Created master Google Sheet and synchronized all 20 worksheets (${syncResult.totalRows} records).`,
    });
  } catch (err: any) {
    console.error('Error creating master spreadsheet:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sheets/test-connection', async (req, res) => {
  const token = extractBearerToken(req);
  const { spreadsheetId } = req.body;
  try {
    const result = await googleSheetsService.testConnection(spreadsheetId, token);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sheets/bootstrap-sheets', async (req, res) => {
  const token = extractBearerToken(req);
  const { spreadsheetId } = req.body;
  try {
    const result = await googleSheetsService.createMissingSheets(spreadsheetId, token);
    erpStore.logAudit(
      currentUser.userId,
      currentUser.name,
      'BOOTSTRAP_SHEETS',
      'GoogleSheets',
      spreadsheetId || 'default',
      result.message
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sheets/sync', async (req, res) => {
  const token = extractBearerToken(req);
  const { spreadsheetId } = req.body;
  try {
    const result = await googleSheetsService.syncAllSheets(spreadsheetId, erpStore, token);
    erpStore.logAudit(
      currentUser.userId,
      currentUser.name,
      'SYNC_GOOGLE_SHEETS',
      'GoogleSheets',
      result.spreadsheetId,
      result.message
    );
    res.json(result);
  } catch (err: any) {
    console.error('Sync sheets error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sheets/set-auto-sync', (req, res) => {
  const { enabled } = req.body;
  googleSheetsService.setAutoSyncEnabled(Boolean(enabled));
  res.json({ success: true, autoSyncEnabled: googleSheetsService.isAutoSyncEnabled() });
});

app.post('/api/sheets/save-config', (req, res) => {
  const { spreadsheetId } = req.body;
  if (spreadsheetId !== undefined) {
    googleSheetsService.setSpreadsheetId(spreadsheetId);
  }
  res.json(googleSheetsService.getConfigurationInfo());
});

// ==========================================
// 3. DASHBOARD KPIS & CHARTS
// ==========================================
app.get('/api/dashboard/kpis', (req, res) => {
  erpStore.recalculateAllInventory();

  const totalUniqueProducts = erpStore.products.length;
  const totalPhysicalUnits = erpStore.consolidatedInventory.reduce(
    (acc, item) => acc + item.totalCompanyStock,
    0
  );
  const totalAvailableStock = erpStore.consolidatedInventory.reduce(
    (acc, item) => acc + item.availableStock,
    0
  );
  const totalReservedStock = erpStore.consolidatedInventory.reduce(
    (acc, item) => acc + item.reservedStock,
    0
  );
  const stockInTransit = erpStore.consolidatedInventory.reduce(
    (acc, item) => acc + item.stockInTransit,
    0
  );

  // Condition checks
  const unknownConditionStock = erpStore.products
    .filter((p) => p.condition === 'Unknown')
    .reduce((acc, p) => {
      const con = erpStore.consolidatedInventory.find((c) => c.itemCode === p.itemCode);
      return acc + (con?.totalCompanyStock || 0);
    }, 0);

  const awaitingInspection = erpStore.incomingShipments
    .filter((s) => s.receiptStatus === 'Draft' || s.receiptStatus === 'Inspected')
    .reduce((acc, s) => acc + s.quantityReceived, 0);

  // Valuation: sum(totalCompanyStock * unitCost)
  const totalValuation = erpStore.consolidatedInventory.reduce(
    (acc, item) => acc + item.totalCompanyStock * item.unitCost,
    0
  );

  // Pending shipments
  const incomingPending = erpStore.incomingShipments.filter(
    (s) => s.receiptStatus !== 'Confirmed' && s.receiptStatus !== 'Rejected'
  ).length;
  const outgoingPending = erpStore.outgoingShipments.filter(
    (s) => s.shipmentStatus !== 'Dispatched' && s.shipmentStatus !== 'Delivered'
  ).length;
  const purchaseOrdersPending = erpStore.purchaseOrders.filter(
    (p) => p.orderStatus === 'Ordered' || p.orderStatus === 'Partially Received'
  ).length;

  const lowStockItems = erpStore.warehouseInventory.filter((w) => w.reorderStatus === 'Low Stock').length;
  const outOfStockItems = erpStore.warehouseInventory.filter((w) => w.reorderStatus === 'Out of Stock').length;
  const adjustmentsPending = erpStore.stockAdjustments.filter((a) => a.approvalStatus === 'Pending Approval').length;

  // Warehouse breakdown
  const warehouseStockSummary = erpStore.warehouses.map((wh) => {
    const whItems = erpStore.warehouseInventory.filter((w) => w.warehouse === wh.warehouseCode);
    const units = whItems.reduce((acc, i) => acc + i.currentStock, 0);
    const value = whItems.reduce((acc, i) => {
      const prod = erpStore.products.find((p) => p.itemCode === i.itemCode);
      return acc + i.currentStock * (prod?.defaultUnitCost || 0);
    }, 0);
    return {
      code: wh.warehouseCode,
      name: wh.warehouseName,
      location: wh.location,
      manager: wh.manager,
      units,
      value,
    };
  });

  // Top moving products
  const productMovementsCount: Record<string, number> = {};
  for (const m of erpStore.stockMovements) {
    productMovementsCount[m.itemCode] = (productMovementsCount[m.itemCode] || 0) + Math.abs(m.quantity);
  }
  const topMoving = Object.entries(productMovementsCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([itemCode, movementCount]) => {
      const prod = erpStore.products.find((p) => p.itemCode === itemCode);
      return {
        itemCode,
        itemName: prod?.itemName || itemCode,
        manufacturer: prod?.manufacturer || '',
        movementCount,
      };
    });

  res.json({
    totalUniqueProducts,
    totalPhysicalUnits,
    totalAvailableStock,
    totalReservedStock,
    stockInTransit,
    stockAwaitingInspection: awaitingInspection,
    stockUnknownCondition: unknownConditionStock,
    totalValuation,
    incomingShipmentsPending: incomingPending,
    outgoingShipmentsPending: outgoingPending,
    shipmentsInTransit: erpStore.shipmentTrackings.filter((s) => s.shipmentStatus === 'In Transit').length,
    purchaseOrdersAwaitingReceipt: purchaseOrdersPending,
    lowStockItems,
    outOfStockItems,
    adjustmentsAwaitingApproval: adjustmentsPending,
    recentMovements: erpStore.stockMovements.slice(-8).reverse(),
    warehouseStockSummary,
    topMoving,
  });
});

// ==========================================
// 4. PRODUCTS MASTER API
// ==========================================
app.get('/api/products', (req, res) => {
  res.json(erpStore.products);
});

app.post('/api/products', (req, res) => {
  const {
    itemCode,
    standardizedItemCode,
    itemName,
    description,
    manufacturer,
    category,
    condition,
    unitOfMeasure,
    defaultUnitCost,
    currency,
    reorderLevel,
    preferredSupplier,
    barcode,
  } = req.body;

  if (!itemCode || !itemName) {
    return res.status(400).json({ error: 'Item Code and Item Name are required' });
  }

  const existing = erpStore.products.find((p) => p.itemCode.toLowerCase() === itemCode.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: `Product with Item Code "${itemCode}" already exists` });
  }

  const newProduct: Product = {
    productId: `PRD-${Date.now().toString().slice(-4)}`,
    itemCode: itemCode.trim(),
    standardizedItemCode: standardizedItemCode ? standardizedItemCode.trim() : itemCode.trim(),
    itemName: itemName.trim(),
    description: description || '',
    manufacturer: manufacturer || 'Generic',
    category: category || 'Industrial Electronics',
    condition: condition || 'New in Box',
    unitOfMeasure: unitOfMeasure || 'EA',
    defaultUnitCost: Number(defaultUnitCost) || 0,
    currency: currency || 'USD',
    reorderLevel: Number(reorderLevel) || 5,
    preferredSupplier: preferredSupplier || '',
    barcode: barcode || '',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  erpStore.products.push(newProduct);
  erpStore.recalculateAllInventory();

  erpStore.logAudit(
    currentUser.userId,
    currentUser.name,
    'CREATE_PRODUCT',
    'Product',
    newProduct.productId,
    `Added product ${newProduct.itemCode} - ${newProduct.itemName}`
  );

  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const index = erpStore.products.findIndex((p) => p.productId === id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });

  erpStore.products[index] = {
    ...erpStore.products[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  erpStore.recalculateAllInventory();
  erpStore.logAudit(
    currentUser.userId,
    currentUser.name,
    'UPDATE_PRODUCT',
    'Product',
    id,
    JSON.stringify(req.body)
  );

  res.json(erpStore.products[index]);
});

// ==========================================
// 5. WAREHOUSES MASTER API
// ==========================================
app.get('/api/warehouses', (req, res) => {
  res.json(erpStore.warehouses);
});

app.put('/api/warehouses/:code', (req, res) => {
  const { code } = req.params;
  const index = erpStore.warehouses.findIndex((w) => w.warehouseCode === code);
  if (index === -1) return res.status(404).json({ error: 'Warehouse not found' });

  erpStore.warehouses[index] = { ...erpStore.warehouses[index], ...req.body };
  erpStore.logAudit(
    currentUser.userId,
    currentUser.name,
    'UPDATE_WAREHOUSE',
    'Warehouse',
    code,
    JSON.stringify(req.body)
  );
  res.json(erpStore.warehouses[index]);
});

// ==========================================
// 6. INVENTORY VIEWS & RECONCILIATION
// ==========================================
app.get('/api/inventory/warehouse', (req, res) => {
  erpStore.recalculateAllInventory();
  res.json(erpStore.warehouseInventory);
});

app.get('/api/inventory/consolidated', (req, res) => {
  erpStore.recalculateAllInventory();
  res.json(erpStore.consolidatedInventory);
});

app.post('/api/inventory/reconcile', (req, res) => {
  erpStore.recalculateAllInventory();
  erpStore.logAudit(
    currentUser.userId,
    currentUser.name,
    'RECONCILE_INVENTORY',
    'Inventory',
    'GLOBAL',
    'Executed full audit ledger reconciliation across 9 warehouses'
  );
  res.json({
    success: true,
    message: 'All warehouse stock balances successfully reconciled against immutable stock movement ledger.',
    warehouseCount: erpStore.warehouses.length,
    activeRecords: erpStore.warehouseInventory.length,
    movementCount: erpStore.stockMovements.length,
  });
});

app.get('/api/inventory/movements', (req, res) => {
  res.json(erpStore.stockMovements);
});

// ==========================================
// 7. INCOMING SHIPMENTS & GOODS RECEIPTS
// ==========================================
app.get('/api/incoming', (req, res) => {
  res.json(erpStore.incomingShipments);
});

app.post('/api/incoming', (req, res) => {
  const {
    trackingNo,
    itemCode,
    serialNumber,
    serialNumbers,
    warehouse,
    supplier,
    quantityReceived,
    unitCost,
    currency,
    purchaseOrderNumber,
    condition,
    notes,
  } = req.body;

  if (!trackingNo || !itemCode || !warehouse || !quantityReceived) {
    return res.status(400).json({ error: 'Tracking No, Item Code, Warehouse, and Quantity are required' });
  }

  const prod = erpStore.products.find((p) => p.itemCode === itemCode);
  const qty = Number(quantityReceived);

  const receipt: IncomingShipment = {
    receiptId: `IN-REC-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString(),
    trackingNo: trackingNo.trim(),
    itemCode,
    serialNumber: serialNumber || (serialNumbers && serialNumbers[0]) || undefined,
    serialNumbers: serialNumbers || (serialNumber ? [serialNumber] : []),
    warehouse,
    supplier: supplier || prod?.preferredSupplier || 'Supplier',
    quantityReceived: qty,
    itemName: prod?.itemName || itemCode,
    unitCost: Number(unitCost) || prod?.defaultUnitCost || 0,
    currency: currency || prod?.currency || 'USD',
    purchaseOrderNumber,
    receiptStatus: 'Draft',
    condition: condition || prod?.condition || 'New in Box',
    receivedBy: currentUser.name,
    acceptedQuantity: qty,
    rejectedQuantity: 0,
    damagedQuantity: 0,
    notes,
    createdAt: new Date().toISOString(),
  };

  erpStore.incomingShipments.unshift(receipt);
  erpStore.logAudit(
    currentUser.userId,
    currentUser.name,
    'REGISTER_INCOMING',
    'IncomingShipment',
    receipt.receiptId,
    `Registered incoming shipment ${receipt.trackingNo} for ${qty}x ${receipt.itemCode}`
  );

  res.status(201).json(receipt);
});

app.post('/api/incoming/:id/confirm', (req, res) => {
  const { id } = req.params;
  const receipt = erpStore.incomingShipments.find((r) => r.receiptId === id);
  if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

  if (receipt.receiptStatus === 'Confirmed') {
    return res.status(400).json({ error: 'This shipment has already been confirmed and received into stock.' });
  }

  receipt.receiptStatus = 'Confirmed';
  const qty = receipt.acceptedQuantity !== undefined ? receipt.acceptedQuantity : receipt.quantityReceived;

  // Append stock movement ledger
  const movement: StockMovement = {
    movementId: `MVT-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString(),
    movementType: 'Receipt',
    itemCode: receipt.itemCode,
    serialNumber: receipt.serialNumber,
    warehouse: receipt.warehouse,
    quantity: qty,
    unitCost: receipt.unitCost,
    currency: receipt.currency,
    referenceDocType: 'Incoming Shipment',
    referenceDocId: receipt.receiptId,
    reason: `Confirmed goods receipt against tracking ${receipt.trackingNo}`,
    recordedBy: currentUser.name,
    createdAt: new Date().toISOString(),
  };
  erpStore.stockMovements.push(movement);

  // Serial numbers update
  if (receipt.serialNumbers && receipt.serialNumbers.length > 0) {
    for (const sn of receipt.serialNumbers) {
      const existingSn = erpStore.serialNumbers.find((s) => s.serialNumber === sn);
      if (existingSn) {
        existingSn.warehouse = receipt.warehouse;
        existingSn.currentStatus = 'Available';
        existingSn.condition = receipt.condition;
        existingSn.receiptReference = receipt.receiptId;
        existingSn.lastMovementDate = new Date().toISOString();
      } else {
        erpStore.serialNumbers.push({
          serialNumber: sn,
          itemCode: receipt.itemCode,
          condition: receipt.condition,
          warehouse: receipt.warehouse,
          currentStatus: 'Available',
          receiptReference: receipt.receiptId,
          lastMovementDate: new Date().toISOString(),
        });
      }
    }
  }

  // Update PO quantity received if linked
  if (receipt.purchaseOrderNumber) {
    const po = erpStore.purchaseOrders.find((p) => p.poNumber === receipt.purchaseOrderNumber);
    if (po) {
      po.quantityReceived += qty;
      if (po.quantityReceived >= po.quantityOrdered) {
        po.orderStatus = 'Fully Received';
      } else {
        po.orderStatus = 'Partially Received';
      }
    }
  }

  erpStore.recalculateAllInventory();

  erpStore.logAudit(
    currentUser.userId,
    currentUser.name,
    'CONFIRM_RECEIPT',
    'IncomingShipment',
    receipt.receiptId,
    `Confirmed receipt of ${qty} units of ${receipt.itemCode} into warehouse ${receipt.warehouse}`,
    undefined,
    movement.movementId
  );

  res.json({ success: true, receipt, movement });
});

// ==========================================
// 8. OUTGOING SHIPMENTS & DISPATCH
// ==========================================
app.get('/api/outgoing', (req, res) => {
  res.json(erpStore.outgoingShipments);
});

app.post('/api/outgoing', (req, res) => {
  const {
    itemCode,
    trackingNo,
    serialNumber,
    serialNumbers,
    warehouse,
    customer,
    quantityIssued,
    po,
    condition,
    salesOrderNumber,
    notes,
  } = req.body;

  if (!itemCode || !warehouse || !customer || !quantityIssued) {
    return res.status(400).json({ error: 'Item Code, Warehouse, Customer, and Quantity are required' });
  }

  const qty = Number(quantityIssued);
  if (qty <= 0) {
    return res.status(400).json({ error: 'Quantity must be greater than zero' });
  }

  // Check available stock in source warehouse
  erpStore.recalculateAllInventory();
  const availableInWarehouse = erpStore.getAvailableStock(warehouse, itemCode);
  if (availableInWarehouse < qty) {
    return res.status(400).json({
      error: `Insufficient stock in warehouse ${warehouse}. Available: ${availableInWarehouse}, Requested: ${qty}`,
    });
  }

  const prod = erpStore.products.find((p) => p.itemCode === itemCode);

  const issue: OutgoingShipment = {
    issueId: `OUT-ISS-${Date.now().toString().slice(-6)}`,
    dateIssued: new Date().toISOString(),
    itemCode,
    trackingNo: trackingNo ? trackingNo.trim() : `TRK-PENDING-${Date.now().toString().slice(-4)}`,
    serialNumber: serialNumber || (serialNumbers && serialNumbers[0]) || undefined,
    serialNumbers: serialNumbers || (serialNumber ? [serialNumber] : []),
    warehouse,
    customer,
    quantityIssued: qty,
    po,
    itemName: prod?.itemName || itemCode,
    condition: condition || prod?.condition || 'New in Box',
    salesOrderNumber,
    shipmentStatus: 'Draft',
    issuedBy: currentUser.name,
    notes,
    createdAt: new Date().toISOString(),
  };

  erpStore.outgoingShipments.unshift(issue);
  erpStore.logAudit(
    currentUser.userId,
    currentUser.name,
    'CREATE_OUTGOING',
    'OutgoingShipment',
    issue.issueId,
    `Created draft outgoing shipment for ${qty}x ${issue.itemCode} to ${issue.customer}`
  );

  res.status(201).json(issue);
});

app.post('/api/outgoing/:id/confirm-dispatch', (req, res) => {
  const { id } = req.params;
  const issue = erpStore.outgoingShipments.find((o) => o.issueId === id);
  if (!issue) return res.status(404).json({ error: 'Outgoing shipment record not found' });

  if (issue.shipmentStatus === 'Dispatched') {
    return res.status(400).json({ error: 'This shipment has already been dispatched' });
  }

  // Re-validate stock before deducting (safety safeguard required by Section 2)
  erpStore.recalculateAllInventory();
  const available = erpStore.getAvailableStock(issue.warehouse, issue.itemCode);
  if (available < issue.quantityIssued) {
    return res.status(400).json({
      error: `Stock validation failed at confirmation point: Warehouse ${issue.warehouse} only has ${available} available, but ${issue.quantityIssued} is required.`,
    });
  }

  issue.shipmentStatus = 'Dispatched';

  // Record stock deduction in immutable movement ledger
  const movement: StockMovement = {
    movementId: `MVT-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString(),
    movementType: 'Dispatch',
    itemCode: issue.itemCode,
    serialNumber: issue.serialNumber,
    warehouse: issue.warehouse,
    quantity: -issue.quantityIssued,
    unitCost: 0,
    currency: 'USD',
    referenceDocType: 'Outgoing Shipment',
    referenceDocId: issue.issueId,
    reason: `Sales order dispatch to ${issue.customer} (PO: ${issue.po || 'N/A'})`,
    recordedBy: currentUser.name,
    createdAt: new Date().toISOString(),
  };
  erpStore.stockMovements.push(movement);

  // Update serial status if applicable
  if (issue.serialNumbers && issue.serialNumbers.length > 0) {
    for (const sn of issue.serialNumbers) {
      const existingSn = erpStore.serialNumbers.find((s) => s.serialNumber === sn);
      if (existingSn) {
        existingSn.currentStatus = 'Dispatched';
        existingSn.issueReference = issue.issueId;
        existingSn.lastMovementDate = new Date().toISOString();
      }
    }
  }

  erpStore.recalculateAllInventory();

  erpStore.logAudit(
    currentUser.userId,
    currentUser.name,
    'CONFIRM_DISPATCH',
    'OutgoingShipment',
    issue.issueId,
    `Dispatched ${issue.quantityIssued}x ${issue.itemCode} from ${issue.warehouse} to ${issue.customer}`,
    undefined,
    movement.movementId
  );

  res.json({ success: true, issue, movement });
});

// ==========================================
// 9. WAREHOUSE TRANSFERS (PAIRED MOVEMENTS)
// ==========================================
app.get('/api/transfers', (req, res) => {
  res.json(erpStore.warehouseTransfers);
});

app.post('/api/transfers', (req, res) => {
  const { sourceWarehouse, destinationWarehouse, itemCode, serialNumber, quantity, notes, carrier, trackingNumber } = req.body;

  if (!sourceWarehouse || !destinationWarehouse || !itemCode || !quantity) {
    return res.status(400).json({ error: 'Source, Destination, Item Code, and Quantity are required' });
  }

  if (sourceWarehouse === destinationWarehouse) {
    return res.status(400).json({ error: 'Source and Destination warehouses must be different' });
  }

  const qty = Number(quantity);
  const available = erpStore.getAvailableStock(sourceWarehouse, itemCode);
  if (available < qty) {
    return res.status(400).json({
      error: `Insufficient stock in source warehouse ${sourceWarehouse}. Available: ${available}, Requested: ${qty}`,
    });
  }

  const prod = erpStore.products.find((p) => p.itemCode === itemCode);

  const transfer: WarehouseTransfer = {
    transferId: `TRF-${Date.now().toString().slice(-6)}`,
    dateInitiated: new Date().toISOString(),
    sourceWarehouse,
    destinationWarehouse,
    itemCode,
    serialNumber,
    quantity: qty,
    condition: prod?.condition || 'New in Box',
    transferStatus: 'Draft',
    shortageQuantity: 0,
    damagedQuantity: 0,
    trackingNumber,
    carrier,
    notes,
    createdAt: new Date().toISOString(),
  };

  erpStore.warehouseTransfers.unshift(transfer);
  erpStore.logAudit(
    currentUser.userId,
    currentUser.name,
    'CREATE_TRANSFER',
    'WarehouseTransfer',
    transfer.transferId,
    `Initiated transfer of ${qty}x ${itemCode} from ${sourceWarehouse} to ${destinationWarehouse}`
  );

  res.status(201).json(transfer);
});

app.post('/api/transfers/:id/dispatch', (req, res) => {
  const { id } = req.params;
  const transfer = erpStore.warehouseTransfers.find((t) => t.transferId === id);
  if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

  if (transfer.transferStatus !== 'Draft') {
    return res.status(400).json({ error: 'Transfer already dispatched or completed' });
  }

  // Deduct from source warehouse, mark status as In Transit
  transfer.transferStatus = 'In Transit';
  transfer.dispatchedBy = currentUser.name;
  transfer.dispatchDate = new Date().toISOString();

  const outMovement: StockMovement = {
    movementId: `MVT-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString(),
    movementType: 'Transfer Out',
    itemCode: transfer.itemCode,
    serialNumber: transfer.serialNumber,
    warehouse: transfer.sourceWarehouse,
    quantity: -transfer.quantity,
    unitCost: 0,
    currency: 'USD',
    referenceDocType: 'Transfer',
    referenceDocId: transfer.transferId,
    reason: `Transfer dispatched to ${transfer.destinationWarehouse}`,
    recordedBy: currentUser.name,
    createdAt: new Date().toISOString(),
  };
  erpStore.stockMovements.push(outMovement);

  if (transfer.serialNumber) {
    const sn = erpStore.serialNumbers.find((s) => s.serialNumber === transfer.serialNumber);
    if (sn) {
      sn.currentStatus = 'In Transit';
      sn.transferReference = transfer.transferId;
      sn.lastMovementDate = new Date().toISOString();
    }
  }

  erpStore.recalculateAllInventory();

  erpStore.logAudit(
    currentUser.userId,
    currentUser.name,
    'DISPATCH_TRANSFER',
    'WarehouseTransfer',
    transfer.transferId,
    `Dispatched transfer of ${transfer.quantity}x ${transfer.itemCode} from ${transfer.sourceWarehouse} (In Transit)`,
    undefined,
    outMovement.movementId
  );

  res.json({ success: true, transfer, outMovement });
});

app.post('/api/transfers/:id/receive', (req, res) => {
  const { id } = req.params;
  const { shortageQuantity, damagedQuantity, discrepancyNotes } = req.body;
  const transfer = erpStore.warehouseTransfers.find((t) => t.transferId === id);
  if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

  if (transfer.transferStatus !== 'In Transit') {
    return res.status(400).json({ error: 'Transfer must be In Transit before it can be received.' });
  }

  const shortage = Number(shortageQuantity) || 0;
  const damaged = Number(damagedQuantity) || 0;
  const netReceived = Math.max(0, transfer.quantity - shortage - damaged);

  transfer.transferStatus = 'Received';
  transfer.receivedBy = currentUser.name;
  transfer.receiptDate = new Date().toISOString();
  transfer.shortageQuantity = shortage;
  transfer.damagedQuantity = damaged;
  transfer.discrepancyNotes = discrepancyNotes;

  // Add net received stock into destination warehouse
  const inMovement: StockMovement = {
    movementId: `MVT-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString(),
    movementType: 'Transfer In',
    itemCode: transfer.itemCode,
    serialNumber: transfer.serialNumber,
    warehouse: transfer.destinationWarehouse,
    quantity: netReceived,
    unitCost: 0,
    currency: 'USD',
    referenceDocType: 'Transfer',
    referenceDocId: transfer.transferId,
    reason: `Transfer received from ${transfer.sourceWarehouse} (Net: ${netReceived}, Shortage: ${shortage}, Damaged: ${damaged})`,
    recordedBy: currentUser.name,
    createdAt: new Date().toISOString(),
  };
  erpStore.stockMovements.push(inMovement);

  if (transfer.serialNumber) {
    const sn = erpStore.serialNumbers.find((s) => s.serialNumber === transfer.serialNumber);
    if (sn) {
      sn.warehouse = transfer.destinationWarehouse;
      sn.currentStatus = damaged > 0 ? 'Damaged' : 'Available';
      sn.transferReference = transfer.transferId;
      sn.lastMovementDate = new Date().toISOString();
    }
  }

  erpStore.recalculateAllInventory();

  erpStore.logAudit(
    currentUser.userId,
    currentUser.name,
    'RECEIVE_TRANSFER',
    'WarehouseTransfer',
    transfer.transferId,
    `Received transfer into ${transfer.destinationWarehouse}. Accepted: ${netReceived}, Shortage: ${shortage}, Damaged: ${damaged}`,
    undefined,
    inMovement.movementId
  );

  res.json({ success: true, transfer, inMovement });
});

// ==========================================
// 10. PROCUREMENT (REQUESTS & POS)
// ==========================================
app.get('/api/procurement/requests', (req, res) => {
  res.json(erpStore.purchaseRequests);
});

app.post('/api/procurement/requests', (req, res) => {
  const { itemCode, description, quantity, preferredSupplier, requiredDate, destinationWarehouse, estimatedCost, justification } = req.body;
  const prod = erpStore.products.find((p) => p.itemCode === itemCode);

  const request: PurchaseRequest = {
    requestId: `PR-2026-${Date.now().toString().slice(-4)}`,
    requestDate: new Date().toISOString(),
    requestedBy: currentUser.name,
    itemCode,
    description: description || prod?.itemName || itemCode,
    quantity: Number(quantity) || 1,
    preferredSupplier: preferredSupplier || prod?.preferredSupplier || '',
    requiredDate: requiredDate || '',
    destinationWarehouse: destinationWarehouse || 'WH-001',
    estimatedCost: Number(estimatedCost) || (prod?.defaultUnitCost || 0) * (Number(quantity) || 1),
    currency: prod?.currency || 'USD',
    justification: justification || 'Replenishment for customer backorders',
    approvalStatus: 'Pending Review',
    createdAt: new Date().toISOString(),
  };

  erpStore.purchaseRequests.unshift(request);
  erpStore.logAudit(
    currentUser.userId,
    currentUser.name,
    'CREATE_PURCHASE_REQUEST',
    'PurchaseRequest',
    request.requestId,
    `Created PR for ${request.quantity}x ${request.itemCode}`
  );
  res.status(201).json(request);
});

app.post('/api/procurement/requests/:id/approve', (req, res) => {
  const { id } = req.params;
  const reqItem = erpStore.purchaseRequests.find((r) => r.requestId === id);
  if (!reqItem) return res.status(404).json({ error: 'Purchase request not found' });

  reqItem.approvalStatus = 'Approved';
  reqItem.approvedBy = currentUser.name;

  // Auto-generate PO option
  const po: PurchaseOrder = {
    poNumber: `PO-2026-${Date.now().toString().slice(-3)}`,
    supplier: reqItem.preferredSupplier || 'Supplier',
    orderDate: new Date().toISOString(),
    expectedDeliveryDate: reqItem.requiredDate,
    destinationWarehouse: reqItem.destinationWarehouse,
    itemCode: reqItem.itemCode,
    description: reqItem.description,
    quantityOrdered: reqItem.quantity,
    quantityReceived: 0,
    unitCost: reqItem.estimatedCost / reqItem.quantity,
    currency: reqItem.currency,
    taxAndShippingCost: 100,
    paymentTerms: 'Net 30',
    orderStatus: 'Ordered',
    notes: `Generated from Approved Requisition ${reqItem.requestId}`,
    createdAt: new Date().toISOString(),
  };
  erpStore.purchaseOrders.unshift(po);

  erpStore.logAudit(
    currentUser.userId,
    currentUser.name,
    'APPROVE_PURCHASE_REQUEST',
    'PurchaseRequest',
    id,
    `Approved PR and generated PO ${po.poNumber}`
  );

  res.json({ success: true, request: reqItem, generatedPO: po });
});

app.get('/api/procurement/orders', (req, res) => {
  res.json(erpStore.purchaseOrders);
});

app.post('/api/procurement/orders', (req, res) => {
  const { supplier, itemCode, description, quantityOrdered, destinationWarehouse, unitCost, currency, notes, paymentTerms, expectedDeliveryDate } = req.body;
  const prod = erpStore.products.find((p) => p.itemCode === itemCode);

  const po: PurchaseOrder = {
    poNumber: `PO-2026-${Date.now().toString().slice(-4)}`,
    supplier,
    orderDate: new Date().toISOString(),
    expectedDeliveryDate: expectedDeliveryDate || '',
    destinationWarehouse: destinationWarehouse || 'WH-001',
    itemCode,
    description: description || prod?.itemName || itemCode,
    quantityOrdered: Number(quantityOrdered) || 1,
    quantityReceived: 0,
    unitCost: Number(unitCost) || prod?.defaultUnitCost || 0,
    currency: currency || prod?.currency || 'USD',
    taxAndShippingCost: 120,
    paymentTerms: paymentTerms || 'Net 30',
    orderStatus: 'Ordered',
    notes,
    createdAt: new Date().toISOString(),
  };

  erpStore.purchaseOrders.unshift(po);
  erpStore.logAudit(
    currentUser.userId,
    currentUser.name,
    'CREATE_PURCHASE_ORDER',
    'PurchaseOrder',
    po.poNumber,
    `Issued PO for ${po.quantityOrdered}x ${po.itemCode} to ${po.supplier}`
  );
  res.status(201).json(po);
});

// ==========================================
// 11. SUPPLIERS MASTER
// ==========================================
app.get('/api/suppliers', (req, res) => {
  res.json(erpStore.suppliers);
});

app.post('/api/suppliers', (req, res) => {
  const newSupplier: Supplier = {
    supplierId: `SUP-00${erpStore.suppliers.length + 1}`,
    ...req.body,
    active: true,
  };
  erpStore.suppliers.push(newSupplier);
  erpStore.logAudit(currentUser.userId, currentUser.name, 'CREATE_SUPPLIER', 'Supplier', newSupplier.supplierId, newSupplier.supplierName);
  res.status(201).json(newSupplier);
});

// ==========================================
// 12. CUSTOMERS MASTER (WITH DUPLICATE WORKFLOW)
// ==========================================
app.get('/api/customers', (req, res) => {
  res.json(erpStore.customers);
});

app.post('/api/customers', (req, res) => {
  const newCustomer: Customer = {
    customerId: `CUST-00${erpStore.customers.length + 1}`,
    ...req.body,
    reviewStatus: req.body.reviewStatus || 'Confirmed',
    active: true,
  };
  erpStore.customers.push(newCustomer);
  erpStore.logAudit(currentUser.userId, currentUser.name, 'CREATE_CUSTOMER', 'Customer', newCustomer.customerId, newCustomer.customerName);
  res.status(201).json(newCustomer);
});

app.post('/api/customers/:id/review', (req, res) => {
  const { id } = req.params;
  const { action, targetId } = req.body; // action: 'confirm_distinct' | 'merge_into'
  const customer = erpStore.customers.find((c) => c.customerId === id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  if (action === 'confirm_distinct') {
    customer.reviewStatus = 'Confirmed';
    customer.potentialDuplicateOf = undefined;
    erpStore.logAudit(currentUser.userId, currentUser.name, 'RESOLVE_CUSTOMER_DUPLICATE', 'Customer', id, 'Confirmed as distinct customer entity');
  } else if (action === 'merge_into' && targetId) {
    customer.reviewStatus = 'Merged';
    customer.active = false;
    erpStore.logAudit(currentUser.userId, currentUser.name, 'MERGE_CUSTOMER', 'Customer', id, `Merged into target account ${targetId}`);
  }

  res.json({ success: true, customer });
});

// ==========================================
// 13. SHIPMENT TRACKING API
// ==========================================
app.get('/api/tracking', (req, res) => {
  res.json(erpStore.shipmentTrackings);
});

app.post('/api/tracking', (req, res) => {
  const { shipmentType, trackingNumber, carrier, referenceNumber, partyName, sourceWarehouse, destinationWarehouse, shipDate, expectedDeliveryDate, shippingCost, notes } = req.body;

  const tracking: ShipmentTrackingRecord = {
    shipmentId: `SHP-TRK-${Date.now().toString().slice(-4)}`,
    shipmentType: shipmentType || 'Inbound',
    trackingNumber: trackingNumber.trim(),
    carrier: carrier || 'Carrier',
    referenceNumber: referenceNumber || '',
    partyName: partyName || '',
    sourceWarehouse: sourceWarehouse || '',
    destinationWarehouse: destinationWarehouse || '',
    shipDate: shipDate || new Date().toISOString().split('T')[0],
    expectedDeliveryDate: expectedDeliveryDate || '',
    shipmentStatus: 'In Transit',
    shippingCost: Number(shippingCost) || 0,
    currency: 'USD',
    trackingUrl: `https://www.google.com/search?q=${encodeURIComponent(carrier + ' tracking ' + trackingNumber)}`,
    notes,
    createdAt: new Date().toISOString(),
  };

  erpStore.shipmentTrackings.unshift(tracking);
  erpStore.logAudit(currentUser.userId, currentUser.name, 'CREATE_TRACKING', 'ShipmentTracking', tracking.shipmentId, `Tracking: ${tracking.trackingNumber}`);
  res.status(201).json(tracking);
});

app.put('/api/tracking/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, actualDeliveryDate, notes } = req.body;
  const item = erpStore.shipmentTrackings.find((s) => s.shipmentId === id);
  if (!item) return res.status(404).json({ error: 'Shipment tracking record not found' });

  item.shipmentStatus = status;
  if (actualDeliveryDate) item.actualDeliveryDate = actualDeliveryDate;
  if (notes) item.notes = notes;

  erpStore.logAudit(currentUser.userId, currentUser.name, 'UPDATE_TRACKING_STATUS', 'ShipmentTracking', id, `Status updated to ${status}`);
  res.json(item);
});

// ==========================================
// 14. STOCK ADJUSTMENTS & APPROVALS
// ==========================================
app.get('/api/adjustments', (req, res) => {
  res.json(erpStore.stockAdjustments);
});

app.post('/api/adjustments', (req, res) => {
  const { warehouse, itemCode, serialNumber, adjustmentType, quantityChange, reason, notes } = req.body;

  if (!warehouse || !itemCode || !adjustmentType || quantityChange === undefined || !reason) {
    return res.status(400).json({ error: 'Warehouse, Item Code, Adjustment Type, Quantity Change, and Reason are required' });
  }

  const change = Number(quantityChange);
  const adj: StockAdjustment = {
    adjustmentId: `ADJ-2026-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString(),
    warehouse,
    itemCode,
    serialNumber,
    adjustmentType,
    quantityChange: change,
    reason: reason.trim(),
    requestedBy: currentUser.name,
    approvalStatus: 'Pending Approval',
    notes,
    createdAt: new Date().toISOString(),
  };

  erpStore.stockAdjustments.unshift(adj);
  erpStore.logAudit(
    currentUser.userId,
    currentUser.name,
    'REQUEST_STOCK_ADJUSTMENT',
    'StockAdjustment',
    adj.adjustmentId,
    `Requested adjustment of ${change > 0 ? '+' : ''}${change} on ${itemCode} in ${warehouse}. Reason: ${reason}`
  );

  res.status(201).json(adj);
});

app.post('/api/adjustments/:id/approve', (req, res) => {
  const { id } = req.params;
  const adj = erpStore.stockAdjustments.find((a) => a.adjustmentId === id);
  if (!adj) return res.status(404).json({ error: 'Adjustment record not found' });

  if (adj.approvalStatus === 'Approved') {
    return res.status(400).json({ error: 'Adjustment is already approved.' });
  }

  adj.approvalStatus = 'Approved';
  adj.approvedBy = currentUser.name;

  const prod = erpStore.products.find((p) => p.itemCode === adj.itemCode);

  // Write immutable stock movement ledger entry
  const movement: StockMovement = {
    movementId: `MVT-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString(),
    movementType: 'Adjustment',
    itemCode: adj.itemCode,
    serialNumber: adj.serialNumber,
    warehouse: adj.warehouse,
    quantity: adj.quantityChange,
    unitCost: prod?.defaultUnitCost || 0,
    currency: prod?.currency || 'USD',
    referenceDocType: 'Adjustment',
    referenceDocId: adj.adjustmentId,
    reason: `${adj.adjustmentType}: ${adj.reason}`,
    recordedBy: currentUser.name,
    createdAt: new Date().toISOString(),
  };
  erpStore.stockMovements.push(movement);

  erpStore.recalculateAllInventory();

  erpStore.logAudit(
    currentUser.userId,
    currentUser.name,
    'APPROVE_STOCK_ADJUSTMENT',
    'StockAdjustment',
    adj.adjustmentId,
    `Approved adjustment of ${adj.quantityChange} units on ${adj.itemCode} in ${adj.warehouse}`,
    undefined,
    movement.movementId
  );

  res.json({ success: true, adjustment: adj, movement });
});

// ==========================================
// 15. SERIAL NUMBERS LIFECYCLE
// ==========================================
app.get('/api/serials', (req, res) => {
  res.json(erpStore.serialNumbers);
});

// ==========================================
// 16. AUDIT TRAIL
// ==========================================
app.get('/api/audit', (req, res) => {
  res.json(erpStore.auditLogs);
});

// ==========================================
// 17. IMPORT CENTER API
// ==========================================
app.get('/api/import/logs', (req, res) => {
  res.json(erpStore.importLogs);
});

app.post('/api/import/commit', (req, res) => {
  const { entityType, rows, filename } = req.body;
  if (!entityType || !Array.isArray(rows)) {
    return res.status(400).json({ error: 'Invalid import payload' });
  }

  let accepted = 0;
  let rejected = 0;
  const errors: string[] = [];

  if (entityType === 'Products') {
    for (const r of rows) {
      if (!r.itemCode || !r.itemName) {
        rejected++;
        errors.push(`Row missing itemCode or itemName`);
        continue;
      }
      const existing = erpStore.products.find((p) => p.itemCode.toLowerCase() === String(r.itemCode).toLowerCase());
      if (existing) {
        rejected++;
        errors.push(`Duplicate itemCode: ${r.itemCode}`);
        continue;
      }
      erpStore.products.push({
        productId: `PRD-IMP-${Date.now().toString().slice(-4)}-${accepted + 1}`,
        itemCode: String(r.itemCode).trim(),
        standardizedItemCode: String(r.standardizedItemCode || r.itemCode).trim(),
        itemName: String(r.itemName).trim(),
        description: String(r.description || ''),
        manufacturer: String(r.manufacturer || 'Generic'),
        category: String(r.category || 'General Automation'),
        condition: (r.condition as ProductCondition) || 'New in Box',
        unitOfMeasure: String(r.unitOfMeasure || 'EA'),
        defaultUnitCost: Number(r.defaultUnitCost) || 0,
        currency: String(r.currency || 'USD'),
        reorderLevel: Number(r.reorderLevel) || 5,
        preferredSupplier: String(r.preferredSupplier || ''),
        barcode: String(r.barcode || ''),
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      accepted++;
    }
  } else if (entityType === 'OpeningStock') {
    for (const r of rows) {
      if (!r.warehouse || !r.itemCode || !r.quantity) {
        rejected++;
        errors.push(`Row missing warehouse, itemCode, or quantity`);
        continue;
      }
      erpStore.stockMovements.push({
        movementId: `MVT-IMP-${Date.now().toString().slice(-4)}-${accepted + 1}`,
        date: new Date().toISOString(),
        movementType: 'Opening Balance',
        itemCode: String(r.itemCode).trim(),
        serialNumber: r.serialNumber ? String(r.serialNumber).trim() : undefined,
        warehouse: String(r.warehouse).trim(),
        quantity: Number(r.quantity),
        unitCost: Number(r.unitCost) || 0,
        currency: 'USD',
        referenceDocType: 'Opening Balance',
        referenceDocId: filename || 'CSV-IMPORT',
        reason: 'Imported opening balance',
        recordedBy: currentUser.name,
        createdAt: new Date().toISOString(),
      });
      accepted++;
    }
  } else if (entityType === 'Customers') {
    for (const r of rows) {
      if (!r.customerName) {
        rejected++;
        errors.push('Row missing customerName');
        continue;
      }
      erpStore.customers.push({
        customerId: `CUST-IMP-${Date.now().toString().slice(-4)}-${accepted + 1}`,
        customerName: String(r.customerName).trim(),
        standardizedName: String(r.standardizedName || r.customerName).trim(),
        contactPerson: String(r.contactPerson || ''),
        email: String(r.email || ''),
        phone: String(r.phone || ''),
        billingAddress: String(r.billingAddress || ''),
        shippingAddress: String(r.shippingAddress || ''),
        country: String(r.country || 'USA'),
        customerType: 'Distributor',
        reviewStatus: 'Needs Review',
        notes: String(r.notes || 'Imported customer profile'),
        active: true,
      });
      accepted++;
    }
  }

  erpStore.recalculateAllInventory();

  const log: ImportLog = {
    importId: `IMP-${Date.now().toString().slice(-5)}`,
    date: new Date().toISOString(),
    sourceFilename: filename || 'direct_upload.csv',
    entityType,
    totalRows: rows.length,
    acceptedRows: accepted,
    rejectedRows: rejected,
    errorSummary: errors.length > 0 ? errors.slice(0, 3).join('; ') : undefined,
    performedBy: currentUser.name,
  };
  erpStore.importLogs.unshift(log);

  erpStore.logAudit(
    currentUser.userId,
    currentUser.name,
    'DATA_IMPORT',
    entityType,
    log.importId,
    `Imported ${accepted} rows of ${entityType} from ${log.sourceFilename}`
  );

  res.json({ success: true, accepted, rejected, errors, log });
});

// ==========================================
// 18. REPORTS API (ALL 20 BUSINESS REPORTS)
// ==========================================
app.get('/api/reports/all', (req, res) => {
  erpStore.recalculateAllInventory();

  const reportsList = [
    { id: 'consolidated_inventory', name: 'Consolidated Inventory Report', records: erpStore.consolidatedInventory.length },
    { id: 'warehouse_stock', name: 'Warehouse Stock Report', records: erpStore.warehouseInventory.length },
    { id: 'stock_valuation', name: 'Stock Valuation Report', records: erpStore.consolidatedInventory.length },
    { id: 'incoming_stock', name: 'Incoming Stock Report', records: erpStore.incomingShipments.length },
    { id: 'outgoing_stock', name: 'Outgoing Stock Report', records: erpStore.outgoingShipments.length },
    { id: 'stock_ledger', name: 'Stock Movement Ledger', records: erpStore.stockMovements.length },
    { id: 'inventory_by_condition', name: 'Inventory by Condition Report', records: erpStore.consolidatedInventory.length },
    { id: 'inventory_by_mfg', name: 'Inventory by Manufacturer Report', records: erpStore.consolidatedInventory.length },
    { id: 'serial_numbers', name: 'Serial Number Traceability Report', records: erpStore.serialNumbers.length },
    { id: 'low_stock', name: 'Low Stock Report', records: erpStore.warehouseInventory.filter((w) => w.reorderStatus === 'Low Stock').length },
    { id: 'zero_stock', name: 'Zero Stock Report', records: erpStore.warehouseInventory.filter((w) => w.reorderStatus === 'Out of Stock').length },
    { id: 'discrepancy', name: 'Negative Stock & Discrepancy Report', records: erpStore.warehouseTransfers.filter((t) => t.shortageQuantity > 0 || t.damagedQuantity > 0).length },
    { id: 'purchase_orders', name: 'Purchase Order Status Report', records: erpStore.purchaseOrders.length },
    { id: 'supplier_performance', name: 'Supplier Performance Report', records: erpStore.suppliers.length },
    { id: 'customer_history', name: 'Customer Shipment History', records: erpStore.outgoingShipments.length },
    { id: 'warehouse_transfers', name: 'Warehouse Transfer Report', records: erpStore.warehouseTransfers.length },
    { id: 'goods_in_transit', name: 'Goods in Transit Report', records: erpStore.warehouseTransfers.filter((t) => t.transferStatus === 'In Transit').length },
    { id: 'shipment_delays', name: 'Shipment Delay Report', records: erpStore.shipmentTrackings.filter((s) => s.shipmentStatus === 'Delayed').length },
    { id: 'adjustments', name: 'Inventory Adjustment Report', records: erpStore.stockAdjustments.length },
    { id: 'audit_trail', name: 'Audit Trail Report', records: erpStore.auditLogs.length },
  ];

  res.json(reportsList);
});

// Mount Vite or static server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ApexPulse ERP server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
