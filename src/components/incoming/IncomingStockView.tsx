import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  Filter,
  ArrowDownToLine,
  Building2,
  AlertCircle,
  FileCheck,
  X,
} from 'lucide-react';
import {
  IncomingShipment,
  Warehouse,
  Product,
  Supplier,
  PurchaseOrder,
  ProductCondition,
} from '../../types/erp';

interface IncomingStockViewProps {
  shipments: IncomingShipment[];
  warehouses: Warehouse[];
  products: Product[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  onRegisterReceipt: (payload: any) => Promise<void>;
  onConfirmReceipt: (receiptId: string) => Promise<void>;
  onPrintGRN: (receipt: IncomingShipment) => void;
  selectedWarehouseFilter: string;
}

export const IncomingStockView: React.FC<IncomingStockViewProps> = ({
  shipments,
  warehouses,
  products,
  suppliers,
  purchaseOrders,
  onRegisterReceipt,
  onConfirmReceipt,
  onPrintGRN,
  selectedWarehouseFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    trackingNo: '',
    itemCode: products[0]?.itemCode || '',
    warehouse: warehouses[0]?.warehouseCode || 'WH-001',
    supplier: suppliers[0]?.supplierName || '',
    quantityReceived: 1,
    unitCost: products[0]?.defaultUnitCost || 0,
    currency: 'USD',
    purchaseOrderNumber: '',
    condition: 'New in Box' as ProductCondition,
    serialNumbersText: '',
    notes: '',
  });

  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      if (selectedWarehouseFilter !== 'ALL' && s.warehouse !== selectedWarehouseFilter) return false;
      if (statusFilter !== 'ALL' && s.receiptStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTracking = s.trackingNo.toLowerCase().includes(q);
        const matchCode = s.itemCode.toLowerCase().includes(q);
        const matchSerial = (s.serialNumber || '').toLowerCase().includes(q);
        const matchSupplier = s.supplier.toLowerCase().includes(q);
        const matchPO = (s.purchaseOrderNumber || '').toLowerCase().includes(q);
        if (!matchTracking && !matchCode && !matchSerial && !matchSupplier && !matchPO) return false;
      }
      return true;
    });
  }, [shipments, selectedWarehouseFilter, statusFilter, searchQuery]);

  // Handle PO auto-fill
  const handlePOSelect = (poNum: string) => {
    const po = purchaseOrders.find((p) => p.poNumber === poNum);
    if (po) {
      const remainingQty = Math.max(1, po.quantityOrdered - po.quantityReceived);
      const prod = products.find((p) => p.itemCode === po.itemCode);
      setFormData((prev) => ({
        ...prev,
        purchaseOrderNumber: poNum,
        supplier: po.supplier,
        itemCode: po.itemCode,
        warehouse: po.destinationWarehouse,
        quantityReceived: remainingQty,
        unitCost: po.unitCost,
        currency: po.currency,
        condition: prod?.condition || 'New in Box',
      }));
    } else {
      setFormData((prev) => ({ ...prev, purchaseOrderNumber: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.trackingNo || !formData.itemCode || !formData.warehouse || !formData.quantityReceived) {
      return;
    }
    setIsSubmitting(true);
    try {
      const serials = formData.serialNumbersText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      await onRegisterReceipt({
        ...formData,
        serialNumbers: serials,
        serialNumber: serials[0] || undefined,
      });

      setIsModalOpen(false);
      setFormData({
        trackingNo: '',
        itemCode: products[0]?.itemCode || '',
        warehouse: warehouses[0]?.warehouseCode || 'WH-001',
        supplier: suppliers[0]?.supplierName || '',
        quantityReceived: 1,
        unitCost: products[0]?.defaultUnitCost || 0,
        currency: 'USD',
        purchaseOrderNumber: '',
        condition: 'New in Box',
        serialNumbersText: '',
        notes: '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async (receiptId: string) => {
    setConfirmingId(receiptId);
    try {
      await onConfirmReceipt(receiptId);
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Shipment Tracker: Incoming Stock
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              ({filteredShipments.length} receipts)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Log, inspect, and confirm goods receipts against POs. Stock only updates in warehouse ledger upon receipt confirmation.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Register Incoming Shipment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tracking #, PO, item code, serial no, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none"
          >
            <option value="ALL">All Receipt Statuses</option>
            <option value="Draft">Draft (Awaiting Inspection)</option>
            <option value="Inspected">Inspected (Ready to Confirm)</option>
            <option value="Confirmed">Confirmed (Stock Received)</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800 font-mono tabular-nums">{filteredShipments.length}</span> of {shipments.length} records
        </div>
      </div>

      {/* Table Name: Shipment Tracker Incoming Stock (Section 6) */}
      <div className="rounded border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Receipt ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Tracking No.</th>
                <th className="py-3 px-3">Item Code & Name</th>
                <th className="py-3 px-2.5">Warehouse</th>
                <th className="py-3 px-2.5">Supplier / PO</th>
                <th className="py-3 px-2.5 text-right">Qty Received</th>
                <th className="py-3 px-2.5">Condition</th>
                <th className="py-3 px-2.5">Serial No.</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No incoming shipment records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredShipments.map((s) => {
                  const isConfirmed = s.receiptStatus === 'Confirmed';
                  return (
                    <tr key={s.receiptId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {s.receiptId}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(s.date).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800 font-medium whitespace-nowrap">
                        {s.trackingNo}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-slate-900">{s.itemCode}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{s.itemName}</div>
                      </td>
                      <td className="py-2.5 px-2.5 font-semibold text-slate-800 whitespace-nowrap">
                        {s.warehouse}
                      </td>
                      <td className="py-2.5 px-2.5">
                        <div className="font-medium text-slate-800 line-clamp-1">{s.supplier}</div>
                        {s.purchaseOrderNumber && (
                          <div className="text-[10px] text-slate-500 font-mono">PO: {s.purchaseOrderNumber}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {s.quantityReceived}
                      </td>
                      <td className="py-2.5 px-2.5 whitespace-nowrap">
                        <span className="text-slate-700 font-medium">{s.condition}</span>
                      </td>
                      <td className="py-2.5 px-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {s.serialNumbers && s.serialNumbers.length > 1
                          ? `${s.serialNumbers[0]} (+${s.serialNumbers.length - 1} more)`
                          : s.serialNumber || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isConfirmed ? (
                          <span className="text-xs font-semibold text-emerald-700">Confirmed</span>
                        ) : s.receiptStatus === 'Inspected' ? (
                          <span className="text-xs font-semibold text-blue-700">Inspected</span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-700">Draft</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isConfirmed && (
                            <button
                              onClick={() => handleConfirm(s.receiptId)}
                              disabled={confirmingId === s.receiptId}
                              className="rounded bg-slate-900 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                            >
                              {confirmingId === s.receiptId ? 'Receiving...' : 'Confirm Receipt'}
                            </button>
                          )}
                          <button
                            onClick={() => onPrintGRN(s)}
                            title="Print Goods Receipt Note (GRN)"
                            className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register Incoming Shipment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Register Incoming Shipment
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Shipment Tracker Incoming Stock Entry Form
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Link to Purchase Order (Optional) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Receive Against Purchase Order (Optional)
                  </label>
                  <select
                    value={formData.purchaseOrderNumber}
                    onChange={(e) => handlePOSelect(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none"
                  >
                    <option value="">None (Independent Intake / Surplus)</option>
                    {purchaseOrders
                      .filter((p) => p.orderStatus !== 'Fully Received' && p.orderStatus !== 'Cancelled')
                      .map((p) => (
                        <option key={p.poNumber} value={p.poNumber}>
                          {p.poNumber} · {p.supplier} · {p.itemCode} ({p.quantityOrdered - p.quantityReceived} remaining)
                        </option>
                      ))}
                  </select>
                </div>

                {/* Tracking No */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Airway / Courier Tracking No. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DHL-948210334, UPS-1Z..."
                    value={formData.trackingNo}
                    onChange={(e) => setFormData({ ...formData, trackingNo: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                {/* Receiving Warehouse */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination Warehouse *
                  </label>
                  <select
                    value={formData.warehouse}
                    onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.warehouseCode} value={w.warehouseCode}>
                        {w.warehouseCode} · {w.location} ({w.warehouseName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Item Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Item Code *
                  </label>
                  <select
                    value={formData.itemCode}
                    onChange={(e) => {
                      const itemCode = e.target.value;
                      const prod = products.find((p) => p.itemCode === itemCode);
                      setFormData({
                        ...formData,
                        itemCode,
                        unitCost: prod?.defaultUnitCost || 0,
                        condition: prod?.condition || 'New in Box',
                      });
                    }}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none font-mono"
                  >
                    {products.map((p) => (
                      <option key={p.productId} value={p.itemCode}>
                        {p.itemCode} — {p.itemName} ({p.condition})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supplier */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Supplier or vendor name"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity Received *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantityReceived}
                    onChange={(e) => setFormData({ ...formData, quantityReceived: Number(e.target.value) })}
                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none"
                  />
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Physical Condition *
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as ProductCondition })}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none"
                  >
                    <option value="New in Box">New in Box</option>
                    <option value="New, No Box">New, No Box</option>
                    <option value="Open Box">Open Box</option>
                    <option value="Used">Used</option>
                    <option value="Tested">Tested</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                {/* Unit Cost */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Cost (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none"
                  />
                </div>

                {/* Serial Numbers (One per line) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Serial Numbers (Optional - one per line for serialized units)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="SN-SCH-9021&#10;SN-SCH-9022"
                    value={formData.serialNumbersText}
                    onChange={(e) => setFormData({ ...formData, serialNumbersText: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs font-mono text-slate-800 outline-none"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Inspection & Quality Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Pallet condition, seal intact, bin location..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Shipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
