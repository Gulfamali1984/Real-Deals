import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  X,
  FileText,
} from 'lucide-react';
import { WarehouseTransfer, Warehouse, Product, ProductCondition } from '../../types/erp';

interface WarehouseTransfersViewProps {
  transfers: WarehouseTransfer[];
  warehouses: Warehouse[];
  products: Product[];
  onCreateTransfer: (payload: any) => Promise<void>;
  onDispatchTransfer: (transferId: string) => Promise<void>;
  onReceiveTransfer: (transferId: string, discrepancyPayload: any) => Promise<void>;
  getAvailableStock: (warehouse: string, itemCode: string) => number;
}

export const WarehouseTransfersView: React.FC<WarehouseTransfersViewProps> = ({
  transfers,
  warehouses,
  products,
  onCreateTransfer,
  onDispatchTransfer,
  onReceiveTransfer,
  getAvailableStock,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receivingTransfer, setReceivingTransfer] = useState<WarehouseTransfer | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  // Form state
  const [sourceWarehouse, setSourceWarehouse] = useState('WH-001');
  const [destinationWarehouse, setDestinationWarehouse] = useState('WH-002');
  const [itemCode, setItemCode] = useState(products[0]?.itemCode || '');
  const [quantity, setQuantity] = useState(1);
  const [carrier, setCarrier] = useState('DHL Freight');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Discrepancy modal state
  const [shortageQty, setShortageQty] = useState(0);
  const [damagedQty, setDamagedQty] = useState(0);
  const [discrepancyNotes, setDiscrepancyNotes] = useState('');

  const availableInSource = getAvailableStock(sourceWarehouse, itemCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (sourceWarehouse === destinationWarehouse) {
      setErrorMsg('Source and Destination facilities cannot be identical.');
      return;
    }

    if (quantity > availableInSource) {
      setErrorMsg(`Insufficient stock in ${sourceWarehouse}. Requested: ${quantity}, Available: ${availableInSource}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateTransfer({
        sourceWarehouse,
        destinationWarehouse,
        itemCode,
        quantity,
        carrier,
        trackingNumber,
        notes,
      });
      setIsModalOpen(false);
      setQuantity(1);
      setTrackingNumber('');
      setNotes('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Transfer initiation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispatch = async (id: string) => {
    setActionId(id);
    try {
      await onDispatchTransfer(id);
    } finally {
      setActionId(null);
    }
  };

  const handleReceiveConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingTransfer) return;
    setIsSubmitting(true);
    try {
      await onReceiveTransfer(receivingTransfer.transferId, {
        shortageQuantity: shortageQty,
        damagedQuantity: damagedQty,
        discrepancyNotes,
      });
      setReceivingTransfer(null);
      setShortageQty(0);
      setDamagedQty(0);
      setDiscrepancyNotes('');
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
              Inter-Warehouse Transfers & Transit Tracker
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              ({transfers.length} transfers)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Paired movements between facilities: source stock is decremented upon dispatch, placed in transit, and added to destination only on verified receipt.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Initiate Warehouse Transfer</span>
        </button>
      </div>

      {/* Transfers Table */}
      <div className="rounded border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Transfer ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Route (From → To)</th>
                <th className="py-3 px-3">Item Code & Condition</th>
                <th className="py-3 px-2 text-right">Qty</th>
                <th className="py-3 px-3">Carrier / Tracking</th>
                <th className="py-3 px-3 text-center">Transfer Status</th>
                <th className="py-3 px-3">Discrepancy</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No inter-warehouse transfers recorded.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => {
                  const isDraft = t.transferStatus === 'Draft';
                  const isInTransit = t.transferStatus === 'In Transit';
                  const isReceived = t.transferStatus === 'Received';
                  const hasDiscrepancy = t.shortageQuantity > 0 || t.damagedQuantity > 0;

                  return (
                    <tr key={t.transferId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {t.transferId}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(t.dateInitiated).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <span>{t.sourceWarehouse}</span>
                          <span className="text-slate-400">→</span>
                          <span>{t.destinationWarehouse}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-slate-900">{t.itemCode}</div>
                        <div className="text-[10px] text-slate-400">{t.condition}</div>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {t.quantity}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800">{t.carrier || 'Internal Fleet'}</div>
                        {t.trackingNumber && (
                          <div className="text-[10px] text-slate-500 font-mono">{t.trackingNumber}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isReceived ? (
                          <span className="text-xs font-semibold text-emerald-700">Received</span>
                        ) : isInTransit ? (
                          <span className="text-xs font-semibold text-blue-700">In Transit</span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-600">Draft</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {hasDiscrepancy ? (
                          <div className="text-[11px] font-semibold text-red-600">
                            {t.shortageQuantity > 0 && `-${t.shortageQuantity} Short `}
                            {t.damagedQuantity > 0 && `(${t.damagedQuantity} Damaged)`}
                          </div>
                        ) : isReceived ? (
                          <span className="text-[11px] text-emerald-700 font-medium">Reconciled 100%</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {isDraft && (
                          <button
                            onClick={() => handleDispatch(t.transferId)}
                            disabled={actionId === t.transferId}
                            className="rounded bg-slate-900 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-800 transition-colors"
                          >
                            Dispatch → Transit
                          </button>
                        )}
                        {isInTransit && (
                          <button
                            onClick={() => setReceivingTransfer(t)}
                            className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Confirm Receipt
                          </button>
                        )}
                        {isReceived && (
                          <span className="text-[11px] text-slate-400">Closed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Initiate Transfer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">
                Initiate Inter-Warehouse Transfer
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {errorMsg && (
                <div className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Source Warehouse *
                  </label>
                  <select
                    value={sourceWarehouse}
                    onChange={(e) => setSourceWarehouse(e.target.value)}
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

                <div className="col-span-2">
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
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">Quantity *</label>
                    <span className="text-[11px] font-mono text-emerald-700">
                      Available: {availableInSource} in {sourceWarehouse}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={availableInSource || 1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs font-mono text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Carrier</label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Freight Tracking Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FDX-FREIGHT-88210"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
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
                  disabled={isSubmitting || availableInSource <= 0}
                  className="rounded bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Transfer Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Receipt at Destination & Log Discrepancies */}
      {receivingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Receive Transfer: {receivingTransfer.transferId}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm receipt at {receivingTransfer.destinationWarehouse}
                </p>
              </div>
              <button onClick={() => setReceivingTransfer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveConfirm} className="p-5 space-y-4">
              <div className="rounded bg-slate-50 p-3 border border-slate-200 text-xs space-y-1">
                <div><strong>Item:</strong> {receivingTransfer.itemCode}</div>
                <div><strong>Expected Quantity:</strong> {receivingTransfer.quantity} units</div>
                <div><strong>From:</strong> {receivingTransfer.sourceWarehouse}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shortage Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={receivingTransfer.quantity}
                    value={shortageQty}
                    onChange={(e) => setShortageQty(Number(e.target.value))}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs font-mono text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Damaged Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={receivingTransfer.quantity}
                    value={damagedQty}
                    onChange={(e) => setDamagedQty(Number(e.target.value))}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs font-mono text-slate-800 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discrepancy / Inspection Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Box crushed in transit, missing 1 seal..."
                    value={discrepancyNotes}
                    onChange={(e) => setDiscrepancyNotes(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="text-xs text-slate-600">
                Net stock added to {receivingTransfer.destinationWarehouse}:{' '}
                <strong className="font-mono text-slate-900">
                  {Math.max(0, receivingTransfer.quantity - shortageQty - damagedQty)}
                </strong>{' '}
                units.
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setReceivingTransfer(null)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Receiving...' : 'Confirm Receipt & Update Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
