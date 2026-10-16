import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Filter,
  Layers,
  ArrowUpDown,
  ExternalLink,
  Info,
  X,
} from 'lucide-react';
import { ConsolidatedInventoryItem, ProductCondition } from '../../types/erp';

interface ConsolidatedInventoryViewProps {
  inventory: ConsolidatedInventoryItem[];
  onOpenItemDrilldown: (itemCode: string, warehouseCode?: string) => void;
}

export const ConsolidatedInventoryView: React.FC<ConsolidatedInventoryViewProps> = ({
  inventory,
  onOpenItemDrilldown,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [conditionFilter, setConditionFilter] = useState('ALL');
  const [manufacturerFilter, setManufacturerFilter] = useState('ALL');
  const [sortField, setSortField] = useState<keyof ConsolidatedInventoryItem>('totalCompanyStock');
  const [sortAsc, setSortAsc] = useState(false);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return inventory
      .filter((item) => {
        if (conditionFilter !== 'ALL' && item.condition !== conditionFilter) return false;
        if (manufacturerFilter !== 'ALL' && item.manufacturer !== manufacturerFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = item.itemCode.toLowerCase().includes(q);
          const matchStd = item.standardizedItemCode.toLowerCase().includes(q);
          const matchDesc = item.itemDescription.toLowerCase().includes(q);
          const matchMfg = item.manufacturer.toLowerCase().includes(q);
          if (!matchCode && !matchStd && !matchDesc && !matchMfg) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [inventory, searchQuery, conditionFilter, manufacturerFilter, sortField, sortAsc]);

  const uniqueManufacturers = useMemo(() => {
    const set = new Set(inventory.map((i) => i.manufacturer).filter(Boolean));
    return Array.from(set);
  }, [inventory]);

  const handleSort = (field: keyof ConsolidatedInventoryItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      'Item Code',
      'Standardized Code',
      'Description',
      'Manufacturer',
      'Condition',
      'Unit Cost (USD)',
      'Total Company Stock',
      'Available Stock',
      'Reserved Stock',
      'Stock in Transit',
      'TLS',
      'TOLL',
      'BFLO',
      'NMK',
      'PAK',
      'KSA',
      'SNT',
      'USA',
      'Ajman',
      'Last Updated',
    ];

    const rows = filteredItems.map((i) => [
      i.itemCode,
      i.standardizedItemCode,
      `"${i.itemDescription.replace(/"/g, '""')}"`,
      i.manufacturer,
      i.condition,
      i.unitCost,
      i.totalCompanyStock,
      i.availableStock,
      i.reservedStock,
      i.stockInTransit,
      i.tls,
      i.toll,
      i.bflo,
      i.nmk,
      i.pak,
      i.ksa,
      i.snt,
      i.usa,
      i.ajman,
      i.lastUpdated,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `consolidated_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary metrics for filtered view
  const totalUnits = filteredItems.reduce((acc, i) => acc + i.totalCompanyStock, 0);
  const totalValuation = filteredItems.reduce((acc, i) => acc + i.totalCompanyStock * i.unitCost, 0);

  return (
    <div className="space-y-4">
      {/* Top Banner and Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Consolidated Inventory
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              ({filteredItems.length} SKUs · {totalUnits} Units)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Combines balances from all 9 warehouse hubs. Total is dynamically calculated from the underlying warehouse ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by item code, description, manufacturer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Condition Filter */}
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none"
          >
            <option value="ALL">All Conditions</option>
            <option value="New in Box">New in Box</option>
            <option value="New, No Box">New, No Box</option>
            <option value="Used">Used</option>
            <option value="Tested">Tested</option>
            <option value="Refurbished">Refurbished</option>
            <option value="Open Box">Open Box</option>
            <option value="Unknown">Unknown</option>
          </select>

          {/* Manufacturer Filter */}
          <select
            value={manufacturerFilter}
            onChange={(e) => setManufacturerFilter(e.target.value)}
            className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none"
          >
            <option value="ALL">All Manufacturers</option>
            {uniqueManufacturers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Valuation Total Tag */}
        <div className="text-right text-xs text-slate-500 whitespace-nowrap">
          Filtered Valuation: <span className="font-mono font-bold text-slate-900">${totalValuation.toLocaleString()} USD</span>
        </div>
      </div>

      {/* Main Consolidated Table with 9 Warehouse Columns */}
      <div className="rounded border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => handleSort('itemCode')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 whitespace-nowrap sticky left-0 bg-slate-50 z-10"
                >
                  <div className="flex items-center gap-1">
                    <span>Item Code</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[200px]">Description & Make</th>
                <th className="py-3 px-2.5 whitespace-nowrap">Condition</th>
                <th
                  onClick={() => handleSort('unitCost')}
                  className="py-3 px-2.5 text-right cursor-pointer hover:bg-slate-100 whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Unit Cost</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalCompanyStock')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 bg-slate-100/70 whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1 font-bold text-slate-900">
                    <span>Total Co.</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-600" />
                  </div>
                </th>
                <th className="py-3 px-2.5 text-right text-emerald-800 whitespace-nowrap">Available</th>
                <th className="py-3 px-2.5 text-right text-amber-800 whitespace-nowrap">Reserved</th>
                <th className="py-3 px-2.5 text-right text-blue-800 whitespace-nowrap">In Transit</th>

                {/* 9 Warehouse Columns as defined in Section 9 */}
                <th className="py-3 px-2 text-center bg-slate-50 border-l border-slate-200 whitespace-nowrap">TLS</th>
                <th className="py-3 px-2 text-center whitespace-nowrap">TOLL</th>
                <th className="py-3 px-2 text-center whitespace-nowrap">BFLO</th>
                <th className="py-3 px-2 text-center whitespace-nowrap">NMK</th>
                <th className="py-3 px-2 text-center whitespace-nowrap">PAK</th>
                <th className="py-3 px-2 text-center whitespace-nowrap">KSA</th>
                <th className="py-3 px-2 text-center whitespace-nowrap">SNT</th>
                <th className="py-3 px-2 text-center whitespace-nowrap">USA</th>
                <th className="py-3 px-2 text-center border-r border-slate-200 whitespace-nowrap">Ajman</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={18} className="py-12 text-center text-slate-400">
                    No consolidated inventory records match your criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.itemCode} className="hover:bg-slate-50/80 transition-colors">
                    {/* Item Code (Sticky Left) */}
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50 whitespace-nowrap z-10 border-r border-slate-100">
                      <div>{item.itemCode}</div>
                      {item.standardizedItemCode !== item.itemCode && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          Std: {item.standardizedItemCode}
                        </div>
                      )}
                    </td>

                    {/* Description & Make */}
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800 line-clamp-1" title={item.itemDescription}>
                        {item.itemDescription}
                      </div>
                      <div className="text-[11px] text-slate-500">{item.manufacturer}</div>
                    </td>

                    {/* Condition */}
                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      <span className="text-xs text-slate-700 font-medium">
                        {item.condition}
                      </span>
                    </td>

                    {/* Unit Cost */}
                    <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      ${item.unitCost.toLocaleString()}
                    </td>

                    {/* Total Company Stock (Authoritative Calculation) */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50/50 tabular-nums whitespace-nowrap">
                      {item.totalCompanyStock}
                    </td>

                    {/* Available Stock */}
                    <td className="py-2.5 px-2.5 text-right font-mono font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                      {item.availableStock}
                    </td>

                    {/* Reserved Stock */}
                    <td className="py-2.5 px-2.5 text-right font-mono text-amber-700 tabular-nums whitespace-nowrap">
                      {item.reservedStock > 0 ? item.reservedStock : '—'}
                    </td>

                    {/* Stock in Transit */}
                    <td className="py-2.5 px-2.5 text-right font-mono text-blue-700 tabular-nums whitespace-nowrap">
                      {item.stockInTransit > 0 ? item.stockInTransit : '—'}
                    </td>

                    {/* 9 Warehouse Balances - Clickable Drill-down */}
                    <td
                      onClick={() => onOpenItemDrilldown(item.itemCode, 'WH-001')}
                      className="py-2.5 px-2 text-center font-mono tabular-nums border-l border-slate-200 cursor-pointer hover:bg-slate-100"
                      title="WH-001 (TLS, USA) - Click to view movements"
                    >
                      <span className={item.tls > 0 ? 'font-semibold text-slate-900' : 'text-slate-300'}>
                        {item.tls}
                      </span>
                    </td>

                    <td
                      onClick={() => onOpenItemDrilldown(item.itemCode, 'WH-002')}
                      className="py-2.5 px-2 text-center font-mono tabular-nums cursor-pointer hover:bg-slate-100"
                      title="WH-002 (TOLL, UAE)"
                    >
                      <span className={item.toll > 0 ? 'font-semibold text-slate-900' : 'text-slate-300'}>
                        {item.toll}
                      </span>
                    </td>

                    <td
                      onClick={() => onOpenItemDrilldown(item.itemCode, 'WH-004')}
                      className="py-2.5 px-2 text-center font-mono tabular-nums cursor-pointer hover:bg-slate-100"
                      title="WH-004 (BFLO, USA)"
                    >
                      <span className={item.bflo > 0 ? 'font-semibold text-slate-900' : 'text-slate-300'}>
                        {item.bflo}
                      </span>
                    </td>

                    <td
                      onClick={() => onOpenItemDrilldown(item.itemCode, 'WH-006')}
                      className="py-2.5 px-2 text-center font-mono tabular-nums cursor-pointer hover:bg-slate-100"
                      title="WH-006 (NMK, UAE)"
                    >
                      <span className={item.nmk > 0 ? 'font-semibold text-slate-900' : 'text-slate-300'}>
                        {item.nmk}
                      </span>
                    </td>

                    <td
                      onClick={() => onOpenItemDrilldown(item.itemCode, 'WH-008')}
                      className="py-2.5 px-2 text-center font-mono tabular-nums cursor-pointer hover:bg-slate-100"
                      title="WH-008 (PAK)"
                    >
                      <span className={item.pak > 0 ? 'font-semibold text-slate-900' : 'text-slate-300'}>
                        {item.pak}
                      </span>
                    </td>

                    <td
                      onClick={() => onOpenItemDrilldown(item.itemCode, 'WH-009')}
                      className="py-2.5 px-2 text-center font-mono tabular-nums cursor-pointer hover:bg-slate-100"
                      title="WH-009 (KSA)"
                    >
                      <span className={item.ksa > 0 ? 'font-semibold text-slate-900' : 'text-slate-300'}>
                        {item.ksa}
                      </span>
                    </td>

                    <td
                      onClick={() => onOpenItemDrilldown(item.itemCode, 'WH-003')}
                      className="py-2.5 px-2 text-center font-mono tabular-nums cursor-pointer hover:bg-slate-100"
                      title="WH-003 (SNT, UAE)"
                    >
                      <span className={item.snt > 0 ? 'font-semibold text-slate-900' : 'text-slate-300'}>
                        {item.snt}
                      </span>
                    </td>

                    <td
                      onClick={() => onOpenItemDrilldown(item.itemCode, 'WH-005')}
                      className="py-2.5 px-2 text-center font-mono tabular-nums cursor-pointer hover:bg-slate-100"
                      title="WH-005 (USA)"
                    >
                      <span className={item.usa > 0 ? 'font-semibold text-slate-900' : 'text-slate-300'}>
                        {item.usa}
                      </span>
                    </td>

                    <td
                      onClick={() => onOpenItemDrilldown(item.itemCode, 'WH-007')}
                      className="py-2.5 px-2 text-center font-mono tabular-nums border-r border-slate-200 cursor-pointer hover:bg-slate-100"
                      title="WH-007 (AJMAN, UAE)"
                    >
                      <span className={item.ajman > 0 ? 'font-semibold text-slate-900' : 'text-slate-300'}>
                        {item.ajman}
                      </span>
                    </td>

                    {/* Drill-down action */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onOpenItemDrilldown(item.itemCode)}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        Ledger & Serials
                      </button>
                    </td>
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
