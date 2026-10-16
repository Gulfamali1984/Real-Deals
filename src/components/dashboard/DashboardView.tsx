import React, { useState } from 'react';
import {
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  Truck,
  AlertTriangle,
  Clock,
  TrendingUp,
  DollarSign,
  Building,
  CheckCircle2,
  FileText,
  Filter,
} from 'lucide-react';
import { Product, Warehouse, StockMovement } from '../../types/erp';

interface DashboardKPIs {
  totalUniqueProducts: number;
  totalPhysicalUnits: number;
  totalAvailableStock: number;
  totalReservedStock: number;
  stockInTransit: number;
  stockAwaitingInspection: number;
  stockUnknownCondition: number;
  totalValuation: number;
  incomingShipmentsPending: number;
  outgoingShipmentsPending: number;
  shipmentsInTransit: number;
  purchaseOrdersAwaitingReceipt: number;
  lowStockItems: number;
  outOfStockItems: number;
  adjustmentsAwaitingApproval: number;
  recentMovements: StockMovement[];
  warehouseStockSummary: {
    code: string;
    name: string;
    location: string;
    manager: string;
    units: number;
    value: number;
  }[];
  topMoving: {
    itemCode: string;
    itemName: string;
    manufacturer: string;
    movementCount: number;
  }[];
}

interface DashboardViewProps {
  kpis: DashboardKPIs | null;
  warehouses: Warehouse[];
  products: Product[];
  onNavigate: (module: string) => void;
  onFilterWarehouse: (wh: string) => void;
  selectedWarehouse: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  kpis,
  warehouses,
  products,
  onNavigate,
  onFilterWarehouse,
  selectedWarehouse,
}) => {
  const [selectedCondition, setSelectedCondition] = useState<string>('ALL');

  if (!kpis) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        <Clock className="h-5 w-5 animate-spin mr-2" />
        <span>Loading enterprise inventory telemetry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Procurement & Multi-Warehouse Operations Console
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative real-time inventory ledger across 9 international hubs · Connected to Google Sheets API v4
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Condition:</span>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">All Conditions</option>
              <option value="New in Box">New in Box</option>
              <option value="Used">Used</option>
              <option value="Tested">Tested</option>
              <option value="Refurbished">Refurbished</option>
              <option value="Unknown">Unknown Condition</option>
            </select>
          </div>

          <button
            onClick={() => onNavigate('incoming_stock')}
            className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            + Register Receipt
          </button>
          <button
            onClick={() => onNavigate('outgoing_stock')}
            className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            + Dispatch Issue
          </button>
        </div>
      </div>

      {/* Row 1: High Level Quantitative KPI Strip (Single-elevation, unboxed metadata, tabular figures) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="rounded border border-slate-200 bg-white p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500">Physical Stock</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {kpis.totalPhysicalUnits.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">units</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Across 9 warehouses</span>
        </div>

        <div className="rounded border border-slate-200 bg-white p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-emerald-700">Available Stock</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              {kpis.totalAvailableStock.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600">uncommitted</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Ready for allocation</span>
        </div>

        <div className="rounded border border-slate-200 bg-white p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-amber-700">Reserved / SOs</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-800 font-mono tabular-nums">
              {kpis.totalReservedStock.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-600">locked</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Committed orders</span>
        </div>

        <div className="rounded border border-slate-200 bg-white p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-blue-700">Stock in Transit</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-800 font-mono tabular-nums">
              {kpis.stockInTransit.toLocaleString()}
            </span>
            <span className="text-[10px] text-blue-600">moving</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Inter-warehouse</span>
        </div>

        <div className="rounded border border-slate-200 bg-white p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500">Inventory Valuation</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              ${kpis.totalValuation.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">USD</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Weighted purchase cost</span>
        </div>

        <div className="rounded border border-slate-200 bg-white p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500">Catalog SKUs</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {kpis.totalUniqueProducts}
            </span>
            <span className="text-[10px] text-slate-400">active</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Industrial parts</span>
        </div>

        <div className="rounded border border-slate-200 bg-white p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-red-600">Stock Warnings</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-red-600 font-mono tabular-nums">
              {kpis.lowStockItems + kpis.outOfStockItems}
            </span>
            <span className="text-[10px] text-red-500">alerts</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">
            {kpis.outOfStockItems} out · {kpis.lowStockItems} low
          </span>
        </div>
      </div>

      {/* Row 2: Operational Flow Status Bars */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('incoming_stock')}
          className="rounded border border-slate-200 bg-white p-4 text-left hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Incoming Shipments Pending</span>
            <ArrowDownToLine className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {kpis.incomingShipmentsPending}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {kpis.stockAwaitingInspection} units awaiting inspection & GRN
          </div>
        </button>

        <button
          onClick={() => onNavigate('outgoing_stock')}
          className="rounded border border-slate-200 bg-white p-4 text-left hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Outgoing Dispatch Pending</span>
            <ArrowUpFromLine className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {kpis.outgoingShipmentsPending}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Sales orders awaiting physical dispatch
          </div>
        </button>

        <button
          onClick={() => onNavigate('purchase_orders')}
          className="rounded border border-slate-200 bg-white p-4 text-left hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Open Purchase Orders</span>
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {kpis.purchaseOrdersAwaitingReceipt}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Awaiting supplier delivery into hubs
          </div>
        </button>

        <button
          onClick={() => onNavigate('adjustments')}
          className="rounded border border-slate-200 bg-white p-4 text-left hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Adjustments Awaiting Approval</span>
            <AlertTriangle className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {kpis.adjustmentsAwaitingApproval}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Cycle count & inspection variance
          </div>
        </button>
      </div>

      {/* Row 3: Warehouse Distribution Grid & Top Moving SKUs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 9 Warehouses Breakdown Card */}
        <div className="lg:col-span-2 rounded border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Multi-Warehouse Physical Distribution (9 Hubs)
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Calculated balances by facility manager and region
              </p>
            </div>
            <button
              onClick={() => onNavigate('warehouses')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Manage Hubs →
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {kpis.warehouseStockSummary.map((wh) => (
              <div
                key={wh.code}
                onClick={() => {
                  onFilterWarehouse(wh.code);
                  onNavigate('warehouse_inventory');
                }}
                className={`rounded border p-3 cursor-pointer transition-colors ${
                  selectedWarehouse === wh.code
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{wh.code}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{wh.location}</span>
                </div>
                <div className="text-[11px] text-slate-600 truncate mt-0.5">{wh.name}</div>
                <div className="mt-2 flex items-baseline justify-between border-t border-slate-100 pt-2">
                  <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
                    {wh.units} <span className="text-[10px] font-normal text-slate-400">units</span>
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-slate-600">
                    ${wh.value.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-slate-400">
                  Manager: <span className="text-slate-600 font-medium">{wh.manager || 'Unassigned'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Moving Products & Velocity */}
        <div className="rounded border border-slate-200 bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">High Velocity Items</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Top stock movements</p>
              </div>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </div>

            <div className="mt-4 space-y-3">
              {kpis.topMoving.map((item, idx) => (
                <div
                  key={item.itemCode}
                  className="flex items-center justify-between border-b border-slate-50 pb-2.5 last:border-0"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-900 font-mono">
                        {item.itemCode}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{item.itemName}</div>
                    <div className="text-[10px] text-slate-400">{item.manufacturer}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                      {item.movementCount}
                    </span>
                    <div className="text-[10px] text-slate-400">units moved</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-4">
            <button
              onClick={() => onNavigate('consolidated_inventory')}
              className="w-full text-center text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              View Full Consolidated Inventory Catalog →
            </button>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Immutable Stock Movement Ledger Entries */}
      <div className="rounded border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Live Stock Movement Ledger (Audit Authoritative)
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Append-only transaction log confirming every stock entry, exit, adjustment, and transfer
            </p>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Export Full Ledger Report →
          </button>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Movement ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Item Code</th>
                <th className="py-2.5 px-3">Serial No</th>
                <th className="py-2.5 px-3">Warehouse</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3">Reference / Reason</th>
                <th className="py-2.5 px-3">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {kpis.recentMovements.map((m) => {
                const isPositive = m.quantity > 0;
                return (
                  <tr key={m.movementId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                      {m.movementId}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(m.date).toLocaleString([], {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[11px] font-medium text-slate-800">
                        {m.movementType}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono font-medium text-slate-900">
                      {m.itemCode}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                      {m.serialNumber || '—'}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-700">{m.warehouse}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold tabular-nums">
                      <span className={isPositive ? 'text-emerald-700' : 'text-slate-900'}>
                        {isPositive ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600 max-w-xs truncate" title={m.reason}>
                      <span className="font-medium text-slate-800 mr-1">
                        [{m.referenceDocId}]
                      </span>
                      {m.reason}
                    </td>
                    <td className="py-2 px-3 text-slate-500">{m.recordedBy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
