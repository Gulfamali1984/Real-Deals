import React from 'react';
import {
  Search,
  Building2,
  UserCheck,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  LogIn,
} from 'lucide-react';
import { AppUser, Warehouse } from '../../types/erp';

interface HeaderProps {
  currentUser: AppUser | null;
  users: AppUser[];
  onSwitchUser: (userId: string) => void;
  warehouses: Warehouse[];
  selectedWarehouseFilter: string;
  onSelectWarehouseFilter: (wh: string) => void;
  onOpenGlobalSearch: () => void;
  onReconcile: () => void;
  isReconciling: boolean;
  sheetsConfigured: boolean;
  activeModuleTitle: string;
  googleUser?: any;
  spreadsheetUrl?: string | null;
  onGoogleSignIn?: () => void;
  onQuickSync?: () => void;
  isAutoSyncing?: boolean;
  autoSyncEnabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  onSwitchUser,
  warehouses,
  selectedWarehouseFilter,
  onSelectWarehouseFilter,
  onOpenGlobalSearch,
  onReconcile,
  isReconciling,
  sheetsConfigured,
  activeModuleTitle,
  googleUser,
  spreadsheetUrl,
  onGoogleSignIn,
  onQuickSync,
  isAutoSyncing = false,
  autoSyncEnabled = true,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Zone 1: Brand title & Breadcrumb */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 text-white font-bold text-sm tracking-tight">
            AP
          </div>
          <span className="text-base font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            ApexPulse ERP
          </span>
        </div>
        <span className="text-slate-300 font-light" aria-hidden="true">/</span>
        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
          {activeModuleTitle}
        </span>
      </div>

      {/* Zone 2: Functional controls & Quick search */}
      <div className="flex items-center gap-3">
        {/* Global search trigger */}
        <button
          onClick={onOpenGlobalSearch}
          type="button"
          className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 hover:border-slate-300 hover:bg-white transition-colors"
        >
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden sm:inline">Search item codes, tracking, PO, serials...</span>
          <span className="sm:hidden">Search</span>
          <kbd className="hidden sm:inline-block rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px] text-slate-400 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Warehouse Scope Selector */}
        <div className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={selectedWarehouseFilter}
            onChange={(e) => onSelectWarehouseFilter(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-800 outline-none cursor-pointer"
          >
            <option value="ALL">All Warehouses (Global)</option>
            {warehouses.map((wh) => (
              <option key={wh.warehouseCode} value={wh.warehouseCode}>
                {wh.warehouseCode} · {wh.location} ({wh.warehouseName})
              </option>
            ))}
          </select>
        </div>

        {/* Reconcile Ledger Button */}
        <button
          onClick={onReconcile}
          disabled={isReconciling}
          title="Reconcile calculated stock against immutable movement ledger"
          className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isReconciling ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">Reconcile</span>
        </button>
      </div>

      {/* Zone 3: Google Sheets Live Status & User Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Google Sheets Live Status Badge */}
        {sheetsConfigured ? (
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${isAutoSyncing ? 'duration-500' : ''}`}></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>

            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />

            <span className="hidden xl:inline text-[11px] font-semibold text-emerald-900">
              {isAutoSyncing ? 'Syncing to Sheets...' : autoSyncEnabled ? 'Auto-Sync Live' : 'Sheets Connected'}
            </span>

            {/* Quick sync button */}
            {onQuickSync && (
              <button
                type="button"
                onClick={onQuickSync}
                disabled={isAutoSyncing}
                title="Sync All 20 Worksheets Now"
                className="hover:text-emerald-950 text-emerald-700 transition-colors"
              >
                <RefreshCw className={`h-3 w-3 ${isAutoSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Direct Open in Google Sheets link */}
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                title="Open live Google Spreadsheet in new tab"
                className="text-emerald-700 hover:text-emerald-900 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ) : googleUser ? (
          <div className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-800">
            <span>{googleUser.email?.split('@')[0]}</span>
          </div>
        ) : (
          onGoogleSignIn && (
            <button
              type="button"
              onClick={onGoogleSignIn}
              className="flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
              <span>Connect Google Sheets</span>
            </button>
          )
        )}

        <div className="h-4 w-px bg-slate-200 hidden lg:block" aria-hidden="true" />

        {/* User Role Switcher for RBAC */}
        <div className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-2.5 py-1">
          <UserCheck className="h-3.5 w-3.5 text-slate-600" />
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-semibold text-slate-800 leading-tight">
              {currentUser?.name || 'User'}
            </span>
            <select
              value={currentUser?.userId}
              onChange={(e) => onSwitchUser(e.target.value)}
              className="bg-transparent text-[10px] text-slate-500 font-medium outline-none cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.role} ({u.name.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
