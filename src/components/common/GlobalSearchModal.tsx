import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Package,
  Barcode,
  Truck,
  FileText,
  Users,
  Building2,
  ExternalLink,
} from 'lucide-react';
import {
  Product,
  SerialNumberRecord,
  IncomingShipment,
  OutgoingShipment,
  PurchaseOrder,
  Customer,
  Supplier,
  Warehouse,
} from '../../types/erp';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  serials: SerialNumberRecord[];
  incomingShipments: IncomingShipment[];
  outgoingShipments: OutgoingShipment[];
  purchaseOrders: PurchaseOrder[];
  customers: Customer[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  onSelectResult: (type: string, id: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  serials,
  incomingShipments,
  outgoingShipments,
  purchaseOrders,
  customers,
  suppliers,
  warehouses,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return null;

    // 1. Products
    const matchedProducts = products.filter(
      (p) =>
        p.itemCode.toLowerCase().includes(q) ||
        p.standardizedItemCode.toLowerCase().includes(q) ||
        p.itemName.toLowerCase().includes(q) ||
        p.manufacturer.toLowerCase().includes(q)
    ).slice(0, 5);

    // 2. Serial Numbers
    const matchedSerials = serials.filter(
      (s) => s.serialNumber.toLowerCase().includes(q) || s.itemCode.toLowerCase().includes(q)
    ).slice(0, 5);

    // 3. Tracking numbers (Incoming & Outgoing)
    const matchedTracking = [
      ...incomingShipments
        .filter((s) => s.trackingNo.toLowerCase().includes(q))
        .map((s) => ({ ...s, direction: 'Incoming' })),
      ...outgoingShipments
        .filter((s) => (s.trackingNo || '').toLowerCase().includes(q))
        .map((s) => ({ ...s, direction: 'Outgoing' })),
    ].slice(0, 5);

    // 4. Purchase Orders
    const matchedPOs = purchaseOrders.filter(
      (p) =>
        p.poNumber.toLowerCase().includes(q) ||
        p.itemCode.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q)
    ).slice(0, 5);

    // 5. Customers
    const matchedCustomers = customers.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.standardizedName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    ).slice(0, 4);

    // 6. Suppliers
    const matchedSuppliers = suppliers.filter(
      (s) => s.supplierName.toLowerCase().includes(q) || s.contactPerson.toLowerCase().includes(q)
    ).slice(0, 4);

    return {
      products: matchedProducts,
      serials: matchedSerials,
      tracking: matchedTracking,
      pos: matchedPOs,
      customers: matchedCustomers,
      suppliers: matchedSuppliers,
    };
  }, [query, products, serials, incomingShipments, outgoingShipments, purchaseOrders, customers, suppliers]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 pt-16 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 bg-slate-50">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Global search: item code, serial no, tracking #, PO, customer, supplier..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <button onClick={onClose} className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500 hover:bg-slate-100">
            Esc
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[70vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() || query.length < 2 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Type at least 2 characters to search across all master entities and transaction logs.
            </div>
          ) : searchResults && (
            <>
              {/* Products Match */}
              {searchResults.products.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    <span>Products &amp; Item Catalog</span>
                  </div>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded">
                    {searchResults.products.map((p) => (
                      <div
                        key={p.productId}
                        onClick={() => {
                          onSelectResult('product', p.itemCode);
                          onClose();
                        }}
                        className="p-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900">{p.itemCode}</span>
                            <span className="text-[11px] text-slate-500 font-medium">{p.manufacturer}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">{p.condition}</span>
                          </div>
                          <div className="text-xs text-slate-600 truncate mt-0.5">{p.itemName}</div>
                        </div>
                        <span className="font-mono text-xs font-semibold text-slate-800">${p.defaultUnitCost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Serials Match */}
              {searchResults.serials.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Barcode className="h-3.5 w-3.5" />
                    <span>Serial Numbers</span>
                  </div>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded">
                    {searchResults.serials.map((s) => (
                      <div
                        key={s.serialNumber}
                        onClick={() => {
                          onSelectResult('serial', s.serialNumber);
                          onClose();
                        }}
                        className="p-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">{s.serialNumber}</span>
                          <span className="text-xs text-slate-600">[{s.itemCode}]</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500">{s.warehouse}</span>
                          <span className="font-semibold text-slate-800">{s.currentStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tracking Match */}
              {searchResults.tracking.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" />
                    <span>Shipment Tracking Numbers</span>
                  </div>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded">
                    {searchResults.tracking.map((t: any, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          onSelectResult('tracking', t.trackingNo);
                          onClose();
                        }}
                        className="p-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div>
                          <span className="font-mono font-bold text-xs text-slate-900">{t.trackingNo}</span>
                          <span className="ml-2 text-[11px] text-slate-500">
                            {t.direction} · {t.itemCode} ({t.warehouse})
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-slate-700">
                          {t.receiptStatus || t.shipmentStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Purchase Orders */}
              {searchResults.pos.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Purchase Orders</span>
                  </div>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded">
                    {searchResults.pos.map((p) => (
                      <div
                        key={p.poNumber}
                        onClick={() => {
                          onSelectResult('po', p.poNumber);
                          onClose();
                        }}
                        className="p-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div>
                          <span className="font-mono font-bold text-xs text-slate-900">{p.poNumber}</span>
                          <span className="ml-2 text-xs text-slate-600">{p.supplier} · {p.itemCode}</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-800">{p.orderStatus}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers Match */}
              {searchResults.customers.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span>Customers</span>
                  </div>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded">
                    {searchResults.customers.map((c) => (
                      <div
                        key={c.customerId}
                        onClick={() => {
                          onSelectResult('customer', c.customerId);
                          onClose();
                        }}
                        className="p-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div>
                          <span className="font-bold text-xs text-slate-900">{c.customerName}</span>
                          <span className="ml-2 text-xs text-slate-500">({c.country})</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{c.customerType}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
