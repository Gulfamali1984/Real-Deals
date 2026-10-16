import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  ArrowDownToLine,
  X,
} from 'lucide-react';
import { PurchaseOrder, Warehouse, Product, Supplier } from '../../types/erp';

interface PurchaseOrdersViewProps {
  orders: PurchaseOrder[];
  warehouses: Warehouse[];
  products: Product[];
  suppliers: Supplier[];
  onCreateOrder: (payload: any) => Promise<void>;
  onReceiveAgainstPO: (po: PurchaseOrder) => void;
  onPrintPO: (po: PurchaseOrder) => void;
}

export const PurchaseOrdersView: React.FC<PurchaseOrdersViewProps> = ({
  orders,
  warehouses,
  products,
  suppliers,
  onCreateOrder,
  onReceiveAgainstPO,
  onPrintPO,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [supplier, setSupplier] = useState(suppliers[0]?.supplierName || '');
  const [itemCode, setItemCode] = useState(products[0]?.itemCode || '');
  const [quantityOrdered, setQuantityOrdered] = useState(10);
  const [destinationWarehouse, setDestinationWarehouse] = useState('WH-001');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [notes, setNotes] = useState('');

  const selectedProduct = products.find((p) => p.itemCode === itemCode);
  const unitCost = selectedProduct?.defaultUnitCost || 0;
  const totalAmount = unitCost * quantityOrdered + 150; // incl estimated shipping

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreateOrder({
        supplier,
        itemCode,
        description: selectedProduct?.itemName || itemCode,
        quantityOrdered,
        destinationWarehouse,
        expectedDeliveryDate,
        unitCost,
        currency: 'USD',
        paymentTerms,
        notes,
      });
      setIsModalOpen(false);
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Purchase Orders Ledger
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              ({orders.length} orders)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Suppliers purchase orders tracking ordered vs received quantities. Supports multi-part delivery and partial receipts.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create Purchase Order</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="rounded border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">PO Number</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-3">Destination WH</th>
                <th className="py-3 px-3">Item Code & Description</th>
                <th className="py-3 px-2 text-right">Ordered</th>
                <th className="py-3 px-2 text-right text-emerald-800">Received</th>
                <th className="py-3 px-2 text-right text-amber-800">Outstanding</th>
                <th className="py-3 px-2.5 text-right">Unit Cost</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {orders.map((po) => {
                const outstanding = Math.max(0, po.quantityOrdered - po.quantityReceived);
                const isFullyReceived = po.orderStatus === 'Fully Received';
                const isPartiallyReceived = po.orderStatus === 'Partially Received';

                return (
                  <tr key={po.poNumber} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {po.poNumber}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(po.orderDate).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                      {po.supplier}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{po.destinationWarehouse}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-bold text-slate-900">{po.itemCode}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{po.description}</div>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {po.quantityOrdered}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-700 tabular-nums">
                      {po.quantityReceived}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-semibold text-amber-700 tabular-nums">
                      {outstanding}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                      ${po.unitCost.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {isFullyReceived ? (
                        <span className="text-xs font-semibold text-emerald-700">Fully Received</span>
                      ) : isPartiallyReceived ? (
                        <span className="text-xs font-semibold text-blue-700">Partially Received</span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-700">Ordered</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isFullyReceived && (
                          <button
                            onClick={() => onReceiveAgainstPO(po)}
                            className="rounded bg-slate-900 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-800 transition-colors"
                          >
                            Receive Stock
                          </button>
                        )}
                        <button
                          onClick={() => onPrintPO(po)}
                          title="Print Purchase Order Document"
                          className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Purchase Order */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">
                Create Formal Purchase Order
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier *
                  </label>
                  <select
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  >
                    {suppliers.map((s) => (
                      <option key={s.supplierId} value={s.supplierName}>
                        {s.supplierName} ({s.country} · Lead: {s.leadTime}d)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Item Code *
                  </label>
                  <select
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono text-slate-800 outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.productId} value={p.itemCode}>
                        {p.itemCode} — {p.itemName} (${p.defaultUnitCost})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity Ordered *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantityOrdered}
                    onChange={(e) => setQuantityOrdered(Number(e.target.value))}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs font-mono text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination Warehouse *
                  </label>
                  <select
                    value={destinationWarehouse}
                    onChange={(e) => setDestinationWarehouse(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.warehouseCode} value={w.warehouseCode}>
                        {w.warehouseCode} · {w.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  >
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Wire Prepayment">Wire Prepayment</option>
                    <option value="Letter of Credit">Letter of Credit</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Order Instructions / Shipping Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Air freight priority, include certificates of conformity..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="rounded bg-slate-50 p-2.5 border border-slate-200 text-xs flex justify-between items-center">
                <span>Total PO Amount (incl freight & tax):</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ${totalAmount.toLocaleString()} USD
                </span>
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
                  {isSubmitting ? 'Issuing...' : 'Issue Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
