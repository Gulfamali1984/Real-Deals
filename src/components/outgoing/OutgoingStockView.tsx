import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Printer,
  FileText,
  AlertTriangle,
  ArrowUpFromLine,
  Building2,
  CheckCircle2,
  PackageCheck,
  X,
} from 'lucide-react';
import {
  OutgoingShipment,
  Warehouse,
  Product,
  Customer,
  SerialNumberRecord,
  ProductCondition,
} from '../../types/erp';

interface OutgoingStockViewProps {
  shipments: OutgoingShipment[];
  warehouses: Warehouse[];
  products: Product[];
  customers: Customer[];
  serialNumbers: SerialNumberRecord[];
  onCreateIssue: (payload: any) => Promise<void>;
  onConfirmDispatch: (issueId: string) => Promise<void>;
  onPrintDispatchNote: (issue: OutgoingShipment) => void;
  selectedWarehouseFilter: string;
  getAvailableStock: (warehouse: string, itemCode: string) => number;
}

export const OutgoingStockView: React.FC<OutgoingStockViewProps> = ({
  shipments,
  warehouses,
  products,
  customers,
  serialNumbers,
  onCreateIssue,
  onConfirmDispatch,
  onPrintDispatchNote,
  selectedWarehouseFilter,
  getAvailableStock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    itemCode: products[0]?.itemCode || '',
    warehouse: warehouses[0]?.warehouseCode || 'WH-001',
    customer: customers[0]?.customerName || '',
    quantityIssued: 1,
    po: '',
    salesOrderNumber: '',
    trackingNo: '',
    condition: 'New in Box' as ProductCondition,
    selectedSerials: [] as string[],
    notes: '',
  });

  const availableInSelectedWarehouse = useMemo(() => {
    return getAvailableStock(formData.warehouse, formData.itemCode);
  }, [formData.warehouse, formData.itemCode, getAvailableStock]);

  // Available serial numbers in this specific warehouse for this item code
  const availableSerials = useMemo(() => {
    return serialNumbers.filter(
      (s) =>
        s.itemCode === formData.itemCode &&
        s.warehouse === formData.warehouse &&
        s.currentStatus === 'Available'
    );
  }, [serialNumbers, formData.itemCode, formData.warehouse]);

  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      if (selectedWarehouseFilter !== 'ALL' && s.warehouse !== selectedWarehouseFilter) return false;
      if (statusFilter !== 'ALL' && s.shipmentStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTracking = (s.trackingNo || '').toLowerCase().includes(q);
        const matchCode = s.itemCode.toLowerCase().includes(q);
        const matchCustomer = s.customer.toLowerCase().includes(q);
        const matchPO = (s.po || '').toLowerCase().includes(q);
        const matchSO = (s.salesOrderNumber || '').toLowerCase().includes(q);
        const matchSerial = (s.serialNumber || '').toLowerCase().includes(q);
        if (!matchTracking && !matchCode && !matchCustomer && !matchPO && !matchSO && !matchSerial) return false;
      }
      return true;
    });
  }, [shipments, selectedWarehouseFilter, statusFilter, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStockError(null);

    // Business Rule Check: Negative stock prevention
    if (formData.quantityIssued > availableInSelectedWarehouse) {
      setStockError(
        `Insufficient physical stock in warehouse ${formData.warehouse}. Requested: ${formData.quantityIssued}, Available: ${availableInSelectedWarehouse}. Negative stock is strictly prevented by ERP policy.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateIssue({
        ...formData,
        serialNumbers: formData.selectedSerials,
        serialNumber: formData.selectedSerials[0] || undefined,
      });

      setIsModalOpen(false);
      setFormData({
        itemCode: products[0]?.itemCode || '',
        warehouse: warehouses[0]?.warehouseCode || 'WH-001',
        customer: customers[0]?.customerName || '',
        quantityIssued: 1,
        po: '',
        salesOrderNumber: '',
        trackingNo: '',
        condition: 'New in Box',
        selectedSerials: [],
        notes: '',
      });
    } catch (err: any) {
      setStockError(err?.message || 'Failed to create outgoing shipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispatch = async (issueId: string) => {
    setDispatchingId(issueId);
    try {
      await onConfirmDispatch(issueId);
    } catch (err: any) {
      alert(err.message || 'Dispatch failed');
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Shipment Tracker: Outgoing Stock
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              ({filteredShipments.length} dispatches)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Validate warehouse inventory, reserve units, and dispatch to customers worldwide. Generates official Packing Lists & Dispatch Notes.
          </p>
        </div>

        <button
          onClick={() => {
            setStockError(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create Outgoing Shipment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tracking #, customer, PO, sales order, item code..."
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
            <option value="ALL">All Shipment Statuses</option>
            <option value="Draft">Draft (Awaiting Pick & Pack)</option>
            <option value="Reserved">Reserved Stock</option>
            <option value="Dispatched">Dispatched (Inventory Deducted)</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800 font-mono tabular-nums">{filteredShipments.length}</span> records
        </div>
      </div>

      {/* Table Name: Shipment Tracker Outgoing Stock (Section 7) */}
      <div className="rounded border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Issue ID</th>
                <th className="py-3 px-3">Date Issued</th>
                <th className="py-3 px-3">Item Code & Name</th>
                <th className="py-3 px-2.5">Tracking No.</th>
                <th className="py-3 px-2.5">Source WH</th>
                <th className="py-3 px-3">Customer / Consignee</th>
                <th className="py-3 px-2.5 text-right">Qty Issued</th>
                <th className="py-3 px-2.5">Condition</th>
                <th className="py-3 px-2.5">PO / Sales Order</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No outgoing shipment records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredShipments.map((s) => {
                  const isDispatched = s.shipmentStatus === 'Dispatched' || s.shipmentStatus === 'Delivered';
                  return (
                    <tr key={s.issueId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {s.issueId}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(s.dateIssued).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-slate-900">{s.itemCode}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{s.itemName}</div>
                      </td>
                      <td className="py-2.5 px-2.5 font-mono text-slate-800 whitespace-nowrap">
                        {s.trackingNo}
                      </td>
                      <td className="py-2.5 px-2.5 font-semibold text-slate-800 whitespace-nowrap">
                        {s.warehouse}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-900 line-clamp-1">{s.customer}</div>
                        {s.serialNumber && (
                          <div className="text-[10px] text-slate-400 font-mono">SN: {s.serialNumber}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {s.quantityIssued}
                      </td>
                      <td className="py-2.5 px-2.5 whitespace-nowrap">
                        <span className="text-slate-700 font-medium">{s.condition}</span>
                      </td>
                      <td className="py-2.5 px-2.5 whitespace-nowrap">
                        <div className="text-slate-700 font-medium">{s.po || '—'}</div>
                        {s.salesOrderNumber && (
                          <div className="text-[10px] text-slate-500 font-mono">SO: {s.salesOrderNumber}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isDispatched ? (
                          <span className="text-xs font-semibold text-slate-800">Dispatched</span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-700">Draft Pick</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isDispatched && (
                            <button
                              onClick={() => handleDispatch(s.issueId)}
                              disabled={dispatchingId === s.issueId}
                              className="rounded bg-slate-900 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                            >
                              {dispatchingId === s.issueId ? 'Deducting...' : 'Confirm Dispatch'}
                            </button>
                          )}
                          <button
                            onClick={() => onPrintDispatchNote(s)}
                            title="Print Packing List & Dispatch Note"
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

      {/* Modal: Create Outgoing Shipment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Create Outgoing Shipment
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Shipment Tracker Outgoing Stock Entry Form
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
              {stockError && (
                <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{stockError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Source Warehouse */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Source Warehouse *
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

                {/* Customer */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer / Destination *
                  </label>
                  <select
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none"
                  >
                    {customers.map((c) => (
                      <option key={c.customerId} value={c.customerName}>
                        {c.customerName} ({c.country})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Item Code */}
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
                        condition: prod?.condition || 'New in Box',
                        selectedSerials: [],
                      });
                    }}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none font-mono"
                  >
                    {products.map((p) => (
                      <option key={p.productId} value={p.itemCode}>
                        {p.itemCode} — {p.itemName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity and Availability Check */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Quantity Issued *
                    </label>
                    <span
                      className={`text-[11px] font-mono font-medium ${
                        availableInSelectedWarehouse > 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      Available: {availableInSelectedWarehouse} in {formData.warehouse}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={availableInSelectedWarehouse || 1}
                    required
                    value={formData.quantityIssued}
                    onChange={(e) => setFormData({ ...formData, quantityIssued: Number(e.target.value) })}
                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none"
                  />
                </div>

                {/* Customer PO */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer PO Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RAD-PO-4482"
                    value={formData.po}
                    onChange={(e) => setFormData({ ...formData, po: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                {/* Sales Order Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sales Order # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SO-2026-088"
                    value={formData.salesOrderNumber}
                    onChange={(e) => setFormData({ ...formData, salesOrderNumber: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                {/* Tracking Number */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Carrier Tracking Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPS-1Z9999999999, FedEx-882104"
                    value={formData.trackingNo}
                    onChange={(e) => setFormData({ ...formData, trackingNo: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                {/* Serial Numbers Available in Source Warehouse */}
                {availableSerials.length > 0 && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assign Serial Numbers from {formData.warehouse} (Select matching units)
                    </label>
                    <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded bg-slate-50 max-h-24 overflow-y-auto">
                      {availableSerials.map((s) => {
                        const isSelected = formData.selectedSerials.includes(s.serialNumber);
                        return (
                          <button
                            type="button"
                            key={s.serialNumber}
                            onClick={() => {
                              if (isSelected) {
                                setFormData({
                                  ...formData,
                                  selectedSerials: formData.selectedSerials.filter((x) => x !== s.serialNumber),
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  selectedSerials: [...formData.selectedSerials, s.serialNumber],
                                });
                              }
                            }}
                            className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            {s.serialNumber} ({s.condition})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dispatch Notes & Packaging Instructions
                  </label>
                  <input
                    type="text"
                    placeholder="Courier instructions, pallet packing, cert of conformity..."
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
                  disabled={isSubmitting || availableInSelectedWarehouse <= 0}
                  className="rounded bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Outgoing Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
