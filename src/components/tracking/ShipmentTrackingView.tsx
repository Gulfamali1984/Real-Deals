import React, { useState } from 'react';
import {
  Compass,
  Plus,
  ExternalLink,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  X,
  Edit2,
} from 'lucide-react';
import { ShipmentTrackingRecord, ShipmentStatus, Warehouse } from '../../types/erp';

interface ShipmentTrackingViewProps {
  shipments: ShipmentTrackingRecord[];
  warehouses: Warehouse[];
  onRegisterTracking: (payload: any) => Promise<void>;
  onUpdateStatus: (shipmentId: string, status: ShipmentStatus, notes?: string) => Promise<void>;
}

export const ShipmentTrackingView: React.FC<ShipmentTrackingViewProps> = ({
  shipments,
  warehouses,
  onRegisterTracking,
  onUpdateStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingShipment, setEditingShipment] = useState<ShipmentTrackingRecord | null>(null);
  const [newStatus, setNewStatus] = useState<ShipmentStatus>('In Transit');
  const [statusNotes, setStatusNotes] = useState('');

  // Form state
  const [shipmentType, setShipmentType] = useState<'Inbound' | 'Outbound' | 'Inter-Warehouse'>('Inbound');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('DHL Express');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [partyName, setPartyName] = useState('');
  const [sourceWarehouse, setSourceWarehouse] = useState('WH-001');
  const [destinationWarehouse, setDestinationWarehouse] = useState('');
  const [shipDate, setShipDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [shippingCost, setShippingCost] = useState(120);
  const [notes, setNotes] = useState('');

  const filteredShipments = shipments.filter((s) => {
    if (typeFilter !== 'ALL' && s.shipmentType !== typeFilter) return false;
    if (statusFilter !== 'ALL' && s.shipmentStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTrack = s.trackingNumber.toLowerCase().includes(q);
      const matchCarrier = s.carrier.toLowerCase().includes(q);
      const matchRef = s.referenceNumber.toLowerCase().includes(q);
      const matchParty = s.partyName.toLowerCase().includes(q);
      if (!matchTrack && !matchCarrier && !matchRef && !matchParty) return false;
    }
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onRegisterTracking({
        shipmentType,
        trackingNumber: trackingNumber.trim(),
        carrier: carrier.trim(),
        referenceNumber: referenceNumber.trim(),
        partyName: partyName.trim(),
        sourceWarehouse,
        destinationWarehouse: destinationWarehouse || undefined,
        shipDate,
        expectedDeliveryDate,
        shippingCost,
        notes,
      });
      setIsModalOpen(false);
      setTrackingNumber('');
      setReferenceNumber('');
      setPartyName('');
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipment) return;
    setIsSubmitting(true);
    try {
      await onUpdateStatus(editingShipment.shipmentId, newStatus, statusNotes);
      setEditingShipment(null);
      setStatusNotes('');
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
              Shipment Tracking & Logistics Command
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              ({shipments.length} trackings)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status updates across Inbound supplier deliveries, Outbound customer shipments, and Inter-Warehouse transits.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Register Shipment Tracking</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tracking #, carrier, customer, reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none"
          >
            <option value="ALL">All Shipment Types</option>
            <option value="Inbound">Inbound (Suppliers)</option>
            <option value="Outbound">Outbound (Customers)</option>
            <option value="Inter-Warehouse">Inter-Warehouse Transfers</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Ready to Dispatch">Ready to Dispatch</option>
            <option value="Dispatched">Dispatched</option>
            <option value="In Transit">In Transit</option>
            <option value="Customs Clearance">Customs Clearance</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Delayed">Delayed</option>
            <option value="Exception">Exception</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Shipment ID</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Tracking Number</th>
                <th className="py-3 px-3">Carrier</th>
                <th className="py-3 px-3">Reference (PO / SO / TRF)</th>
                <th className="py-3 px-3">Party (Supplier / Client)</th>
                <th className="py-3 px-3">Route</th>
                <th className="py-3 px-3">Expected Date</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredShipments.map((s) => {
                const isDelivered = s.shipmentStatus === 'Delivered';
                const isDelayed = s.shipmentStatus === 'Delayed' || s.shipmentStatus === 'Exception';

                return (
                  <tr key={s.shipmentId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {s.shipmentId}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-slate-800">
                        {s.shipmentType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{s.trackingNumber}</span>
                        {s.trackingUrl && (
                          <a
                            href={s.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-slate-700"
                            title="Open carrier portal"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-800 font-medium">
                      {s.carrier}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {s.referenceNumber || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                      {s.partyName}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                      {s.sourceWarehouse} → {s.destinationWarehouse || 'Destination'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {s.expectedDeliveryDate || 'TBD'}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {isDelivered ? (
                        <span className="text-xs font-semibold text-emerald-700">Delivered</span>
                      ) : isDelayed ? (
                        <span className="text-xs font-semibold text-red-600">{s.shipmentStatus}</span>
                      ) : (
                        <span className="text-xs font-semibold text-blue-700">{s.shipmentStatus}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditingShipment(s);
                          setNewStatus(s.shipmentStatus);
                          setStatusNotes(s.notes || '');
                        }}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Update Status */}
      {editingShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">
                Update Status: {editingShipment.trackingNumber}
              </h3>
              <button onClick={() => setEditingShipment(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Shipment Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ShipmentStatus)}
                  className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                >
                  <option value="Ready to Dispatch">Ready to Dispatch</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Customs Clearance">Customs Clearance</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Exception">Exception</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Checkpoint Update Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Cleared Frankfurt customs, airport handoff..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingShipment(null)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Save Checkpoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register Shipment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">
                Register Shipment Tracking
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shipment Type *
                  </label>
                  <select
                    value={shipmentType}
                    onChange={(e) => setShipmentType(e.target.value as any)}
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  >
                    <option value="Inbound">Inbound (Supplier to Hub)</option>
                    <option value="Outbound">Outbound (Hub to Customer)</option>
                    <option value="Inter-Warehouse">Inter-Warehouse Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Carrier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tracking Number (Air Waybill / Pro Number) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DHL-948210334, UPS-1Z999..."
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reference # (PO/SO)
                  </label>
                  <input
                    type="text"
                    placeholder="PO-2026-101 / SO-2026-088"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Party (Supplier or Client)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Company or client name"
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Origin / Source
                  </label>
                  <input
                    type="text"
                    value={sourceWarehouse}
                    onChange={(e) => setSourceWarehouse(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination
                  </label>
                  <input
                    type="text"
                    placeholder="Destination warehouse or client city"
                    value={destinationWarehouse}
                    onChange={(e) => setDestinationWarehouse(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
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
                    Freight Cost (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(Number(e.target.value))}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs font-mono text-slate-800 outline-none"
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
                  {isSubmitting ? 'Registering...' : 'Register Tracking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
