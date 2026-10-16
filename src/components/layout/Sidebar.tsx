import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  Building2,
  ArrowLeftRight,
  ShoppingCart,
  FileText,
  Truck,
  Users,
  Compass,
  SlidersHorizontal,
  Barcode,
  BarChart3,
  UploadCloud,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';

export type NavigationModule =
  | 'dashboard'
  | 'consolidated_inventory'
  | 'warehouse_inventory'
  | 'incoming_stock'
  | 'outgoing_stock'
  | 'warehouses'
  | 'transfers'
  | 'procurement'
  | 'purchase_orders'
  | 'suppliers'
  | 'customers'
  | 'shipment_tracking'
  | 'adjustments'
  | 'serial_numbers'
  | 'reports'
  | 'data_import'
  | 'user_management'
  | 'settings';

interface SidebarProps {
  activeModule: NavigationModule;
  onSelectModule: (module: NavigationModule) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  badgeCounts: {
    incomingPending?: number;
    outgoingPending?: number;
    adjustmentsPending?: number;
    transfersInTransit?: number;
    customersReview?: number;
    purchaseOrdersPending?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  collapsed,
  onToggleCollapse,
  badgeCounts,
}) => {
  const navSections = [
    {
      title: 'Core Operations',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'consolidated_inventory', label: 'Consolidated Inventory', icon: Layers },
        { id: 'warehouse_inventory', label: 'Warehouse Inventory', icon: Boxes },
      ],
    },
    {
      title: 'Stock Movements',
      items: [
        {
          id: 'incoming_stock',
          label: 'Incoming Stock',
          icon: ArrowDownToLine,
          badge: badgeCounts.incomingPending,
        },
        {
          id: 'outgoing_stock',
          label: 'Outgoing Stock',
          icon: ArrowUpFromLine,
          badge: badgeCounts.outgoingPending,
        },
        {
          id: 'transfers',
          label: 'Warehouse Transfers',
          icon: ArrowLeftRight,
          badge: badgeCounts.transfersInTransit,
        },
        {
          id: 'adjustments',
          label: 'Stock Adjustments',
          icon: SlidersHorizontal,
          badge: badgeCounts.adjustmentsPending,
        },
        { id: 'serial_numbers', label: 'Serial Numbers', icon: Barcode },
      ],
    },
    {
      title: 'Procurement & Logistics',
      items: [
        { id: 'procurement', label: 'Procurement Requisitions', icon: ShoppingCart },
        {
          id: 'purchase_orders',
          label: 'Purchase Orders',
          icon: FileText,
          badge: badgeCounts.purchaseOrdersPending,
        },
        { id: 'shipment_tracking', label: 'Shipment Tracking', icon: Compass },
      ],
    },
    {
      title: 'Master Data & Partners',
      items: [
        { id: 'warehouses', label: 'Warehouse Master (9)', icon: Building2 },
        { id: 'suppliers', label: 'Suppliers Master', icon: Truck },
        {
          id: 'customers',
          label: 'Customers Master',
          icon: Users,
          badge: badgeCounts.customersReview,
        },
      ],
    },
    {
      title: 'Intelligence & Management',
      items: [
        { id: 'reports', label: 'Reports Center (20)', icon: BarChart3 },
        { id: 'data_import', label: 'Data Import Center', icon: UploadCloud },
        { id: 'user_management', label: 'Users & Permissions', icon: ShieldCheck },
        { id: 'settings', label: 'Google Sheets & Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-200 bg-white transition-all duration-200 z-20 shrink-0 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top company label */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Enterprise Suite
            </span>
            <span className="text-sm font-semibold text-slate-900 truncate">
              Industrial Electronics
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors mx-auto"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation links */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectModule(item.id as NavigationModule)}
                  title={collapsed ? item.label : undefined}
                  className={`group flex w-full items-center justify-between rounded px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`ml-2 text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-slate-800 text-slate-200'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer system details */}
      {!collapsed && (
        <div className="border-t border-slate-200 p-3 bg-slate-50 text-[11px] text-slate-500">
          <div className="flex justify-between items-center">
            <span>DB: Google Sheets</span>
            <span className="font-mono text-[10px]">API v4</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            9 Warehouses · TLS / TOLL / KSA
          </div>
        </div>
      )}
    </aside>
  );
};
