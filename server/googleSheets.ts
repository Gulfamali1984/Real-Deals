import { google } from 'googleapis';
import { SHEETS_SCHEMA } from './sheetsSchema';

export class GoogleSheetsService {
  private clientEmail: string;
  private privateKey: string;
  private spreadsheetId: string;
  private oauthToken: string | null = null;
  private autoSyncEnabled: boolean = true;
  private lastSyncTime: string | null = null;
  private lastSyncStatus: string | null = null;
  private lastSyncSummary: string | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private isCurrentlySyncing: boolean = false;

  constructor() {
    this.clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
    this.privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || '';
  }

  public setOAuthToken(token: string | null) {
    if (token) {
      this.oauthToken = token.trim();
    } else {
      this.oauthToken = null;
    }
  }

  public getOAuthToken(): string | null {
    return this.oauthToken;
  }

  public setSpreadsheetId(id: string) {
    this.spreadsheetId = id ? id.trim() : '';
  }

  public getSpreadsheetId(): string {
    return this.spreadsheetId;
  }

  public setAutoSyncEnabled(enabled: boolean) {
    this.autoSyncEnabled = enabled;
  }

  public isAutoSyncEnabled(): boolean {
    return this.autoSyncEnabled;
  }

  public isConfigured(): boolean {
    const hasSpreadsheet = Boolean(this.spreadsheetId);
    const hasAuth = Boolean(this.oauthToken || (this.clientEmail && this.privateKey));
    return hasSpreadsheet && hasAuth;
  }

  public getConfigurationInfo() {
    return {
      serviceAccountEmail: this.clientEmail ? this.clientEmail : '(Not configured)',
      spreadsheetId: this.spreadsheetId ? this.spreadsheetId : '',
      spreadsheetUrl: this.spreadsheetId
        ? `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`
        : null,
      isConfigured: this.isConfigured(),
      hasOAuthToken: Boolean(this.oauthToken),
      autoSyncEnabled: this.autoSyncEnabled,
      lastSyncTime: this.lastSyncTime,
      lastSyncStatus: this.lastSyncStatus,
      lastSyncSummary: this.lastSyncSummary,
    };
  }

  private getAuthClient(tokenOverride?: string) {
    const token = tokenOverride || this.oauthToken;
    if (token) {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: token });
      return auth;
    }

    if (this.clientEmail && this.privateKey) {
      return new google.auth.JWT({
        email: this.clientEmail,
        key: this.privateKey,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file',
        ],
      });
    }

    throw new Error(
      'Google Sheets is not authenticated. Please click "Sign in with Google" or provide a valid Google access token.'
    );
  }

  /**
   * Automatically creates a brand-new Master Google Spreadsheet with all 20 entity worksheets and headers
   */
  public async createMasterSpreadsheet(tokenOverride?: string, customTitle?: string) {
    const auth = this.getAuthClient(tokenOverride);
    const sheets = google.sheets({ version: 'v4', auth });

    const title = customTitle || `ApexPulse ERP - Master Ledger (${new Date().toISOString().split('T')[0]})`;
    const worksheetDefs = Object.values(SHEETS_SCHEMA);

    // 1. Create spreadsheet with all 20 sheets
    const createRes = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title,
        },
        sheets: worksheetDefs.map((def) => ({
          properties: {
            title: def.name,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        })),
      },
    });

    const newSpreadsheetId = createRes.data.spreadsheetId;
    if (!newSpreadsheetId) {
      throw new Error('Failed to create Google Spreadsheet: no spreadsheetId returned.');
    }

    this.spreadsheetId = newSpreadsheetId;

    // 2. Populate header rows for all 20 worksheets
    const headerUpdates = worksheetDefs.map((def) => ({
      range: `'${def.name}'!A1:${String.fromCharCode(64 + Math.min(26, def.headers.length))}1`,
      values: [def.headers],
    }));

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: newSpreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: headerUpdates,
      },
    });

    return {
      success: true,
      spreadsheetId: newSpreadsheetId,
      title,
      url: `https://docs.google.com/spreadsheets/d/${newSpreadsheetId}/edit`,
      sheetsCount: worksheetDefs.length,
      message: `Created master spreadsheet "${title}" with all ${worksheetDefs.length} worksheets configured.`,
    };
  }

  public async testConnection(spreadsheetIdOverride?: string, tokenOverride?: string) {
    const targetSpreadsheetId = (spreadsheetIdOverride || this.spreadsheetId).trim();

    if (!targetSpreadsheetId) {
      return {
        success: false,
        error: 'Google Spreadsheet ID is not provided. Connect an existing sheet or click "Auto-Create Master Spreadsheet".',
        configured: false,
        sheets: [],
      };
    }

    try {
      const auth = this.getAuthClient(tokenOverride);
      const sheets = google.sheets({ version: 'v4', auth });
      const meta = await sheets.spreadsheets.get({
        spreadsheetId: targetSpreadsheetId,
      });

      const existingSheetNames = (meta.data.sheets || [])
        .map((s) => s.properties?.title || '')
        .filter(Boolean);

      const requiredWorksheets = Object.values(SHEETS_SCHEMA).map((def) => ({
        name: def.name,
        exists: existingSheetNames.includes(def.name),
        headers: def.headers,
      }));

      const missingCount = requiredWorksheets.filter((w) => !w.exists).length;

      // Save spreadsheet ID if test succeeds
      this.spreadsheetId = targetSpreadsheetId;

      return {
        success: true,
        title: meta.data.properties?.title || 'Google Spreadsheet',
        spreadsheetId: targetSpreadsheetId,
        url: `https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/edit`,
        existingSheets: existingSheetNames,
        worksheetsStatus: requiredWorksheets,
        missingCount,
        allWorksheetsPresent: missingCount === 0,
      };
    } catch (err: any) {
      let message = err?.message || 'Failed to connect to Google Sheets API';
      if (err?.code === 404 || err?.status === 404) {
        message = `Spreadsheet ID "${targetSpreadsheetId}" not found. Verify the ID in your Google Sheets URL.`;
      } else if (err?.code === 403 || err?.status === 403) {
        message = `Access denied (403). Make sure your signed-in Google account has permission to edit this spreadsheet.`;
      }
      return {
        success: false,
        error: message,
        configured: false,
        sheets: [],
      };
    }
  }

  public async createMissingSheets(spreadsheetIdOverride?: string, tokenOverride?: string) {
    const targetSpreadsheetId = (spreadsheetIdOverride || this.spreadsheetId).trim();
    if (!targetSpreadsheetId) {
      throw new Error('No Spreadsheet ID specified.');
    }

    const auth = this.getAuthClient(tokenOverride);
    const sheets = google.sheets({ version: 'v4', auth });

    const meta = await sheets.spreadsheets.get({
      spreadsheetId: targetSpreadsheetId,
    });

    const existingTitles = new Set(
      (meta.data.sheets || []).map((s) => s.properties?.title || '').filter(Boolean)
    );

    const requiredDefs = Object.values(SHEETS_SCHEMA);
    const toCreate = requiredDefs.filter((def) => !existingTitles.has(def.name));

    if (toCreate.length === 0) {
      return { created: 0, message: 'All 20 worksheets already exist in this Google Spreadsheet.' };
    }

    // 1. Add missing sheets
    const requests = toCreate.map((def) => ({
      addSheet: {
        properties: {
          title: def.name,
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
    }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: targetSpreadsheetId,
      requestBody: { requests },
    });

    // 2. Populate headers
    const dataUpdates = toCreate.map((def) => ({
      range: `'${def.name}'!A1:${String.fromCharCode(64 + Math.min(26, def.headers.length))}1`,
      values: [def.headers],
    }));

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: targetSpreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: dataUpdates,
      },
    });

    return {
      created: toCreate.length,
      createdSheets: toCreate.map((d) => d.name),
      message: `Successfully created and initialized ${toCreate.length} missing worksheet(s) with headers.`,
    };
  }

  /**
   * Synchronizes all 20 worksheets with all ERP entities from the store
   */
  public async syncAllSheets(
    spreadsheetIdOverride: string | undefined,
    erpStore: any,
    tokenOverride?: string
  ) {
    const targetSpreadsheetId = (spreadsheetIdOverride || this.spreadsheetId).trim();
    if (!targetSpreadsheetId) {
      throw new Error('Spreadsheet ID is not set. Please connect a Google Spreadsheet first.');
    }

    const auth = this.getAuthClient(tokenOverride);
    const sheets = google.sheets({ version: 'v4', auth });

    // Make sure all inventory calculations are up-to-date
    erpStore.recalculateAllInventory();

    // Prepare table row datasets for all 20 worksheets
    const tablesData: Record<string, { headers: string[]; rows: (string | number)[][] }> = {
      Products: {
        headers: SHEETS_SCHEMA.Products.headers,
        rows: erpStore.products.map((p: any) => [
          p.productId,
          p.itemCode,
          p.standardizedItemCode || p.itemCode,
          p.itemName,
          p.description || '',
          p.manufacturer,
          p.category,
          p.condition,
          p.unitOfMeasure,
          p.defaultUnitCost,
          p.currency,
          p.reorderLevel,
          p.preferredSupplier || '',
          p.barcode || '',
          p.active ? 'TRUE' : 'FALSE',
          p.createdAt || '',
          p.updatedAt || '',
        ]),
      },
      Warehouses: {
        headers: SHEETS_SCHEMA.Warehouses.headers,
        rows: erpStore.warehouses.map((w: any) => [
          w.warehouseCode,
          w.warehouseName,
          w.location,
          w.manager,
          w.address || '',
          w.active ? 'TRUE' : 'FALSE',
          w.createdAt || '',
        ]),
      },
      'Warehouse Inventory': {
        headers: SHEETS_SCHEMA.WarehouseInventory.headers,
        rows: erpStore.warehouseInventory.map((wi: any) => [
          wi.warehouse,
          wi.itemCode,
          wi.currentStock,
          wi.outDate || '',
          wi.adjustment,
          wi.openingStock,
          wi.totalIncoming,
          wi.totalOutgoing,
          wi.reorderStatus,
          wi.lastUpdated,
        ]),
      },
      'Consolidated Inventory': {
        headers: SHEETS_SCHEMA.ConsolidatedInventory.headers,
        rows: erpStore.consolidatedInventory.map((c: any) => [
          c.itemCode,
          c.standardizedItemCode,
          c.itemDescription,
          c.manufacturer,
          c.condition,
          c.unitCost,
          c.currency,
          c.totalCompanyStock,
          c.availableStock,
          c.reservedStock,
          c.stockInTransit,
          c.tls,
          c.toll,
          c.bflo,
          c.nmk,
          c.pak,
          c.ksa,
          c.snt,
          c.usa,
          c.ajman,
          c.lastUpdated,
        ]),
      },
      'Incoming Shipments': {
        headers: SHEETS_SCHEMA.IncomingShipments.headers,
        rows: erpStore.incomingShipments.map((s: any) => [
          s.receiptId,
          s.date,
          s.trackingNo,
          s.itemCode,
          s.serialNumber || (s.serialNumbers && s.serialNumbers.join(', ')) || '',
          s.warehouse,
          s.supplier,
          s.quantityReceived,
          s.itemName || '',
          s.unitCost,
          s.currency,
          s.purchaseOrderNumber || '',
          s.receiptStatus,
          s.condition,
          s.receivedBy,
          s.acceptedQuantity ?? s.quantityReceived,
          s.rejectedQuantity ?? 0,
          s.damagedQuantity ?? 0,
          s.notes || '',
          s.createdAt,
        ]),
      },
      'Outgoing Shipments': {
        headers: SHEETS_SCHEMA.OutgoingShipments.headers,
        rows: erpStore.outgoingShipments.map((o: any) => [
          o.issueId,
          o.dateIssued,
          o.itemCode,
          o.trackingNo,
          o.serialNumber || (o.serialNumbers && o.serialNumbers.join(', ')) || '',
          o.warehouse,
          o.customer,
          o.quantityIssued,
          o.po || '',
          o.itemName || '',
          o.condition,
          o.salesOrderNumber || '',
          o.shipmentStatus,
          o.issuedBy,
          o.notes || '',
          o.createdAt,
        ]),
      },
      'Stock Movements': {
        headers: SHEETS_SCHEMA.StockMovements.headers,
        rows: erpStore.stockMovements.map((m: any) => [
          m.movementId,
          m.date,
          m.movementType,
          m.itemCode,
          m.serialNumber || '',
          m.warehouse,
          m.quantity,
          m.unitCost,
          m.currency,
          m.referenceDocType,
          m.referenceDocId,
          m.reason,
          m.recordedBy,
          m.createdAt,
        ]),
      },
      Suppliers: {
        headers: SHEETS_SCHEMA.Suppliers.headers,
        rows: erpStore.suppliers.map((s: any) => [
          s.supplierId,
          s.supplierName,
          s.contactPerson || '',
          s.email || '',
          s.phone || '',
          s.address || '',
          s.country || '',
          s.paymentTerms || '',
          s.currency || 'USD',
          s.leadTime || 0,
          s.notes || '',
          s.active ? 'TRUE' : 'FALSE',
        ]),
      },
      Customers: {
        headers: SHEETS_SCHEMA.Customers.headers,
        rows: erpStore.customers.map((c: any) => [
          c.customerId,
          c.customerName,
          c.standardizedName || c.customerName,
          c.contactPerson || '',
          c.email || '',
          c.phone || '',
          c.billingAddress || '',
          c.shippingAddress || '',
          c.country || '',
          c.customerType || 'Distributor',
          c.potentialDuplicateOf || '',
          c.reviewStatus,
          c.notes || '',
          c.active ? 'TRUE' : 'FALSE',
        ]),
      },
      'Purchase Requests': {
        headers: SHEETS_SCHEMA.PurchaseRequests.headers,
        rows: erpStore.purchaseRequests.map((pr: any) => [
          pr.requestId,
          pr.requestDate,
          pr.requestedBy,
          pr.itemCode,
          pr.description || '',
          pr.quantity,
          pr.preferredSupplier || '',
          pr.requiredDate || '',
          pr.destinationWarehouse,
          pr.estimatedCost,
          pr.currency,
          pr.justification || '',
          pr.approvalStatus,
          pr.approvedBy || '',
          pr.rejectionReason || '',
          pr.createdAt,
        ]),
      },
      'Purchase Orders': {
        headers: SHEETS_SCHEMA.PurchaseOrders.headers,
        rows: erpStore.purchaseOrders.map((po: any) => [
          po.poNumber,
          po.supplier,
          po.orderDate,
          po.expectedDeliveryDate || '',
          po.destinationWarehouse,
          po.itemCode,
          po.description || '',
          po.quantityOrdered,
          po.quantityReceived,
          po.unitCost,
          po.currency,
          po.taxAndShippingCost || 0,
          po.paymentTerms || '',
          po.orderStatus,
          po.supplierReference || '',
          po.notes || '',
          po.createdAt,
        ]),
      },
      'Goods Receipts': {
        headers: SHEETS_SCHEMA.GoodsReceipts.headers,
        rows: erpStore.incomingShipments
          .filter((s: any) => s.receiptStatus === 'Confirmed')
          .map((s: any) => [
            s.receiptId,
            s.purchaseOrderNumber || s.trackingNo,
            s.date,
            s.warehouse,
            s.receivedBy,
            s.notes || '',
            s.createdAt,
          ]),
      },
      'Sales Orders': {
        headers: SHEETS_SCHEMA.SalesOrders.headers,
        rows: erpStore.outgoingShipments.map((o: any) => [
          o.salesOrderNumber || `SO-${o.issueId}`,
          o.customer,
          o.dateIssued,
          '',
          '',
          (o.quantityIssued || 0) * 100, // estimated amount
          'USD',
          o.shipmentStatus === 'Dispatched' ? 'Completed' : 'Draft',
          o.createdAt,
        ]),
      },
      'Warehouse Transfers': {
        headers: SHEETS_SCHEMA.WarehouseTransfers.headers,
        rows: erpStore.warehouseTransfers.map((t: any) => [
          t.transferId,
          t.dateInitiated,
          t.sourceWarehouse,
          t.destinationWarehouse,
          t.itemCode,
          t.serialNumber || '',
          t.quantity,
          t.condition,
          t.transferStatus,
          t.dispatchedBy || '',
          t.dispatchDate || '',
          t.receivedBy || '',
          t.receiptDate || '',
          t.shortageQuantity || 0,
          t.damagedQuantity || 0,
          t.discrepancyNotes || '',
          t.trackingNumber || '',
          t.carrier || '',
          t.notes || '',
          t.createdAt,
        ]),
      },
      'Stock Adjustments': {
        headers: SHEETS_SCHEMA.StockAdjustments.headers,
        rows: erpStore.stockAdjustments.map((a: any) => [
          a.adjustmentId,
          a.date,
          a.warehouse,
          a.itemCode,
          a.serialNumber || '',
          a.adjustmentType,
          a.quantityChange,
          a.reason,
          a.requestedBy,
          a.approvedBy || '',
          a.approvalStatus,
          a.notes || '',
          a.createdAt,
        ]),
      },
      'Shipment Tracking': {
        headers: SHEETS_SCHEMA.ShipmentTracking.headers,
        rows: erpStore.shipmentTrackings.map((st: any) => [
          st.shipmentId,
          st.shipmentType,
          st.trackingNumber,
          st.carrier,
          st.referenceNumber || '',
          st.partyName || '',
          st.sourceWarehouse || '',
          st.destinationWarehouse || '',
          st.shipDate || '',
          st.expectedDeliveryDate || '',
          st.actualDeliveryDate || '',
          st.shipmentStatus,
          st.shippingCost || 0,
          st.currency || 'USD',
          st.trackingUrl || '',
          st.notes || '',
          st.createdAt,
        ]),
      },
      'Users and Roles': {
        headers: SHEETS_SCHEMA.UsersAndRoles.headers,
        rows: erpStore.users.map((u: any) => [
          u.userId,
          u.name,
          u.email,
          u.role,
          (u.assignedWarehouses || []).join(', '),
          u.active ? 'TRUE' : 'FALSE',
          u.lastLogin || '',
        ]),
      },
      'Audit Logs': {
        headers: SHEETS_SCHEMA.AuditLogs.headers,
        rows: erpStore.auditLogs.slice(-200).map((al: any) => [
          al.logId,
          al.userId,
          al.userName,
          al.action,
          al.entityType,
          al.entityId,
          al.timestamp,
          al.previousValues || '',
          al.newValues || '',
          al.reason || '',
          al.relatedTransactionId || '',
        ]),
      },
      Settings: {
        headers: SHEETS_SCHEMA.Settings.headers,
        rows: [
          ['Company Name', 'ApexPulse Industrial Electronics', 'ERP Operator Organization', new Date().toISOString()],
          ['Default Currency', 'USD', 'Primary accounting currency', new Date().toISOString()],
          ['Auto Sync Enabled', this.autoSyncEnabled ? 'TRUE' : 'FALSE', 'Live sync state', new Date().toISOString()],
          ['Warehouse Count', String(erpStore.warehouses.length), 'Active facilities', new Date().toISOString()],
          ['Total Item Catalog', String(erpStore.products.length), 'Unique industrial parts', new Date().toISOString()],
        ],
      },
      'Import Logs': {
        headers: SHEETS_SCHEMA.ImportLogs.headers,
        rows: erpStore.importLogs.map((il: any) => [
          il.importId,
          il.date,
          il.sourceFilename,
          il.entityType,
          il.totalRows,
          il.acceptedRows,
          il.rejectedRows,
          il.errorSummary || '',
          il.performedBy,
        ]),
      },
    };

    // First ensure missing sheets are bootstrapped
    await this.createMissingSheets(targetSpreadsheetId, tokenOverride);

    // Prepare batch update of values
    const dataUpdates: any[] = [];
    let totalSyncedRows = 0;

    for (const [sheetName, payload] of Object.entries(tablesData)) {
      const fullValues = [payload.headers, ...payload.rows];
      totalSyncedRows += payload.rows.length;
      dataUpdates.push({
        range: `'${sheetName}'!A1:Z${Math.max(1, fullValues.length + 5)}`,
        values: fullValues,
      });
    }

    // Execute batch update
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: targetSpreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: dataUpdates,
      },
    });

    this.lastSyncTime = new Date().toISOString();
    this.lastSyncStatus = 'success';
    this.lastSyncSummary = `Synced 20 worksheets (${totalSyncedRows} total records)`;

    return {
      success: true,
      sheetsCount: Object.keys(tablesData).length,
      totalRows: totalSyncedRows,
      timestamp: this.lastSyncTime,
      spreadsheetId: targetSpreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/edit`,
      message: `Successfully synchronized all 20 worksheets (${totalSyncedRows} total records) to Google Sheets.`,
    };
  }

  /**
   * Debounced Auto-Sync Trigger: called when mutations occur in the ERP
   */
  public triggerAutoSync(erpStore: any, tokenOverride?: string) {
    if (!this.autoSyncEnabled) return;
    if (!this.spreadsheetId && !process.env.GOOGLE_SPREADSHEET_ID) return;

    if (tokenOverride) {
      this.oauthToken = tokenOverride;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(async () => {
      if (this.isCurrentlySyncing) return;
      this.isCurrentlySyncing = true;
      try {
        console.log('[Auto-Sync] Initiating real-time sync to Google Sheets...');
        const result = await this.syncAllSheets(this.spreadsheetId, erpStore, this.oauthToken || undefined);
        console.log(`[Auto-Sync] Complete: ${result.message}`);
      } catch (err: any) {
        console.error('[Auto-Sync] Error during background sync:', err.message);
        this.lastSyncStatus = 'error';
        this.lastSyncSummary = err.message;
      } finally {
        this.isCurrentlySyncing = false;
      }
    }, 1500);
  }
}

export const googleSheetsService = new GoogleSheetsService();
