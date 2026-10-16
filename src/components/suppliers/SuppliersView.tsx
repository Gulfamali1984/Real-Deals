import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Mail,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  Search,
  X,
} from 'lucide-react';
import { Supplier } from '../../types/erp';

interface SuppliersViewProps {
  suppliers: Supplier[];
  onCreateSupplier: (payload: any) => Promise<void>;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  onCreateSupplier,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [supplierName, setSupplierName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('Germany');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [currency, setCurrency] = useState('USD');
  const [leadTime, setLeadTime] = useState(10);
  const [notes, setNotes] = useState('');

  const filteredSuppliers = suppliers.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.supplierName.toLowerCase().includes(q);
      const matchContact = s.contactPerson.toLowerCase().includes(q);
      const matchCountry = s.country.toLowerCase().includes(q);
      if (!matchName && !matchContact && !matchCountry) return false;
    }
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreateSupplier({
        supplierName: supplierName.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        country: country.trim(),
        paymentTerms,
        currency,
        leadTime: Number(leadTime) || 7,
        notes,
      });
      setIsModalOpen(false);
      setSupplierName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setAddress('');
      setNotes('');
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
              Suppliers Master
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              ({suppliers.length} vendors)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Industrial automation parts vendors, lead times, and global procurement agreements.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers by name, contact, country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((s) => (
          <div
            key={s.supplierId}
            className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold text-slate-500">
                  {s.supplierId}
                </span>
                <span className="text-xs font-semibold text-slate-700">{s.country}</span>
              </div>

              <div className="mt-2.5">
                <h3 className="text-sm font-bold text-slate-900">{s.supplierName}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Lead Time: <strong className="font-mono text-slate-700">{s.leadTime} days</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>{s.paymentTerms}</span>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-slate-400">Contact:</span>
                  <span className="font-medium text-slate-800">{s.contactPerson}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{s.email}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{s.phone}</span>
                </div>
                {s.notes && (
                  <div className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                    {s.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: New Supplier */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">
                Register New Parts Supplier
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Schneider Electric Direct, Rockwell Dist."
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={leadTime}
                    onChange={(e) => setLeadTime(Number(e.target.value))}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs font-mono text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  >
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Wire Prepayment">Wire Prepayment</option>
                    <option value="Letter of Credit">Letter of Credit</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vendor Notes & Specialties
                  </label>
                  <input
                    type="text"
                    placeholder="Specializes in Siemens S7-1500, emergency replacement..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
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
                  {isSubmitting ? 'Saving...' : 'Register Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
