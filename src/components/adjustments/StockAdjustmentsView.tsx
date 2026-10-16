import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  FileCheck,
} from 'lucide-react';
import { StockAdjustment, Warehouse, Product, AdjustmentType } from '../../types/erp';

interface StockAdjustmentsViewProps {
  adjustments: StockAdjustment[];
  warehouses: Warehouse[];
  products: Product[];
  onRequestAdjustment: (payload: any) => Promise<void>;
  onApproveAdjustment: (adjustmentId: string) => Promise<void>;
}

export const StockAdjustmentsView: React.FC<StockAdjustmentsViewProps> = ({
  adjustments,
  warehouses,
  products,
  onRequestAdjustment,
  onApproveAdjustment,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Form state
  const [warehouse, setWarehouse] = useState('WH-001');
  const [itemCode, setItemCode] = useState(products[0]?.itemCode || '');
  const [serialNumber, setSerialNumber] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('Physical Count Correction');
  const [quantityChange, setQuantityChange] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onRequestAdjustment({
        warehouse,
        itemCode,
        serialNumber: serialNumber.trim() || undefined,
        adjustmentType,
        quantityChange: Number(quantityChange),
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });
      setIsModalOpen(false);
      setReason('');
      setNotes('');
      setQuantityChange(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await onApproveAdjustment(id);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Controlled Stock Adjustments & Reconciliation
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              ({adjustments.length} requests)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-protected adjustments for cycle count variances, damaged units, or found inventory. Approved requests update the ledger immediately. Historical movements are never erased.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Request Stock Adjustment</span>
        </button>
      </div>

      {/* Adjustments Table */}
      <div className="rounded border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Adjustment ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Warehouse</th>
                <th className="py-3 px-3">Item Code</th>
                <th className="py-3 px-3">Serial No</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-2.5 text-right">Qty Change</th>
                <th className="py-3 px-3">Reason</th>
                <th className="py-3 px-3">Requested By</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {adjustments.map((a) => {
                const isApproved = a.approvalStatus === 'Approved';
                const isPositive = a.quantityChange > 0;

                return (
                  <tr key={a.adjustmentId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {a.adjustmentId}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(a.date).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      {a.warehouse}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {a.itemCode}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {a.serialNumber || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                      {a.adjustmentType}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono font-bold tabular-nums">
                      <span className={isPositive ? 'text-emerald-700' : 'text-red-600'}>
                        {isPositive ? `+${a.quantityChange}` : a.quantityChange}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={a.reason}>
                      {a.reason}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{a.requestedBy}</td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {isApproved ? (
                        <span className="text-xs font-semibold text-emerald-700">Approved</span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-700">Pending Approval</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {!isApproved ? (
                        <button
                          onClick={() => handleApprove(a.adjustmentId)}
                          disabled={approvingId === a.adjustmentId}
                          className="rounded bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                        >
                          {approvingId === a.adjustmentId ? 'Approving...' : 'Approve & Post Ledger'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Approved by {a.approvedBy?.split(' ')[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Request Stock Adjustment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">
                Request Controlled Stock Adjustment
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Warehouse *
                  </label>
                  <select
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
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
                    Item Code *
                  </label>
                  <select
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono text-slate-800 outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.productId} value={p.itemCode}>
                        {p.itemCode} — {p.itemName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adjustment Type *
                  </label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as AdjustmentType)}
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  >
                    <option value="Physical Count Correction">Physical Count Correction</option>
                    <option value="Damaged Stock">Damaged Stock</option>
                    <option value="Missing Stock">Missing Stock</option>
                    <option value="Found Stock">Found Stock</option>
                    <option value="Data Migration Correction">Data Migration Correction</option>
                    <option value="Other Authorized Adjustment">Other Authorized Adjustment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity Change (Positive or Negative) *
                  </label>
                  <input
                    type="number"
                    required
                    value={quantityChange}
                    onChange={(e) => setQuantityChange(Number(e.target.value))}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs font-mono text-slate-800 outline-none"
                    placeholder="e.g. +2 or -1"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Serial Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SN-SCH-4011"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs font-mono text-slate-800 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mandatory Audit Justification / Reason *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Discovered surplus unit during quarterly bin cycle count in Bin B-12..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
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
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
