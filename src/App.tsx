import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, NavigationModule } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ConsolidatedInventoryView } from './components/inventory/ConsolidatedInventoryView';
import { WarehouseInventoryView } from './components/inventory/WarehouseInventoryView';
import { IncomingStockView } from './components/incoming/IncomingStockView';
import { OutgoingStockView } from './components/outgoing/OutgoingStockView';
import { WarehouseManagementView } from './components/warehouses/WarehouseManagementView';
import { WarehouseTransfersView } from './components/transfers/WarehouseTransfersView';
import { ProcurementView } from './components/procurement/ProcurementView';
import { PurchaseOrdersView } from './components/procurement/PurchaseOrdersView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { CustomersView } from './components/customers/CustomersView';
import { ShipmentTrackingView } from './components/tracking/ShipmentTrackingView';
import { StockAdjustmentsView } from './components/adjustments/StockAdjustmentsView';
import { SerialNumbersView } from './components/serials/SerialNumbersView';
import { ReportsView } from './components/reports/ReportsView';
import { DataImportView } from './components/import/DataImportView';
import { UserManagementView } from './components/users/UserManagementView';
import { SettingsView } from './components/settings/SettingsView';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { PrintDocumentModal } from './components/common/PrintDocumentModal';
import { ItemDrilldownModal } from './components/common/ItemDrilldownModal';
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  getAccessToken,
  getCurrentGoogleUser,
} from './lib/firebaseAuth';
import {
  Product,
  Warehouse,
  WarehouseInventoryItem,
  ConsolidatedInventoryItem,
  IncomingShipment,
  OutgoingShipment,
  StockMovement,
  Supplier,
  Customer,
  PurchaseRequest,
  PurchaseOrder,
  WarehouseTransfer,
  StockAdjustment,
  ShipmentTrackingRecord,
  SerialNumberRecord,
  AppUser,
  AuditLog,
  ImportLog,
  GoogleSheetsConfig,
} from './types/erp';

export function App() {
  const [activeModule, setActiveModule] = useState<NavigationModule>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>('ALL');
  const [isReconciling, setIsReconciling] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Google Workspace Integration State
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  // Core Data State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseInventory, setWarehouseInventory] = useState<WarehouseInventoryItem[]>([]);
  const [consolidatedInventory, setConsolidatedInventory] = useState<ConsolidatedInventoryItem[]>([]);
  const [incomingShipments, setIncomingShipments] = useState<IncomingShipment[]>([]);
  const [outgoingShipments, setOutgoingShipments] = useState<OutgoingShipment[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [transfers, setTransfers] = useState<WarehouseTransfer[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shipmentTrackings, setShipmentTrackings] = useState<ShipmentTrackingRecord[]>([]);
  const [serialNumbers, setSerialNumbers] = useState<SerialNumberRecord[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig | null>(null);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [printDoc, setPrintDoc] = useState<{
    isOpen: boolean;
    type: 'GRN' | 'DISPATCH_NOTE' | 'PACKING_LIST' | 'PO';
    data: any;
  }>({ isOpen: false, type: 'GRN', data: null });
  const [drilldownItemCode, setDrilldownItemCode] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Authenticated fetch wrapper passing Google OAuth bearer token to backend
  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = await getAccessToken();
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, { ...options, headers });
  }, []);

  // Listen to Google Workspace OAuth status
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        // Refresh server config with access token
        fetch('/api/sheets/config', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((cfg) => setSheetsConfig(cfg))
          .catch(() => {});
      },
      () => {
        setGoogleUser(getCurrentGoogleUser());
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fetch all initial master data
  const refreshAllData = useCallback(async () => {
    try {
      const [
        authRes,
        kpiRes,
        prdRes,
        whRes,
        whInvRes,
        conInvRes,
        inRes,
        outRes,
        mvtRes,
        trfRes,
        prRes,
        poRes,
        supRes,
        custRes,
        trkRes,
        snRes,
        adjRes,
        audRes,
        impRes,
        shtRes,
      ] = await Promise.all([
        authenticatedFetch('/api/auth/current').then((r) => r.json()),
        authenticatedFetch('/api/dashboard/kpis').then((r) => r.json()),
        authenticatedFetch('/api/products').then((r) => r.json()),
        authenticatedFetch('/api/warehouses').then((r) => r.json()),
        authenticatedFetch('/api/inventory/warehouse').then((r) => r.json()),
        authenticatedFetch('/api/inventory/consolidated').then((r) => r.json()),
        authenticatedFetch('/api/incoming').then((r) => r.json()),
        authenticatedFetch('/api/outgoing').then((r) => r.json()),
        authenticatedFetch('/api/inventory/movements').then((r) => r.json()),
        authenticatedFetch('/api/transfers').then((r) => r.json()),
        authenticatedFetch('/api/procurement/requests').then((r) => r.json()),
        authenticatedFetch('/api/procurement/orders').then((r) => r.json()),
        authenticatedFetch('/api/suppliers').then((r) => r.json()),
        authenticatedFetch('/api/customers').then((r) => r.json()),
        authenticatedFetch('/api/tracking').then((r) => r.json()),
        authenticatedFetch('/api/serials').then((r) => r.json()),
        authenticatedFetch('/api/adjustments').then((r) => r.json()),
        authenticatedFetch('/api/audit').then((r) => r.json()),
        authenticatedFetch('/api/import/logs').then((r) => r.json()),
        authenticatedFetch('/api/sheets/config').then((r) => r.json()),
      ]);

      if (authRes.user) setCurrentUser(authRes.user);
      if (authRes.availableUsers) setUsers(authRes.availableUsers);
      setKpis(kpiRes);
      setProducts(prdRes);
      setWarehouses(whRes);
      setWarehouseInventory(whInvRes);
      setConsolidatedInventory(conInvRes);
      setIncomingShipments(inRes);
      setOutgoingShipments(outRes);
      setStockMovements(mvtRes);
      setTransfers(trfRes);
      setPurchaseRequests(prRes);
      setPurchaseOrders(poRes);
      setSuppliers(supRes);
      setCustomers(custRes);
      setShipmentTrackings(trkRes);
      setSerialNumbers(snRes);
      setStockAdjustments(adjRes);
      setAuditLogs(audRes);
      setImportLogs(impRes);
      setSheetsConfig(shtRes);
    } catch (err) {
      console.error('Failed to load ERP state:', err);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Global Keyboard shortcut Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Google Workspace Handlers
  const handleGoogleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res?.user && res.accessToken) {
        setGoogleUser(res.user);
        showToast(`Connected to Google Sheets as ${res.user.email}`);
        const cfg = await fetch('/api/sheets/config', {
          headers: { Authorization: `Bearer ${res.accessToken}` },
        }).then((r) => r.json());
        setSheetsConfig(cfg);
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      showToast(`Google Sign-in: ${err.message || 'Cancelled'}`);
    }
  };

  const handleGoogleSignOut = async () => {
    await googleSignOut();
    setGoogleUser(null);
    showToast('Signed out of Google account.');
  };

  const handleCreateMasterSpreadsheet = async () => {
    setIsAutoSyncing(true);
    try {
      const res = await authenticatedFetch('/api/sheets/create-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create master spreadsheet');
      }
      await refreshAllData();
      showToast('Master Google Spreadsheet created with all 20 worksheets!');
      return data;
    } catch (err: any) {
      showToast(`Creation error: ${err.message}`);
      throw err;
    } finally {
      setIsAutoSyncing(false);
    }
  };

  const handleToggleAutoSync = async (enabled: boolean) => {
    await authenticatedFetch('/api/sheets/set-auto-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    await refreshAllData();
    showToast(enabled ? 'Real-time auto-sync activated.' : 'Auto-sync paused.');
  };

  const handleQuickSync = async () => {
    setIsAutoSyncing(true);
    try {
      const spreadsheetId = sheetsConfig?.spreadsheetId;
      const res = await authenticatedFetch('/api/sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Sync failed');
      await refreshAllData();
      showToast(data.message || 'All 20 worksheets successfully synchronized!');
    } catch (err: any) {
      showToast(`Sync error: ${err.message}`);
    } finally {
      setIsAutoSyncing(false);
    }
  };

  // Switch role handler
  const handleSwitchUser = async (userId: string) => {
    const res = await authenticatedFetch('/api/auth/switch-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (data.user) {
      setCurrentUser(data.user);
      showToast(`Switched active operator to ${data.user.name} (${data.user.role})`);
    }
  };

  // Reconcile stock action
  const handleReconcile = async () => {
    setIsReconciling(true);
    try {
      const res = await authenticatedFetch('/api/inventory/reconcile', { method: 'POST' });
      const data = await res.json();
      await refreshAllData();
      showToast(data.message || 'Ledger successfully reconciled against movements.');
    } finally {
      setIsReconciling(false);
    }
  };

  // Incoming Stock handlers
  const handleRegisterReceipt = async (payload: any) => {
    const res = await authenticatedFetch('/api/incoming', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register shipment');
    }
    await refreshAllData();
    showToast('Incoming shipment registered in Draft status.');
  };

  const handleConfirmReceipt = async (receiptId: string) => {
    const res = await authenticatedFetch(`/api/incoming/${receiptId}/confirm`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to confirm receipt');
    }
    await refreshAllData();
    showToast('Goods Receipt confirmed! Stock ledger & Google Sheets updated.');
  };

  // Outgoing Stock handlers
  const handleCreateIssue = async (payload: any) => {
    const res = await authenticatedFetch('/api/outgoing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create outgoing shipment');
    }
    await refreshAllData();
    showToast('Outgoing shipment created. Stock reserved.');
  };

  const handleConfirmDispatch = async (issueId: string) => {
    const res = await authenticatedFetch(`/api/outgoing/${issueId}/confirm-dispatch`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to confirm dispatch');
    }
    await refreshAllData();
    showToast('Shipment dispatched! Stock deducted & auto-synced to Google Sheets.');
  };

  // Warehouse Transfer handlers
  const handleCreateTransfer = async (payload: any) => {
    const res = await authenticatedFetch('/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create transfer');
    }
    await refreshAllData();
    showToast('Transfer request initiated in Draft status.');
  };

  const handleDispatchTransfer = async (transferId: string) => {
    await authenticatedFetch(`/api/transfers/${transferId}/dispatch`, { method: 'POST' });
    await refreshAllData();
    showToast('Transfer dispatched: source stock decremented, units In Transit.');
  };

  const handleReceiveTransfer = async (transferId: string, discrepancyPayload: any) => {
    await authenticatedFetch(`/api/transfers/${transferId}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discrepancyPayload),
    });
    await refreshAllData();
    showToast('Transfer received! Destination stock incremented & auto-synced.');
  };

  // Procurement handlers
  const handleCreatePurchaseRequest = async (payload: any) => {
    await authenticatedFetch('/api/procurement/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await refreshAllData();
    showToast('Purchase requisition submitted for approval.');
  };

  const handleApprovePurchaseRequest = async (requestId: string) => {
    const res = await authenticatedFetch(`/api/procurement/requests/${requestId}/approve`, { method: 'POST' });
    const data = await res.json();
    await refreshAllData();
    showToast(`Requisition approved! Generated PO ${data.generatedPO?.poNumber}.`);
  };

  const handleCreatePurchaseOrder = async (payload: any) => {
    await authenticatedFetch('/api/procurement/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await refreshAllData();
    showToast('Purchase Order issued to vendor.');
  };

  // Suppliers & Customers
  const handleCreateSupplier = async (payload: any) => {
    await authenticatedFetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await refreshAllData();
    showToast('Supplier registered in master catalogue.');
  };

  const handleCreateCustomer = async (payload: any) => {
    await authenticatedFetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await refreshAllData();
    showToast('Customer account registered.');
  };

  const handleReviewCustomer = async (customerId: string, action: 'confirm_distinct' | 'merge_into', targetId?: string) => {
    await authenticatedFetch(`/api/customers/${customerId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, targetId }),
    });
    await refreshAllData();
    showToast(action === 'confirm_distinct' ? 'Customer confirmed as distinct legal entity.' : 'Customer merged into target master.');
  };

  // Tracking handlers
  const handleRegisterTracking = async (payload: any) => {
    await authenticatedFetch('/api/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await refreshAllData();
    showToast('Shipment tracking registered.');
  };

  const handleUpdateTrackingStatus = async (shipmentId: string, status: any, notes?: string) => {
    await authenticatedFetch(`/api/tracking/${shipmentId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    });
    await refreshAllData();
    showToast(`Shipment status updated to ${status}.`);
  };

  // Stock Adjustments
  const handleRequestAdjustment = async (payload: any) => {
    await authenticatedFetch('/api/adjustments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await refreshAllData();
    showToast('Stock adjustment requested. Awaiting authorization.');
  };

  const handleApproveAdjustment = async (adjustmentId: string) => {
    await authenticatedFetch(`/api/adjustments/${adjustmentId}/approve`, { method: 'POST' });
    await refreshAllData();
    showToast('Stock adjustment approved and posted to inventory ledger!');
  };

  // Warehouse updates
  const handleUpdateWarehouse = async (code: string, updates: Partial<Warehouse>) => {
    await authenticatedFetch(`/api/warehouses/${code}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    await refreshAllData();
    showToast(`Warehouse ${code} details updated.`);
  };

  // User Management
  const handleCreateUser = async (payload: any) => {
    await authenticatedFetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await refreshAllData();
    showToast('User created successfully.');
  };

  const handleUpdateUser = async (userId: string, updates: Partial<AppUser>) => {
    await authenticatedFetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    await refreshAllData();
    showToast('User permissions updated.');
  };

  // Data Import
  const handleCommitImport = async (payload: any) => {
    const res = await authenticatedFetch('/api/import/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    await refreshAllData();
    return data;
  };

  // Google Sheets integration actions
  const handleTestSheetsConnection = async (spreadsheetId: string) => {
    const res = await authenticatedFetch('/api/sheets/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spreadsheetId }),
    });
    return await res.json();
  };

  const handleBootstrapSheets = async (spreadsheetId: string) => {
    const res = await authenticatedFetch('/api/sheets/bootstrap-sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spreadsheetId }),
    });
    return await res.json();
  };

  const handleSyncSheets = async (spreadsheetId: string) => {
    const res = await authenticatedFetch('/api/sheets/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spreadsheetId }),
    });
    return await res.json();
  };

  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      products,
      warehouses,
      consolidatedInventory,
      warehouseInventory,
      incomingShipments,
      outgoingShipments,
      stockMovements,
      transfers,
      stockAdjustments,
      serialNumbers,
      purchaseRequests,
      purchaseOrders,
      suppliers,
      customers,
      shipmentTrackings,
      auditLogs,
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', jsonStr);
    dlAnchor.setAttribute('download', `apexpulse_erp_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast('Full ERP JSON database snapshot exported.');
  };

  const getAvailableStock = (warehouseCode: string, itemCode: string): number => {
    const item = warehouseInventory.find(
      (w) => w.warehouse === warehouseCode && w.itemCode === itemCode
    );
    return item ? item.currentStock : 0;
  };

  // Badge notification counts
  const badgeCounts = {
    incomingPending: incomingShipments.filter((s) => s.receiptStatus !== 'Confirmed').length,
    outgoingPending: outgoingShipments.filter((s) => s.shipmentStatus !== 'Dispatched' && s.shipmentStatus !== 'Delivered').length,
    adjustmentsPending: stockAdjustments.filter((a) => a.approvalStatus === 'Pending Approval').length,
    transfersInTransit: transfers.filter((t) => t.transferStatus === 'In Transit').length,
    customersReview: customers.filter((c) => c.reviewStatus === 'Needs Review').length,
    purchaseOrdersPending: purchaseOrders.filter((p) => p.orderStatus !== 'Fully Received').length,
  };

  const getModuleTitle = () => {
    switch (activeModule) {
      case 'dashboard': return 'Operations Dashboard';
      case 'consolidated_inventory': return 'Consolidated Inventory';
      case 'warehouse_inventory': return 'Warehouse Inventory Ledger';
      case 'incoming_stock': return 'Shipment Tracker: Incoming Stock';
      case 'outgoing_stock': return 'Shipment Tracker: Outgoing Stock';
      case 'warehouses': return 'Warehouse Master (9 Hubs)';
      case 'transfers': return 'Warehouse Transfers';
      case 'procurement': return 'Procurement Requisitions';
      case 'purchase_orders': return 'Purchase Orders';
      case 'suppliers': return 'Suppliers Master';
      case 'customers': return 'Customers Master';
      case 'shipment_tracking': return 'Shipment Tracking';
      case 'adjustments': return 'Stock Adjustments';
      case 'serial_numbers': return 'Serial Numbers Registry';
      case 'reports': return 'Enterprise Reports Center';
      case 'data_import': return 'Data Import Center';
      case 'user_management': return 'User Roles & Permissions';
      case 'settings': return 'Settings & Google Sheets Auto-Sync';
      default: return 'ERP Console';
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 antialiased overflow-hidden">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-md bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg transition-all animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Collapsible Sidebar */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        badgeCounts={badgeCounts}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header
          currentUser={currentUser}
          users={users}
          onSwitchUser={handleSwitchUser}
          warehouses={warehouses}
          selectedWarehouseFilter={selectedWarehouseFilter}
          onSelectWarehouseFilter={setSelectedWarehouseFilter}
          onOpenGlobalSearch={() => setIsSearchOpen(true)}
          onReconcile={handleReconcile}
          isReconciling={isReconciling}
          sheetsConfigured={Boolean(sheetsConfig?.isConfigured)}
          activeModuleTitle={getModuleTitle()}
          googleUser={googleUser}
          spreadsheetUrl={sheetsConfig?.spreadsheetUrl}
          onGoogleSignIn={handleGoogleSignIn}
          onQuickSync={handleQuickSync}
          isAutoSyncing={isAutoSyncing}
          autoSyncEnabled={sheetsConfig?.autoSyncEnabled !== false}
        />

        {/* Viewport Frame */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {activeModule === 'dashboard' && (
              <DashboardView
                kpis={kpis}
                warehouses={warehouses}
                products={products}
                onNavigate={(mod) => setActiveModule(mod as NavigationModule)}
                onFilterWarehouse={(wh) => setSelectedWarehouseFilter(wh)}
                selectedWarehouse={selectedWarehouseFilter}
              />
            )}

            {activeModule === 'consolidated_inventory' && (
              <ConsolidatedInventoryView
                inventory={consolidatedInventory}
                onOpenItemDrilldown={(itemCode) => setDrilldownItemCode(itemCode)}
              />
            )}

            {activeModule === 'warehouse_inventory' && (
              <WarehouseInventoryView
                inventory={warehouseInventory}
                warehouses={warehouses}
                products={products}
                selectedWarehouse={selectedWarehouseFilter}
                onSelectWarehouse={setSelectedWarehouseFilter}
                onOpenLedger={(itemCode) => setDrilldownItemCode(itemCode)}
                onReconcile={handleReconcile}
                isReconciling={isReconciling}
              />
            )}

            {activeModule === 'incoming_stock' && (
              <IncomingStockView
                shipments={incomingShipments}
                warehouses={warehouses}
                products={products}
                suppliers={suppliers}
                purchaseOrders={purchaseOrders}
                onRegisterReceipt={handleRegisterReceipt}
                onConfirmReceipt={handleConfirmReceipt}
                onPrintGRN={(receipt) => setPrintDoc({ isOpen: true, type: 'GRN', data: receipt })}
                selectedWarehouseFilter={selectedWarehouseFilter}
              />
            )}

            {activeModule === 'outgoing_stock' && (
              <OutgoingStockView
                shipments={outgoingShipments}
                warehouses={warehouses}
                products={products}
                customers={customers}
                serialNumbers={serialNumbers}
                onCreateIssue={handleCreateIssue}
                onConfirmDispatch={handleConfirmDispatch}
                onPrintDispatchNote={(issue) => setPrintDoc({ isOpen: true, type: 'DISPATCH_NOTE', data: issue })}
                selectedWarehouseFilter={selectedWarehouseFilter}
                getAvailableStock={getAvailableStock}
              />
            )}

            {activeModule === 'warehouses' && (
              <WarehouseManagementView
                warehouses={warehouses}
                inventory={warehouseInventory}
                onUpdateWarehouse={handleUpdateWarehouse}
                onSelectWarehouse={(wh) => {
                  setSelectedWarehouseFilter(wh);
                  setActiveModule('warehouse_inventory');
                }}
              />
            )}

            {activeModule === 'transfers' && (
              <WarehouseTransfersView
                transfers={transfers}
                warehouses={warehouses}
                products={products}
                onCreateTransfer={handleCreateTransfer}
                onDispatchTransfer={handleDispatchTransfer}
                onReceiveTransfer={handleReceiveTransfer}
                getAvailableStock={getAvailableStock}
              />
            )}

            {activeModule === 'procurement' && (
              <ProcurementView
                requests={purchaseRequests}
                warehouses={warehouses}
                products={products}
                suppliers={suppliers}
                onCreateRequest={handleCreatePurchaseRequest}
                onApproveRequest={handleApprovePurchaseRequest}
              />
            )}

            {activeModule === 'purchase_orders' && (
              <PurchaseOrdersView
                orders={purchaseOrders}
                warehouses={warehouses}
                products={products}
                suppliers={suppliers}
                onCreateOrder={handleCreatePurchaseOrder}
                onReceiveAgainstPO={() => {
                  setActiveModule('incoming_stock');
                }}
                onPrintPO={(po) => setPrintDoc({ isOpen: true, type: 'PO', data: po })}
              />
            )}

            {activeModule === 'suppliers' && (
              <SuppliersView
                suppliers={suppliers}
                onCreateSupplier={handleCreateSupplier}
              />
            )}

            {activeModule === 'customers' && (
              <CustomersView
                customers={customers}
                onCreateCustomer={handleCreateCustomer}
                onReviewCustomer={handleReviewCustomer}
              />
            )}

            {activeModule === 'shipment_tracking' && (
              <ShipmentTrackingView
                shipments={shipmentTrackings}
                warehouses={warehouses}
                onRegisterTracking={handleRegisterTracking}
                onUpdateStatus={handleUpdateTrackingStatus}
              />
            )}

            {activeModule === 'adjustments' && (
              <StockAdjustmentsView
                adjustments={stockAdjustments}
                warehouses={warehouses}
                products={products}
                onRequestAdjustment={handleRequestAdjustment}
                onApproveAdjustment={handleApproveAdjustment}
              />
            )}

            {activeModule === 'serial_numbers' && (
              <SerialNumbersView
                serials={serialNumbers}
                selectedWarehouseFilter={selectedWarehouseFilter}
              />
            )}

            {activeModule === 'reports' && (
              <ReportsView
                consolidatedInventory={consolidatedInventory}
                warehouseInventory={warehouseInventory}
                incomingShipments={incomingShipments}
                outgoingShipments={outgoingShipments}
                stockMovements={stockMovements}
                transfers={transfers}
                adjustments={stockAdjustments}
                purchaseOrders={purchaseOrders}
                suppliers={suppliers}
                customers={customers}
                auditLogs={auditLogs}
                warehouses={warehouses}
                products={products}
              />
            )}

            {activeModule === 'data_import' && (
              <DataImportView
                importLogs={importLogs}
                warehouses={warehouses}
                products={products}
                onCommitImport={handleCommitImport}
              />
            )}

            {activeModule === 'user_management' && (
              <UserManagementView
                users={users}
                warehouses={warehouses}
                onCreateUser={handleCreateUser}
                onUpdateUser={handleUpdateUser}
              />
            )}

            {activeModule === 'settings' && (
              <SettingsView
                sheetsConfig={sheetsConfig}
                onTestConnection={handleTestSheetsConnection}
                onBootstrapSheets={handleBootstrapSheets}
                onSyncSheets={handleSyncSheets}
                onExportBackup={handleExportBackup}
                googleUser={googleUser}
                onGoogleSignIn={handleGoogleSignIn}
                onGoogleSignOut={handleGoogleSignOut}
                onCreateMasterSpreadsheet={handleCreateMasterSpreadsheet}
                onToggleAutoSync={handleToggleAutoSync}
                isAutoSyncing={isAutoSyncing}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        serials={serialNumbers}
        incomingShipments={incomingShipments}
        outgoingShipments={outgoingShipments}
        purchaseOrders={purchaseOrders}
        customers={customers}
        suppliers={suppliers}
        warehouses={warehouses}
        onSelectResult={(type, id) => {
          if (type === 'product' || type === 'serial') {
            setDrilldownItemCode(id);
          } else if (type === 'tracking') {
            setActiveModule('shipment_tracking');
          } else if (type === 'po') {
            setActiveModule('purchase_orders');
          } else if (type === 'customer') {
            setActiveModule('customers');
          }
        }}
      />

      {/* Item Drilldown Modal */}
      <ItemDrilldownModal
        isOpen={Boolean(drilldownItemCode)}
        onClose={() => setDrilldownItemCode(null)}
        itemCode={drilldownItemCode}
        products={products}
        consolidatedInventory={consolidatedInventory}
        warehouseInventory={warehouseInventory}
        stockMovements={stockMovements}
        serialNumbers={serialNumbers}
        warehouses={warehouses}
      />

      {/* Print Document Modal */}
      <PrintDocumentModal
        isOpen={printDoc.isOpen}
        onClose={() => setPrintDoc({ isOpen: false, type: 'GRN', data: null })}
        documentType={printDoc.type}
        data={printDoc.data}
      />
    </div>
  );
}

export default App;
