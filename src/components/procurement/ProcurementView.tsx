import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  Clock,
  Building2,
  DollarSign,
  X,
  FileCheck,
} from 'lucide-react';
import { PurchaseRequest, Warehouse, Product, Supplier } from '../../types/erp';

interface ProcurementViewProps {
  requests: PurchaseRequest[];
  warehouses: Warehouse[];
  products: Product[];
  suppliers: Supplier[];
  onCreateRequest: (payload: any) => Promise<void>;
  onApproveRequest: (requestId: string) => Promise<void>;
}

export const ProcurementView: React.FC<ProcurementViewProps> = ({
  requests,
  warehouses,
  products,
  suppliers,
  onCreateRequest,
  onApproveRequest,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Form
  const [itemCode, setItemCode] = useState(products[0]?.itemCode || '');
  const [quantity, setQuantity] = useState(5);
  const [preferredSupplier, setPreferredSupplier] = useState(suppliers[0]?.supplierName || '');
  const [destinationWarehouse, setDestinationWarehouse] = useState('WH-001');
  const [requiredDate, setRequiredDate] = useState('');
  const [justification, setJustification] = useState('');

  const selectedProduct = products.find((p) => p.itemCode === itemCode);
  const estimatedCost = (selectedProduct?.defaultUnitCost || 0) * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreateRequest({
        itemCode,
        description: selectedProduct?.itemName || itemCode,
        quantity,
        preferredSupplier,
        destinationWarehouse,
        requiredDate,
        estimatedCost,
        justification,
      });
      setIsModalOpen(false);
      setJustification('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await onApproveRequest(id);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Procurement & Requisition Management
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              ({requests.length} requests)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal purchase requisitions with approval authorization. Approved requisitions automatically generate formal Purchase Orders.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Purchase Request</span>
        </button>
      </div>

      {/* Requests Table */}
      <div className="rounded border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Request ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Requested By</th>
                <th className="py-3 px-3">Item Code & Description</th>
                <th className="py-3 px-2 text-right">Qty</th>
                <th className="py-3 px-3">Destination WH</th>
                <th className="py-3 px-3">Preferred Supplier</th>
                <th className="py-3 px-3 text-right">Est. Cost (USD)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {requests.map((r) => {
                const isApproved = r.approvalStatus === 'Approved';
                return (
                  <tr key={r.requestId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {r.requestId}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(r.requestDate).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{r.requestedBy}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-bold text-slate-900">{r.itemCode}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{r.description}</div>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {r.quantity}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{r.destinationWarehouse}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.preferredSupplier}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      ${r.estimatedCost.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {isApproved ? (
                        <span className="text-xs font-semibold text-emerald-700">Approved</span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-700">Pending Review</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {!isApproved ? (
                        <button
                          onClick={() => handleApprove(r.requestId)}
                          disabled={approvingId === r.requestId}
                          className="rounded bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                        >
                          {approvingId === r.requestId ? 'Approving...' : 'Approve & Create PO'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">PO Generated</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Purchase Request */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">
                New Purchase Requisition
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
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
                    Requisition Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
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
                    Preferred Supplier
                  </label>
                  <select
                    value={preferredSupplier}
                    onChange={(e) => setPreferredSupplier(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  >
                    {suppliers.map((s) => (
                      <option key={s.supplierId} value={s.supplierName}>
                        {s.supplierName} ({s.country})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Required Delivery Date
                  </label>
                  <input
                    type="date"
                    required
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business Justification *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Safety stock replenishment, urgent customer project quote..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="rounded bg-slate-50 p-2.5 border border-slate-200 text-xs flex justify-between items-center">
                <span>Estimated Requisition Cost:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ${estimatedCost.toLocaleString()} USD
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
                  {isSubmitting ? 'Submitting...' : 'Submit Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
