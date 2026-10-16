import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  FileSpreadsheet,
  Calendar,
  Building2,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  Truck,
  AlertTriangle,
  History,
  ShieldCheck,
  Search,
} from 'lucide-react';
import {
  ConsolidatedInventoryItem,
  WarehouseInventoryItem,
  IncomingShipment,
  OutgoingShipment,
  StockMovement,
  WarehouseTransfer,
  StockAdjustment,
  PurchaseOrder,
  Supplier,
  Customer,
  AuditLog,
  Warehouse,
  Product,
} from '../../types/erp';

interface ReportsViewProps {
  consolidatedInventory: ConsolidatedInventoryItem[];
  warehouseInventory: WarehouseInventoryItem[];
  incomingShipments: IncomingShipment[];
  outgoingShipments: OutgoingShipment[];
  stockMovements: StockMovement[];
  transfers: WarehouseTransfer[];
  adjustments: StockAdjustment[];
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  customers: Customer[];
  auditLogs: AuditLog[];
  warehouses: Warehouse[];
  products: Product[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  consolidatedInventory,
  warehouseInventory,
  incomingShipments,
  outgoingShipments,
  stockMovements,
  transfers,
  adjustments,
  purchaseOrders,
  suppliers,
  customers,
  auditLogs,
  warehouses,
  products,
}) => {
  const [selectedReportId, setSelectedReportId] = useState<string>('consolidated_inventory');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 20 Defined Reports from Section 19
  const reportDefinitions = [
    { id: 'consolidated_inventory', name: '1. Consolidated Inventory Report', category: 'Inventory' },
    { id: 'warehouse_stock', name: '2. Warehouse Stock Report', category: 'Inventory' },
    { id: 'stock_valuation', name: '3. Stock Valuation Report', category: 'Financial' },
    { id: 'incoming_stock', name: '4. Incoming Stock Report', category: 'Logistics' },
    { id: 'outgoing_stock', name: '5. Outgoing Stock Report', category: 'Logistics' },
    { id: 'stock_ledger', name: '6. Stock Movement Ledger', category: 'Audit' },
    { id: 'inventory_by_condition', name: '7. Inventory by Condition', category: 'Quality' },
    { id: 'inventory_by_mfg', name: '8. Inventory by Manufacturer', category: 'Catalog' },
    { id: 'serial_numbers', name: '9. Serial Number Report', category: 'Quality' },
    { id: 'low_stock', name: '10. Low Stock Report', category: 'Inventory' },
    { id: 'zero_stock', name: '11. Zero Stock Report', category: 'Inventory' },
    { id: 'discrepancy', name: '12. Negative Stock & Discrepancy Report', category: 'Audit' },
    { id: 'purchase_orders', name: '13. Purchase Order Status Report', category: 'Procurement' },
    { id: 'supplier_performance', name: '14. Supplier Performance Report', category: 'Procurement' },
    { id: 'customer_history', name: '15. Customer Shipment History', category: 'Sales' },
    { id: 'warehouse_transfers', name: '16. Warehouse Transfer Report', category: 'Logistics' },
    { id: 'goods_in_transit', name: '17. Goods in Transit Report', category: 'Logistics' },
    { id: 'shipment_delays', name: '18. Shipment Delay Report', category: 'Logistics' },
    { id: 'adjustments', name: '19. Inventory Adjustment Report', category: 'Audit' },
    { id: 'audit_trail', name: '20. Audit Trail Report', category: 'Compliance' },
  ];

  // Generate table headers and rows based on selected report
  const reportData = useMemo(() => {
    switch (selectedReportId) {
      case 'consolidated_inventory': {
        const headers = ['Item Code', 'Description', 'Make', 'Condition', 'Total Units', 'Available', 'Reserved', 'In Transit', 'TLS', 'TOLL', 'BFLO', 'NMK', 'PAK', 'KSA', 'SNT', 'USA', 'Ajman'];
        const rows = consolidatedInventory
          .filter((i) => conditionFilter === 'ALL' || i.condition === conditionFilter)
          .map((i) => [i.itemCode, i.itemDescription, i.manufacturer, i.condition, i.totalCompanyStock, i.availableStock, i.reservedStock, i.stockInTransit, i.tls, i.toll, i.bflo, i.nmk, i.pak, i.ksa, i.snt, i.usa, i.ajman]);
        return { headers, rows, title: 'Consolidated Inventory Across All Hubs' };
      }
      case 'warehouse_stock': {
        const headers = ['Warehouse', 'Item Code', 'Opening Stock', 'Incoming', 'Outgoing', 'Adjustments', 'Current Stock', 'Reorder Status'];
        const rows = warehouseInventory
          .filter((w) => warehouseFilter === 'ALL' || w.warehouse === warehouseFilter)
          .map((w) => [w.warehouse, w.itemCode, w.openingStock, w.totalIncoming, w.totalOutgoing, w.adjustment, w.currentStock, w.reorderStatus]);
        return { headers, rows, title: 'Warehouse Level Inventory Ledger' };
      }
      case 'stock_valuation': {
        const headers = ['Item Code', 'Description', 'Condition', 'Total Units', 'Unit Cost (USD)', 'Total Valuation (USD)'];
        const rows = consolidatedInventory.map((i) => [
          i.itemCode,
          i.itemDescription,
          i.condition,
          i.totalCompanyStock,
          `$${i.unitCost}`,
          `$${(i.totalCompanyStock * i.unitCost).toLocaleString()}`,
        ]);
        return { headers, rows, title: 'Inventory Valuation Report (Weighted Cost Method)' };
      }
      case 'stock_ledger': {
        const headers = ['Movement ID', 'Date', 'Type', 'Item Code', 'Serial No', 'Facility', 'Quantity', 'Reference', 'Reason', 'Recorded By'];
        const rows = stockMovements
          .filter((m) => warehouseFilter === 'ALL' || m.warehouse === warehouseFilter)
          .map((m) => [m.movementId, m.date.slice(0, 10), m.movementType, m.itemCode, m.serialNumber || '—', m.warehouse, m.quantity, m.referenceDocId, m.reason, m.recordedBy]);
        return { headers, rows, title: 'Immutable Stock Movement Audit Ledger' };
      }
      case 'incoming_stock': {
        const headers = ['Receipt ID', 'Date', 'Tracking No', 'Item Code', 'Warehouse', 'Supplier', 'Qty Received', 'Condition', 'Status', 'Received By'];
        const rows = incomingShipments.map((s) => [s.receiptId, s.date.slice(0, 10), s.trackingNo, s.itemCode, s.warehouse, s.supplier, s.quantityReceived, s.condition, s.receiptStatus, s.receivedBy]);
        return { headers, rows, title: 'Incoming Shipments & Goods Receipts' };
      }
      case 'outgoing_stock': {
        const headers = ['Issue ID', 'Date', 'Item Code', 'Tracking No', 'Source WH', 'Customer', 'Qty Issued', 'PO Reference', 'Status'];
        const rows = outgoingShipments.map((s) => [s.issueId, s.dateIssued.slice(0, 10), s.itemCode, s.trackingNo, s.warehouse, s.customer, s.quantityIssued, s.po || '—', s.shipmentStatus]);
        return { headers, rows, title: 'Outgoing Dispatches & Customer Issues' };
      }
      case 'low_stock': {
        const headers = ['Warehouse', 'Item Code', 'Current Stock', 'Reorder Status', 'Action Required'];
        const rows = warehouseInventory
          .filter((w) => w.reorderStatus === 'Low Stock')
          .map((w) => [w.warehouse, w.itemCode, w.currentStock, 'Low Stock', 'Initiate Purchase Request']);
        return { headers, rows, title: 'Low Stock Replenishment Warnings' };
      }
      case 'zero_stock': {
        const headers = ['Warehouse', 'Item Code', 'Current Stock', 'Status', 'Out Date'];
        const rows = warehouseInventory
          .filter((w) => w.reorderStatus === 'Out of Stock')
          .map((w) => [w.warehouse, w.itemCode, 0, 'Out of Stock', w.outDate || 'N/A']);
        return { headers, rows, title: 'Zero Stock Out-of-Stock Alert Report' };
      }
      case 'discrepancy': {
        const headers = ['Transfer ID', 'Date', 'Route', 'Item Code', 'Transferred Qty', 'Shortage', 'Damaged', 'Discrepancy Notes'];
        const rows = transfers
          .filter((t) => t.shortageQuantity > 0 || t.damagedQuantity > 0)
          .map((t) => [t.transferId, t.dateInitiated.slice(0, 10), `${t.sourceWarehouse} → ${t.destinationWarehouse}`, t.itemCode, t.quantity, t.shortageQuantity, t.damagedQuantity, t.discrepancyNotes || '—']);
        return { headers, rows, title: 'Transfer Discrepancy & Transit Damage Report' };
      }
      case 'goods_in_transit': {
        const headers = ['Transfer ID', 'Initiated', 'From', 'To', 'Item Code', 'Quantity', 'Carrier', 'Tracking Number'];
        const rows = transfers
          .filter((t) => t.transferStatus === 'In Transit')
          .map((t) => [t.transferId, t.dateInitiated.slice(0, 10), t.sourceWarehouse, t.destinationWarehouse, t.itemCode, t.quantity, t.carrier || 'Internal', t.trackingNumber || '—']);
        return { headers, rows, title: 'Goods in Transit Between International Facilities' };
      }
      case 'purchase_orders': {
        const headers = ['PO Number', 'Date', 'Supplier', 'Destination WH', 'Item Code', 'Ordered', 'Received', 'Unit Cost', 'Status'];
        const rows = purchaseOrders.map((p) => [p.poNumber, p.orderDate.slice(0, 10), p.supplier, p.destinationWarehouse, p.itemCode, p.quantityOrdered, p.quantityReceived, `$${p.unitCost}`, p.orderStatus]);
        return { headers, rows, title: 'Purchase Order Execution & Receipt Status' };
      }
      case 'supplier_performance': {
        const headers = ['Supplier Name', 'Country', 'Standard Lead Time (Days)', 'Payment Terms', 'Active Orders'];
        const rows = suppliers.map((s) => {
          const activeOrders = purchaseOrders.filter((p) => p.supplier === s.supplierName && p.orderStatus !== 'Fully Received').length;
          return [s.supplierName, s.country, `${s.leadTime} days`, s.paymentTerms, activeOrders];
        });
        return { headers, rows, title: 'Supplier Lead Time & Reliability Analysis' };
      }
      case 'customer_history': {
        const headers = ['Issue ID', 'Date', 'Customer Name', 'Item Code', 'Quantity', 'Customer PO', 'Status'];
        const rows = outgoingShipments.map((o) => [o.issueId, o.dateIssued.slice(0, 10), o.customer, o.itemCode, o.quantityIssued, o.po || '—', o.shipmentStatus]);
        return { headers, rows, title: 'Customer Shipment & Dispatch History' };
      }
      case 'adjustments': {
        const headers = ['Adjustment ID', 'Date', 'Warehouse', 'Item Code', 'Type', 'Quantity Change', 'Reason', 'Approval Status', 'Approved By'];
        const rows = adjustments.map((a) => [a.adjustmentId, a.date.slice(0, 10), a.warehouse, a.itemCode, a.adjustmentType, a.quantityChange, a.reason, a.approvalStatus, a.approvedBy || 'Pending']);
        return { headers, rows, title: 'Stock Adjustment & Cycle Count Variance Log' };
      }
      case 'audit_trail': {
        const headers = ['Log ID', 'Timestamp', 'User Name', 'Action', 'Entity Type', 'Entity ID', 'Details / Reason'];
        const rows = auditLogs.map((l) => [l.logId, l.timestamp.slice(0, 19).replace('T', ' '), l.userName, l.action, l.entityType, l.entityId, l.reason || l.newValues || '—']);
        return { headers, rows, title: 'Enterprise System Audit Trail & Compliance Log' };
      }
      default: {
        const headers = ['Item Code', 'Description', 'Manufacturer', 'Condition', 'Total Units'];
        const rows = consolidatedInventory.map((i) => [i.itemCode, i.itemDescription, i.manufacturer, i.condition, i.totalCompanyStock]);
        return { headers, rows, title: 'Management Report' };
      }
    }
  }, [
    selectedReportId,
    consolidatedInventory,
    warehouseInventory,
    stockMovements,
    incomingShipments,
    outgoingShipments,
    transfers,
    adjustments,
    purchaseOrders,
    suppliers,
    customers,
    auditLogs,
    warehouseFilter,
    conditionFilter,
  ]);

  const exportCurrentReportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [reportData.headers.join(','), ...reportData.rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedReportId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Management & Financial Reporting Center
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              (20 Enterprise Reports)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational, regulatory, and financial reports generated directly from the immutable inventory ledger.
          </p>
        </div>

        <button
          onClick={exportCurrentReportCSV}
          className="flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="h-4 w-4" />
          <span>Export Current Report (CSV)</span>
        </button>
      </div>

      {/* Report Selection Strip & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Report Selector Dropdown */}
        <div className="rounded border border-slate-200 bg-white p-3">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Select Business Report (1 to 20):
          </label>
          <select
            value={selectedReportId}
            onChange={(e) => setSelectedReportId(e.target.value)}
            className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none font-medium cursor-pointer"
          >
            {reportDefinitions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} [{r.category}]
              </option>
            ))}
          </select>
        </div>

        {/* Warehouse Scope Filter */}
        <div className="rounded border border-slate-200 bg-white p-3">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Warehouse Scope Filter:
          </label>
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none cursor-pointer"
          >
            <option value="ALL">All 9 Facilities (Aggregated)</option>
            {warehouses.map((w) => (
              <option key={w.warehouseCode} value={w.warehouseCode}>
                {w.warehouseCode} · {w.location} ({w.warehouseName})
              </option>
            ))}
          </select>
        </div>

        {/* Condition Filter */}
        <div className="rounded border border-slate-200 bg-white p-3">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Condition Scope Filter:
          </label>
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none cursor-pointer"
          >
            <option value="ALL">All Product Conditions</option>
            <option value="New in Box">New in Box</option>
            <option value="Used">Used</option>
            <option value="Tested">Tested</option>
            <option value="Refurbished">Refurbished</option>
            <option value="Damaged">Damaged</option>
          </select>
        </div>
      </div>

      {/* Generated Report Table */}
      <div className="rounded border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-slate-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {reportData.title}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {reportData.rows.length} rows generated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                {reportData.headers.map((h, i) => (
                  <th key={i} className="py-2.5 px-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {reportData.rows.length === 0 ? (
                <tr>
                  <td colSpan={reportData.headers.length} className="py-12 text-center text-slate-400">
                    No data records found matching report parameters.
                  </td>
                </tr>
              ) : (
                reportData.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
