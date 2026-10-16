import React, { useState } from 'react';
import {
  Users,
  Plus,
  AlertTriangle,
  CheckCircle2,
  GitMerge,
  Search,
  Building,
  Mail,
  Phone,
  MapPin,
  X,
} from 'lucide-react';
import { Customer } from '../../types/erp';

interface CustomersViewProps {
  customers: Customer[];
  onCreateCustomer: (payload: any) => Promise<void>;
  onReviewCustomer: (customerId: string, action: 'confirm_distinct' | 'merge_into', targetId?: string) => Promise<void>;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  onCreateCustomer,
  onReviewCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterReview, setFilterReview] = useState<'ALL' | 'NEEDS_REVIEW' | 'CONFIRMED'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewingCustomer, setReviewingCustomer] = useState<Customer | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New customer form
  const [customerName, setCustomerName] = useState('');
  const [standardizedName, setStandardizedName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [country, setCountry] = useState('USA');
  const [customerType, setCustomerType] = useState<'End User' | 'Distributor' | 'System Integrator' | 'Internal / Warehouse'>('Distributor');
  const [notes, setNotes] = useState('');

  const filteredCustomers = customers.filter((c) => {
    if (filterReview === 'NEEDS_REVIEW' && c.reviewStatus !== 'Needs Review') return false;
    if (filterReview === 'CONFIRMED' && c.reviewStatus !== 'Confirmed') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.customerName.toLowerCase().includes(q);
      const matchStd = c.standardizedName.toLowerCase().includes(q);
      const matchEmail = c.email.toLowerCase().includes(q);
      const matchCountry = c.country.toLowerCase().includes(q);
      if (!matchName && !matchStd && !matchEmail && !matchCountry) return false;
    }
    return true;
  });

  const pendingReviewCount = customers.filter((c) => c.reviewStatus === 'Needs Review').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreateCustomer({
        customerName: customerName.trim(),
        standardizedName: standardizedName.trim() || customerName.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        billingAddress: billingAddress.trim(),
        shippingAddress: shippingAddress.trim() || billingAddress.trim(),
        country,
        customerType,
        notes,
      });
      setIsModalOpen(false);
      setCustomerName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setBillingAddress('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveReview = async (action: 'confirm_distinct' | 'merge_into') => {
    if (!reviewingCustomer) return;
    setIsSubmitting(true);
    try {
      await onReviewCustomer(reviewingCustomer.customerId, action, mergeTargetId || undefined);
      setReviewingCustomer(null);
      setMergeTargetId('');
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
              Customer Master & Account Reconciliation
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              ({customers.length} accounts)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Preserves imported account names with controlled duplicate review workflow (e.g. Radwell USA vs Radwell UK).
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Duplicate Review Alert Banner if any pending */}
      {pendingReviewCount > 0 && (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
            <div>
              <span className="font-semibold">{pendingReviewCount} imported customer record(s)</span> require administrator review. Automatic merging is prevented to avoid conflating distinct international legal entities.
            </div>
          </div>
          <button
            onClick={() => setFilterReview('NEEDS_REVIEW')}
            className="rounded border border-amber-300 bg-white px-2.5 py-1 font-medium text-amber-900 hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0"
          >
            Filter Review Queue
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, standardized title, email, country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded">
            <button
              onClick={() => setFilterReview('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterReview === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setFilterReview('NEEDS_REVIEW')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterReview === 'NEEDS_REVIEW' ? 'bg-white text-amber-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Needs Review ({pendingReviewCount})
            </button>
            <button
              onClick={() => setFilterReview('CONFIRMED')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterReview === 'CONFIRMED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Confirmed
            </button>
          </div>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((c) => {
          const isNeedsReview = c.reviewStatus === 'Needs Review';
          const isMerged = c.reviewStatus === 'Merged';

          return (
            <div
              key={c.customerId}
              className={`rounded-lg border p-4 flex flex-col justify-between transition-colors ${
                isNeedsReview
                  ? 'border-amber-300 bg-amber-50/30'
                  : isMerged
                  ? 'border-slate-200 bg-slate-50 opacity-60'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-slate-500 font-semibold">
                    {c.customerId}
                  </span>
                  <div>
                    {isNeedsReview ? (
                      <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        Needs Review
                      </span>
                    ) : isMerged ? (
                      <span className="text-[11px] text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                        Merged
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        Active Account
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2.5">
                  <h3 className="text-sm font-bold text-slate-900">{c.customerName}</h3>
                  {c.standardizedName !== c.customerName && (
                    <div className="text-[11px] text-slate-500">
                      Standardized: <strong className="text-slate-700">{c.standardizedName}</strong>
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {c.customerType} · {c.country}
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{c.contactPerson || 'Contact not specified'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{c.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{c.shippingAddress || c.billingAddress || 'Address on file'}</span>
                  </div>
                </div>
              </div>

              {isNeedsReview && (
                <div className="mt-4 border-t border-amber-200 pt-3">
                  <button
                    onClick={() => {
                      setReviewingCustomer(c);
                      setMergeTargetId(c.potentialDuplicateOf || '');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded bg-amber-700 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 transition-colors"
                  >
                    <GitMerge className="h-3.5 w-3.5" />
                    <span>Review Potential Duplicate</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Review Duplicate Modal */}
      {reviewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Review Potential Customer Duplicate
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit workflow for imported customer records with similar names
                </p>
              </div>
              <button onClick={() => setReviewingCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded bg-slate-50 p-3 border border-slate-200 text-xs space-y-2">
                <div>
                  <span className="text-slate-500">Record Under Review:</span>{' '}
                  <strong className="text-slate-900">{reviewingCustomer.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Standardized Entity:</span>{' '}
                  <strong>{reviewingCustomer.standardizedName}</strong> ({reviewingCustomer.country})
                </div>
                <div>
                  <span className="text-slate-500">Notes:</span> {reviewingCustomer.notes}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-800">Choose Resolution Action:</div>

                {/* Option 1: Confirm distinct */}
                <div className="rounded border border-slate-200 p-3 hover:border-slate-300">
                  <div className="font-semibold text-xs text-slate-900">
                    Option A: Confirm as Independent Legal Entity
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Keep this customer as a completely separate account with distinct invoicing and orders (e.g. Radwell USA vs Radwell UK).
                  </p>
                  <button
                    onClick={() => handleResolveReview('confirm_distinct')}
                    disabled={isSubmitting}
                    className="mt-2 rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
                  >
                    Confirm as Distinct Entity
                  </button>
                </div>

                {/* Option 2: Merge into target account */}
                <div className="rounded border border-slate-200 p-3 hover:border-slate-300">
                  <div className="font-semibold text-xs text-slate-900">
                    Option B: Merge into Existing Master Account
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Flag this entry as an imported duplicate and consolidate all future orders under the primary account.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      value={mergeTargetId}
                      onChange={(e) => setMergeTargetId(e.target.value)}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 outline-none flex-1"
                    >
                      <option value="">Select Target Account...</option>
                      {customers
                        .filter((c) => c.customerId !== reviewingCustomer.customerId && c.reviewStatus !== 'Merged')
                        .map((c) => (
                          <option key={c.customerId} value={c.customerId}>
                            {c.customerName} ({c.customerId} · {c.country})
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => handleResolveReview('merge_into')}
                      disabled={isSubmitting || !mergeTargetId}
                      className="rounded bg-amber-700 px-3 py-1 text-xs font-medium text-white hover:bg-amber-800 disabled:opacity-50 transition-colors"
                    >
                      Merge Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">
                Register Customer Master Account
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer / Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Radwell International LLC, Delta Controls..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standardized Parent Entity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Radwell Global"
                    value={standardizedName}
                    onChange={(e) => setStandardizedName(e.target.value)}
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
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shipping & Delivery Address
                  </label>
                  <textarea
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
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
                  {isSubmitting ? 'Saving...' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
