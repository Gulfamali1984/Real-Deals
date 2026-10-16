import React, { useState } from 'react';
import {
  Building2,
  Users,
  MapPin,
  Boxes,
  Edit2,
  CheckCircle2,
  X,
  Search,
} from 'lucide-react';
import { Warehouse, WarehouseInventoryItem } from '../../types/erp';

interface WarehouseManagementViewProps {
  warehouses: Warehouse[];
  inventory: WarehouseInventoryItem[];
  onUpdateWarehouse: (code: string, updates: Partial<Warehouse>) => Promise<void>;
  onSelectWarehouse: (code: string) => void;
}

export const WarehouseManagementView: React.FC<WarehouseManagementViewProps> = ({
  warehouses,
  inventory,
  onUpdateWarehouse,
  onSelectWarehouse,
}) => {
  const [editingWh, setEditingWh] = useState<Warehouse | null>(null);
  const [managerInput, setManagerInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (wh: Warehouse) => {
    setEditingWh(wh);
    setManagerInput(wh.manager || '');
    setAddressInput(wh.address || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWh) return;
    setIsSaving(true);
    try {
      await onUpdateWarehouse(editingWh.warehouseCode, {
        manager: managerInput.trim(),
        address: addressInput.trim(),
      });
      setEditingWh(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Multi-Warehouse Facilities Master (9 Active Hubs)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Preserves standardized facility codes (WH-001 through WH-009) across USA, UAE, Pakistan, and Saudi Arabia.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.map((wh) => {
          const whInventory = inventory.filter((i) => i.warehouse === wh.warehouseCode);
          const totalUnits = whInventory.reduce((acc, i) => acc + i.currentStock, 0);
          const activeSkus = whInventory.filter((i) => i.currentStock > 0).length;

          return (
            <div
              key={wh.warehouseCode}
              className="rounded-lg border border-slate-200 bg-white p-5 flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {wh.warehouseCode}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">{wh.location}</span>
                  </div>
                  <button
                    onClick={() => startEdit(wh)}
                    className="text-slate-400 hover:text-slate-700 p-1"
                    title="Edit Facility Details"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-3">
                  <h3 className="text-sm font-bold text-slate-900">{wh.warehouseName}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{wh.address || 'Address pending verification'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                    <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Manager: <strong className="text-slate-900">{wh.manager || 'Unassigned'}</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                    {totalUnits}
                  </span>
                  <span className="text-[11px] text-slate-500">units in stock</span>
                  <span className="text-[11px] text-slate-400 ml-1">({activeSkus} SKUs)</span>
                </div>

                <button
                  onClick={() => onSelectWarehouse(wh.warehouseCode)}
                  className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  View Stock →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Warehouse Modal */}
      {editingWh && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-bold text-slate-900">
                Edit Warehouse: {editingWh.warehouseCode} ({editingWh.warehouseName})
              </h3>
              <button
                onClick={() => setEditingWh(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Facility Manager Name
                </label>
                <input
                  type="text"
                  required
                  value={managerInput}
                  onChange={(e) => setManagerInput(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Facility Physical Address
                </label>
                <textarea
                  rows={2}
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingWh(null)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
