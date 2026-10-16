import React, { useState } from 'react';
import {
  Barcode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Clock,
  Filter,
} from 'lucide-react';
import { SerialNumberRecord, SerialStatus, ProductCondition } from '../../types/erp';

interface SerialNumbersViewProps {
  serials: SerialNumberRecord[];
  selectedWarehouseFilter: string;
}

export const SerialNumbersView: React.FC<SerialNumbersViewProps> = ({
  serials,
  selectedWarehouseFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredSerials = serials.filter((s) => {
    if (selectedWarehouseFilter !== 'ALL' && s.warehouse !== selectedWarehouseFilter) return false;
    if (statusFilter !== 'ALL' && s.currentStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSN = s.serialNumber.toLowerCase().includes(q);
      const matchCode = s.itemCode.toLowerCase().includes(q);
      const matchRef = (s.receiptReference || s.issueReference || s.transferReference || '').toLowerCase().includes(q);
      if (!matchSN && !matchCode && !matchRef) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Serial Number Unit Registry & Lifecycle
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              ({filteredSerials.length} units tracked)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual lifecycle tracking from goods receipt, bin storage, inter-warehouse transit, to customer dispatch.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search serial number, item code, transaction ref..."
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
            <option value="ALL">All Serial Statuses</option>
            <option value="Available">Available in Warehouse</option>
            <option value="Reserved">Reserved for Sales Order</option>
            <option value="In Transit">In Transit between Hubs</option>
            <option value="Dispatched">Dispatched to Customer</option>
            <option value="Under Inspection">Under Inspection</option>
            <option value="Damaged">Damaged</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800 font-mono tabular-nums">{filteredSerials.length}</span> units
        </div>
      </div>

      {/* Serials Table */}
      <div className="rounded border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Serial Number</th>
                <th className="py-3 px-3">Item Code</th>
                <th className="py-3 px-3">Condition</th>
                <th className="py-3 px-3">Current Facility</th>
                <th className="py-3 px-3 text-center">Lifecycle Status</th>
                <th className="py-3 px-3">Receipt Ref</th>
                <th className="py-3 px-3">Issue / Transfer Ref</th>
                <th className="py-3 px-3 text-right">Last Movement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSerials.map((s) => {
                const isAvailable = s.currentStatus === 'Available';
                const isDispatched = s.currentStatus === 'Dispatched';
                const isInTransit = s.currentStatus === 'In Transit';

                return (
                  <tr key={s.serialNumber} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {s.serialNumber}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {s.itemCode}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-slate-700 font-medium">{s.condition}</span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      {s.warehouse}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {isAvailable ? (
                        <span className="text-xs font-semibold text-emerald-700">Available</span>
                      ) : isDispatched ? (
                        <span className="text-xs font-semibold text-slate-500">Dispatched</span>
                      ) : isInTransit ? (
                        <span className="text-xs font-semibold text-blue-700">In Transit</span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-700">{s.currentStatus}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {s.receiptReference || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {s.issueReference || s.transferReference || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(s.lastMovementDate).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                    </td>
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
