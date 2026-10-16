import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  AlertTriangle,
  Boxes,
  HelpCircle,
  RefreshCw,
  Building2,
  Calendar,
} from 'lucide-react';
import { WarehouseInventoryItem, Warehouse, Product } from '../../types/erp';

interface WarehouseInventoryViewProps {
  inventory: WarehouseInventoryItem[];
  warehouses: Warehouse[];
  products: Product[];
  selectedWarehouse: string;
  onSelectWarehouse: (wh: string) => void;
  onOpenLedger: (itemCode: string, warehouse: string) => void;
  onReconcile: () => void;
  isReconciling: boolean;
}

export const WarehouseInventoryView: React.FC<WarehouseInventoryViewProps> = ({
  inventory,
  warehouses,
  products,
  selectedWarehouse,
  onSelectWarehouse,
  onOpenLedger,
  onReconcile,
  isReconciling,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [reorderFilter, setReorderFilter] = useState('ALL');

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      if (selectedWarehouse !== 'ALL' && item.warehouse !== selectedWarehouse) return false;
      if (reorderFilter !== 'ALL' && item.reorderStatus !== reorderFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.itemCode.toLowerCase().includes(q);
        const prod = products.find((p) => p.itemCode === item.itemCode);
        const matchName = prod?.itemName.toLowerCase().includes(q);
        if (!matchCode && !matchName) return false;
      }
      return true;
    });
  }, [inventory, selectedWarehouse, reorderFilter, searchQuery, products]);

  const activeWarehouse = warehouses.find((w) => w.warehouseCode === selectedWarehouse);

  const exportCSV = () => {
    const headers = [
      'Warehouse',
      'Item Code',
      'Item Name',
      'Opening Stock',
      'Total Incoming',
      'Total Outgoing',
      'Adjustment',
      'Calculated Current Stock',
      'Out Date',
      'Reorder Status',
    ];

    const rows = filteredInventory.map((i) => {
      const prod = products.find((p) => p.itemCode === i.itemCode);
      return [
        i.warehouse,
        i.itemCode,
        `"${(prod?.itemName || '').replace(/"/g, '""')}"`,
        i.openingStock,
        i.totalIncoming,
        i.totalOutgoing,
        i.adjustment,
        i.currentStock,
        i.outDate || 'N/A',
        i.reorderStatus,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `warehouse_inventory_${selectedWarehouse}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Title & Warehouse Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Warehouse Inventory Ledger
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              ({filteredInventory.length} item lines)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual facility stock calculated automatically from immutable movement events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReconcile}
            disabled={isReconciling}
            className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isReconciling ? 'animate-spin' : ''}`} />
            <span>Reconcile Stock</span>
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Authoritative Business Logic Rule Banner (Section 10) */}
      <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-slate-500 shrink-0" />
          <span className="font-semibold text-slate-800">Inventory Calculation Invariant:</span>
          <code className="bg-white border border-slate-200 px-2 py-0.5 rounded font-mono text-[11px] text-slate-900">
            Current Stock = Opening + Confirmed Incoming + Positive Adjustments - Confirmed Outgoing - Negative Adjustments
          </code>
        </div>
        <div className="text-[11px] text-slate-500">
          Direct manual override of Current Stock is prohibited by enterprise policy.
        </div>
      </div>

      {/* Filter and Scope Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Facility Filter */}
          <div className="flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedWarehouse}
              onChange={(e) => onSelectWarehouse(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">All 9 Facilities (Aggregated)</option>
              {warehouses.map((wh) => (
                <option key={wh.warehouseCode} value={wh.warehouseCode}>
                  {wh.warehouseCode} · {wh.warehouseName} ({wh.location} - {wh.manager})
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search item code or part name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Reorder Status Filter */}
          <select
            value={reorderFilter}
            onChange={(e) => setReorderFilter(e.target.value)}
            className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none"
          >
            <option value="ALL">All Reorder Statuses</option>
            <option value="Normal">Normal Stock</option>
            <option value="Low Stock">Low Stock Alert</option>
            <option value="Out of Stock">Out of Stock Alert</option>
          </select>
        </div>

        {activeWarehouse && (
          <div className="text-xs text-slate-500">
            Manager: <span className="font-semibold text-slate-800">{activeWarehouse.manager || 'Unassigned'}</span> · {activeWarehouse.location}
          </div>
        )}
      </div>

      {/* Main Warehouse Inventory Table */}
      <div className="rounded border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Warehouse</th>
                <th className="py-3 px-3">Item Code & Description</th>
                <th className="py-3 px-2.5 text-right">Opening</th>
                <th className="py-3 px-2.5 text-right text-emerald-800">+ Incoming</th>
                <th className="py-3 px-2.5 text-right text-slate-900">- Outgoing</th>
                <th className="py-3 px-2.5 text-right text-blue-800">± Adjust</th>
                <th className="py-3 px-3 text-right bg-slate-100/70 font-bold text-slate-900">
                  = Current Stock
                </th>
                <th className="py-3 px-3">Out Date</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No warehouse inventory records match this filter.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const prod = products.find((p) => p.itemCode === item.itemCode);
                  const isLow = item.reorderStatus === 'Low Stock';
                  const isOut = item.reorderStatus === 'Out of Stock';

                  return (
                    <tr key={`${item.warehouse}__${item.itemCode}`} className="hover:bg-slate-50/80 transition-colors">
                      {/* Warehouse Code */}
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        <div>{item.warehouse}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {warehouses.find((w) => w.warehouseCode === item.warehouse)?.location || ''}
                        </div>
                      </td>

                      {/* Item Code & Name */}
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-slate-900">{item.itemCode}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{prod?.itemName || '—'}</div>
                      </td>

                      {/* Opening Stock */}
                      <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-slate-600">
                        {item.openingStock}
                      </td>

                      {/* Total Incoming */}
                      <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-emerald-700 font-medium">
                        +{item.totalIncoming}
                      </td>

                      {/* Total Outgoing */}
                      <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-slate-900">
                        -{item.totalOutgoing}
                      </td>

                      {/* Adjustment */}
                      <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-blue-700">
                        {item.adjustment > 0 ? `+${item.adjustment}` : item.adjustment}
                      </td>

                      {/* Calculated Current Stock */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50/60 tabular-nums">
                        {item.currentStock}
                      </td>

                      {/* Out Date (Latest Issue) */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {item.outDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span>{item.outDate}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">No issues</span>
                        )}
                      </td>

                      {/* Reorder Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isOut ? (
                          <span className="text-xs font-semibold text-red-700">Out of Stock</span>
                        ) : isLow ? (
                          <span className="text-xs font-semibold text-amber-700">Low Stock</span>
                        ) : (
                          <span className="text-xs text-slate-600 font-medium">Normal</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => onOpenLedger(item.itemCode, item.warehouse)}
                          className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          View Ledger
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
