import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Building2,
  CheckCircle2,
  Lock,
  User,
  X,
} from 'lucide-react';
import { AppUser, UserRole, Warehouse } from '../../types/erp';

interface UserManagementViewProps {
  users: AppUser[];
  warehouses: Warehouse[];
  onCreateUser: (payload: any) => Promise<void>;
  onUpdateUser: (userId: string, updates: Partial<AppUser>) => Promise<void>;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  warehouses,
  onCreateUser,
  onUpdateUser,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Warehouse Operator');
  const [assignedWarehouses, setAssignedWarehouses] = useState<string[]>(['WH-001']);

  const rolesList: UserRole[] = [
    'Super Admin',
    'Procurement Manager',
    'Warehouse Manager',
    'Warehouse Operator',
    'Logistics Manager',
    'Inventory Controller',
    'Finance / Reporting User',
    'Read-Only User',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreateUser({
        name: name.trim(),
        email: email.trim(),
        role,
        assignedWarehouses: role === 'Super Admin' || role === 'Procurement Manager' ? ['*'] : assignedWarehouses,
      });
      setIsModalOpen(false);
      setName('');
      setEmail('');
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
              User Roles & Warehouse Permissions (RBAC)
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              ({users.length} active operators)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based access matrix ensuring operators only issue/receive stock for authorized facilities.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add System User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">User ID</th>
                <th className="py-3 px-3">Operator Name</th>
                <th className="py-3 px-3">Email Address</th>
                <th className="py-3 px-3">Assigned Role</th>
                <th className="py-3 px-3">Warehouse Access Scope</th>
                <th className="py-3 px-3 text-center">Active Status</th>
                <th className="py-3 px-3 text-right">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((u) => {
                const isGlobal = u.assignedWarehouses.includes('*');

                return (
                  <tr key={u.userId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                      {u.userId}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{u.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{u.email}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-slate-800">
                      {u.role}
                    </td>
                    <td className="py-2.5 px-3">
                      {isGlobal ? (
                        <span className="text-emerald-700 font-medium">All 9 Facilities (Global Access)</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {u.assignedWarehouses.map((wh) => (
                            <span key={wh} className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold">
                              {wh}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="text-xs font-semibold text-emerald-700">Active</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString([], { month: 'short', day: '2-digit' }) : 'Never'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">
                Register New User Account
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mansoor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  placeholder="operator@apexpulse.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  System Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                >
                  {rolesList.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {role !== 'Super Admin' && role !== 'Procurement Manager' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign Permitted Warehouses
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50">
                    {warehouses.map((wh) => {
                      const isChecked = assignedWarehouses.includes(wh.warehouseCode);
                      return (
                        <label key={wh.warehouseCode} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setAssignedWarehouses(assignedWarehouses.filter((x) => x !== wh.warehouseCode));
                              } else {
                                setAssignedWarehouses([...assignedWarehouses, wh.warehouseCode]);
                              }
                            }}
                            className="rounded border-slate-300 text-slate-900"
                          />
                          <span>{wh.warehouseCode} · {wh.warehouseName} ({wh.location})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

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
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
