import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Database,
  Download,
  PlusCircle,
  Zap,
  Radio,
  LogOut,
  User,
} from 'lucide-react';
import { GoogleSheetsConfig } from '../../types/erp';

interface SettingsViewProps {
  sheetsConfig: GoogleSheetsConfig | null;
  onTestConnection: (spreadsheetId: string) => Promise<any>;
  onBootstrapSheets: (spreadsheetId: string) => Promise<any>;
  onSyncSheets: (spreadsheetId: string) => Promise<any>;
  onExportBackup: () => void;
  googleUser?: any;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  onCreateMasterSpreadsheet: () => Promise<any>;
  onToggleAutoSync: (enabled: boolean) => Promise<void>;
  isAutoSyncing?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  sheetsConfig,
  onTestConnection,
  onBootstrapSheets,
  onSyncSheets,
  onExportBackup,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  onCreateMasterSpreadsheet,
  onToggleAutoSync,
  isAutoSyncing = false,
}) => {
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState(
    sheetsConfig?.spreadsheetId && sheetsConfig.spreadsheetId !== '(Not configured)'
      ? sheetsConfig.spreadsheetId
      : ''
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [bootstrapResult, setBootstrapResult] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [creatingMaster, setCreatingMaster] = useState(false);
  const [createMasterResult, setCreateMasterResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await onGoogleSignIn();
    } catch (err: any) {
      console.error('Sign-in error:', err);
    } finally {
      setSigningIn(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection(spreadsheetIdInput.trim());
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  const handleBootstrap = async () => {
    setBootstrapping(true);
    setBootstrapResult(null);
    try {
      const res = await onBootstrapSheets(spreadsheetIdInput.trim());
      setBootstrapResult(res);
      await handleTestConnection();
    } finally {
      setBootstrapping(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await onSyncSheets(spreadsheetIdInput.trim());
      setSyncResult(res);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateMaster = async () => {
    setCreatingMaster(true);
    setCreateMasterResult(null);
    try {
      const res = await onCreateMasterSpreadsheet();
      setCreateMasterResult(res);
      if (res?.spreadsheetId) {
        setSpreadsheetIdInput(res.spreadsheetId);
      }
    } finally {
      setCreatingMaster(false);
    }
  };

  const copyEmail = () => {
    if (sheetsConfig?.serviceAccountEmail) {
      navigator.clipboard.writeText(sheetsConfig.serviceAccountEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeSpreadsheetUrl =
    sheetsConfig?.spreadsheetUrl ||
    (spreadsheetIdInput ? `https://docs.google.com/spreadsheets/d/${spreadsheetIdInput}/edit` : null);

  return (
    <div className="space-y-6">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              System Settings & Google Sheets Auto-Sync Engine
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure real-time Google Sheets synchronization across all 20 required entity worksheets.
          </p>
        </div>

        <button
          onClick={onExportBackup}
          className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="h-4 w-4 text-slate-500" />
          <span>Download JSON Ledger Backup</span>
        </button>
      </div>

      {/* Primary Auto-Sync Control Banner */}
      <div className="rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50/90 via-white to-slate-50 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Real-Time Automatic Google Sheets Synchronization
                </h2>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Auto-Sync
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Every goods receipt, outgoing dispatch, transfer, PR/PO, and stock adjustment immediately updates your 20 Google Sheet tabs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={sheetsConfig?.autoSyncEnabled !== false}
                onChange={(e) => onToggleAutoSync(e.target.checked)}
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span>Auto-Sync Enabled</span>
            </label>
          </div>
        </div>

        {/* Google Authentication & 1-Click Master Creation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Google Sign In status */}
          <div className="rounded border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Google Workspace Account
              </span>
              {googleUser ? (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Connected
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  Action Required
                </span>
              )}
            </div>

            {googleUser ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded border border-slate-100">
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt={googleUser.displayName || 'Google User'}
                      className="h-9 w-9 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {googleUser.displayName || 'Authenticated Google User'}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 truncate">
                      {googleUser.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Permissions: Google Sheets (read/write) &amp; Drive files
                  </span>
                  <button
                    type="button"
                    onClick={onGoogleSignOut}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-3 w-3" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-600">
                  Sign in with your Google account to grant permission to automatically synchronize ERP records to Google Sheets.
                </p>

                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={signingIn}
                  className="gsi-material-button w-full shadow-sm hover:shadow"
                >
                  <div className="gsi-material-button-state"></div>
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">
                      {signingIn ? 'Signing in with Google...' : 'Sign in with Google'}
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* 1-Click Master Spreadsheet Creator & Quick Opener */}
          <div className="rounded border border-slate-200 bg-white p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Target Google Spreadsheet
                </span>
                {activeSpreadsheetUrl && (
                  <a
                    href={activeSpreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline"
                  >
                    <span>Open in Google Sheets</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-500">
                You can create a new dedicated spreadsheet with all 20 worksheets pre-configured, or attach an existing one.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCreateMaster}
                disabled={creatingMaster || (!googleUser && !sheetsConfig?.serviceAccountEmail)}
                className="w-full flex items-center justify-center gap-2 rounded bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <PlusCircle className={`h-4 w-4 ${creatingMaster ? 'animate-spin' : ''}`} />
                <span>
                  {creatingMaster
                    ? 'Creating & Initializing 20 Worksheets...'
                    : '1-Click: Auto-Create Master Google Spreadsheet'}
                </span>
              </button>

              {createMasterResult && (
                <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-[11px] text-emerald-800 flex items-center justify-between">
                  <span>✓ {createMasterResult.message}</span>
                  <a
                    href={createMasterResult.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline ml-2 shrink-0"
                  >
                    View Sheet ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Configuration & Sync Controls */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Spreadsheet ID &amp; Connectivity Controls
              </h2>
              <p className="text-[11px] text-slate-500">
                Inspect worksheet status, trigger immediate batch sync, or change target spreadsheet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded ${
                sheetsConfig?.isConfigured
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {sheetsConfig?.isConfigured ? 'Ready & Synced' : 'Ready to Connect'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Configuration Input & Actions */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Google Spreadsheet ID
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  value={spreadsheetIdInput}
                  onChange={(e) => setSpreadsheetIdInput(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-1.5 font-mono text-xs text-slate-800 outline-none focus:ring-1 focus:ring-slate-900"
                />
                {activeSpreadsheetUrl && (
                  <a
                    href={activeSpreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 shrink-0"
                    title="Open sheet in new tab"
                  >
                    <ExternalLink className="h-4 w-4 text-emerald-600" />
                  </a>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Found in Google Sheets URL: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">https://docs.google.com/spreadsheets/d/&lt;ID&gt;/edit</code>
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <button
                type="button"
                onClick={handleBootstrap}
                disabled={bootstrapping}
                className="flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <Database className="h-3.5 w-3.5 text-slate-500" />
                <span>{bootstrapping ? 'Creating...' : 'Bootstrap Missing Worksheets'}</span>
              </button>

              <button
                type="button"
                onClick={handleSync}
                disabled={syncing || isAutoSyncing}
                className="flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-emerald-700 ${syncing || isAutoSyncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync All 20 Worksheets Now'}</span>
              </button>
            </div>

            {/* Test Connection Results */}
            {testResult && (
              <div
                className={`rounded border p-3 text-xs mt-3 ${
                  testResult.success
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}
              >
                {testResult.success ? (
                  <div>
                    <div className="flex items-center justify-between font-bold">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Connected: "{testResult.title}"</span>
                      </div>
                      <a
                        href={testResult.url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-[11px] font-semibold"
                      >
                        Open Sheet ↗
                      </a>
                    </div>
                    <div className="text-[11px] mt-1">
                      {testResult.missingCount === 0
                        ? 'All 20 required worksheets are properly initialized with headers!'
                        : `${testResult.missingCount} worksheets missing. Click "Bootstrap Missing Worksheets" to create them.`}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span>Connection Error:</span>
                    </div>
                    <div className="text-[11px] mt-1">{testResult.error}</div>
                  </div>
                )}
              </div>
            )}

            {bootstrapResult && (
              <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 mt-2">
                ✓ {bootstrapResult.message}
              </div>
            )}

            {syncResult && (
              <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 mt-2">
                ✓ {syncResult.message}
              </div>
            )}
          </div>

          {/* Sync Stats & Live Health Card */}
          <div className="rounded border border-slate-200 bg-slate-50 p-4 text-xs space-y-3">
            <h3 className="font-bold text-slate-800 text-sm">
              Synchronization Health &amp; Activity
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded border border-slate-200 bg-white p-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Sync Mode</span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {sheetsConfig?.autoSyncEnabled !== false ? 'Real-Time Auto' : 'Manual Only'}
                </p>
                <span className="text-[10px] text-emerald-600 font-medium">Instant on changes</span>
              </div>

              <div className="rounded border border-slate-200 bg-white p-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Worksheets</span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">20 of 20</p>
                <span className="text-[10px] text-slate-500">Fully structured</span>
              </div>
            </div>

            <div className="rounded border border-slate-200 bg-white p-3 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Last Synchronized:</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {sheetsConfig?.lastSyncTime
                    ? new Date(sheetsConfig.lastSyncTime).toLocaleTimeString()
                    : 'Awaiting sync'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Last Status:</span>
                <span className="text-emerald-700 font-semibold">
                  {sheetsConfig?.lastSyncSummary || 'Ready to synchronize'}
                </span>
              </div>
            </div>

            {/* Optional Service Account info */}
            {sheetsConfig?.serviceAccountEmail && (
              <div className="pt-1">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">
                  Fallback Service Account Email:
                </span>
                <div className="flex items-center gap-1 font-mono text-[10px] text-slate-600 bg-white p-1.5 rounded border border-slate-200 select-all">
                  <span className="truncate">{sheetsConfig.serviceAccountEmail}</span>
                  <button type="button" onClick={copyEmail} className="shrink-0 p-1 hover:text-slate-900">
                    {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 20 Required Worksheets Schema Reference & Live Status Grid */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Google Sheets Database Structure (All 20 Worksheets Active)
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Standardized Industrial Schema
          </span>
        </div>
        <p className="text-xs text-slate-500">
          The ERP system organizes all master records, inventory calculations, transactions, and audit logs across these 20 worksheets:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 text-xs">
          {[
            { name: 'Products', desc: 'Item masters & specs' },
            { name: 'Warehouses', desc: '9 facilities & locations' },
            { name: 'Warehouse Inventory', desc: 'Per-facility stock balances' },
            { name: 'Consolidated Inventory', desc: 'Aggregated company stock' },
            { name: 'Incoming Shipments', desc: 'Goods receipts & inspection' },
            { name: 'Outgoing Shipments', desc: 'Dispatches & deliveries' },
            { name: 'Stock Movements', desc: 'Immutable transaction ledger' },
            { name: 'Suppliers', desc: 'Vendor directory' },
            { name: 'Customers', desc: 'Customer accounts' },
            { name: 'Purchase Requests', desc: 'Requisitions & approvals' },
            { name: 'Purchase Orders', desc: 'Supplier purchase orders' },
            { name: 'Goods Receipts', desc: 'GRN delivery confirmations' },
            { name: 'Sales Orders', desc: 'Customer sales commitments' },
            { name: 'Warehouse Transfers', desc: 'Paired transfer movements' },
            { name: 'Stock Adjustments', desc: 'Cycle count adjustments' },
            { name: 'Shipment Tracking', desc: 'Waybill & carrier status' },
            { name: 'Users and Roles', desc: 'Access control & RBAC' },
            { name: 'Audit Logs', desc: 'Security audit trail' },
            { name: 'Settings', desc: 'Company defaults' },
            { name: 'Import Logs', desc: 'Batch import audit' },
          ].map((sheet, idx) => (
            <div
              key={sheet.name}
              className="rounded border border-slate-200 bg-slate-50/70 p-2.5 flex items-start gap-2 hover:bg-slate-50 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-slate-400 font-bold">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <span className="font-semibold text-slate-800 truncate">{sheet.name}</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{sheet.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
