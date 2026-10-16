import React from 'react';
import { X, Layers, Boxes, Barcode, History, Building2 } from 'lucide-react';
import { Product, ConsolidatedInventoryItem, WarehouseInventoryItem, StockMovement, SerialNumberRecord, Warehouse } from '../../types/erp';

interface ItemDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemCode: string | null;
  initialWarehouseFilter?: string;
  products: Product[];
  consolidatedInventory: ConsolidatedInventoryItem[];
  warehouseInventory: WarehouseInventoryItem[];
  stockMovements: StockMovement[];
  serialNumbers: SerialNumberRecord[];
  warehouses: Warehouse[];
}

export const ItemDrilldownModal: React.FC<ItemDrilldownModalProps> = ({
  isOpen,
  onClose,
  itemCode,
  initialWarehouseFilter,
  products,
  consolidatedInventory,
  warehouseInventory,
  stockMovements,
  serialNumbers,
  warehouses,
}) => {
  if (!isOpen || !itemCode) return null;

  const product = products.find((p) => p.itemCode === itemCode);
  const consolidated = consolidatedInventory.find((c) => c.itemCode === itemCode);
  const whItems = warehouseInventory.filter((w) => w.itemCode === itemCode);
  const movements = stockMovements.filter((m) => m.itemCode === itemCode);
  const serials = serialNumbers.filter((s) => s.itemCode === itemCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl rounded-lg bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-slate-900">
                {itemCode}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {product?.manufacturer}
              </span>
              <span className="text-xs font-semibold bg-slate-200 px-2 py-0.5 rounded text-slate-800">
                {product?.condition}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 line-clamp-1">
              {product?.itemName} — {product?.description}
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Warehouse Balances Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              <span>Current Stock by Warehouse (9 Hubs)</span>
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
              {warehouses.map((wh) => {
                const whItem = whItems.find((w) => w.warehouse === wh.warehouseCode);
                const stock = whItem?.currentStock || 0;
                return (
                  <div
                    key={wh.warehouseCode}
                    className={`rounded border p-2.5 text-center ${
                      stock > 0 ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-slate-500">{wh.warehouseCode}</div>
                    <div className="text-[10px] text-slate-400 truncate">{wh.location}</div>
                    <div className="mt-1 font-mono text-base font-bold text-slate-900 tabular-nums">
                      {stock}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Serialized Units List */}
          {serials.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Barcode className="h-4 w-4" />
                <span>Serialized Units Active ({serials.length})</span>
              </h3>
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-semibold uppercase">
                    <tr>
                      <th className="py-2 px-3">Serial Number</th>
                      <th className="py-2 px-3">Facility</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Condition</th>
                      <th className="py-2 px-3">Reference</th>
                      <th className="py-2 px-3 text-right">Last Movement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {serials.map((s) => (
                      <tr key={s.serialNumber} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-900">{s.serialNumber}</td>
                        <td className="py-2 px-3 text-slate-700">{s.warehouse}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{s.currentStatus}</td>
                        <td className="py-2 px-3 text-slate-600">{s.condition}</td>
                        <td className="py-2 px-3 text-slate-500">{s.receiptReference || s.issueReference || s.transferReference || '—'}</td>
                        <td className="py-2 px-3 text-right text-slate-500">
                          {new Date(s.lastMovementDate).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Underlying Transaction Movement History */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <History className="h-4 w-4" />
              <span>Immutable Stock Ledger History ({movements.length} transactions)</span>
            </h3>
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="py-2 px-3">Movement ID</th>
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Facility</th>
                    <th className="py-2 px-3 text-right">Quantity</th>
                    <th className="py-2 px-3">Doc Ref</th>
                    <th className="py-2 px-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {movements.map((m) => {
                    const isPositive = m.quantity > 0;
                    return (
                      <tr key={m.movementId} className="hover:bg-slate-50 font-mono">
                        <td className="py-2 px-3 font-bold text-slate-900">{m.movementId}</td>
                        <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                          {new Date(m.date).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                        </td>
                        <td className="py-2 px-3 font-sans font-medium text-slate-800">{m.movementType}</td>
                        <td className="py-2 px-3 font-sans font-semibold text-slate-800">{m.warehouse}</td>
                        <td className="py-2 px-3 text-right font-bold tabular-nums">
                          <span className={isPositive ? 'text-emerald-700' : 'text-slate-900'}>
                            {isPositive ? `+${m.quantity}` : m.quantity}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{m.referenceDocId}</td>
                        <td className="py-2 px-3 font-sans text-slate-600 truncate max-w-xs">{m.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
