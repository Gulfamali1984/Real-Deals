export type ProductCondition =
  | 'New in Box'
  | 'New, No Box'
  | 'Open Box'
  | 'Used'
  | 'Tested'
  | 'Refurbished'
  | 'Repaired'
  | 'Damaged'
  | 'Faulty'
  | 'Unknown';

export type UserRole =
  | 'Super Admin'
  | 'Procurement Manager'
  | 'Warehouse Manager'
  | 'Warehouse Operator'
  | 'Logistics Manager'
  | 'Inventory Controller'
  | 'Finance / Reporting User'
  | 'Read-Only User';

export type SerialStatus =
  | 'Available'
  | 'Reserved'
  | 'In Transit'
  | 'Dispatched'
  | 'Under Inspection'
  | 'Damaged';

export type MovementType =
  | 'Receipt'
  | 'Dispatch'
  | 'Transfer Out'
  | 'Transfer In'
  | 'Adjustment'
  | 'Opening Balance'
  | 'Reversal';

export type ShipmentStatus =
  | 'Draft'
  | 'Ready to Dispatch'
  | 'Dispatched'
  | 'In Transit'
  | 'Customs Clearance'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Delayed'
  | 'Exception'
  | 'Cancelled';

export type AdjustmentType =
  | 'Opening Balance'
  | 'Physical Count Correction'
  | 'Damaged Stock'
  | 'Missing Stock'
  | 'Found Stock'
  | 'Data Migration Correction'
  | 'Other Authorized Adjustment';

export interface Product {
  productId: string;
  itemCode: string;
  standardizedItemCode: string;
  itemName: string;
  description: string;
  manufacturer: string;
  category: string;
  condition: ProductCondition;
  unitOfMeasure: string;
  defaultUnitCost: number;
  currency: string;
  reorderLevel: number;
  preferredSupplier: string;
  barcode?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  warehouseCode: string;
  warehouseName: string;
  location: string;
  manager: string;
  address?: string;
  active: boolean;
  createdAt?: string;
}

export interface WarehouseInventoryItem {
  warehouse: string; // Warehouse Code
  itemCode: string;
  currentStock: number;
  outDate?: string;
  adjustment: number;
  openingStock: number;
  totalIncoming: number;
  totalOutgoing: number;
  reorderStatus: 'Normal' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}

export interface ConsolidatedInventoryItem {
  itemCode: string;
  standardizedItemCode: string;
  itemDescription: string;
  manufacturer: string;
  condition: ProductCondition;
  unitCost: number;
  currency: string;
  totalCompanyStock: number;
  availableStock: number;
  reservedStock: number;
  stockInTransit: number;
  // Warehouse specific balances:
  tls: number;
  toll: number;
  bflo: number;
  nmk: number;
  pak: number;
  ksa: number;
  snt: number;
  usa: number;
  ajman: number;
  otherWarehouses?: Record<string, number>;
  lastUpdated: string;
}

export interface IncomingShipment {
  receiptId: string;
  date: string;
  trackingNo: string;
  itemCode: string;
  serialNumber?: string;
  serialNumbers?: string[];
  warehouse: string; // Warehouse Code
  supplier: string;
  quantityReceived: number;
  itemName: string;
  unitCost: number;
  currency: string;
  purchaseOrderNumber?: string;
  receiptStatus: 'Draft' | 'Inspected' | 'Confirmed' | 'Rejected' | 'Cancelled';
  condition: ProductCondition;
  receivedBy: string;
  acceptedQuantity?: number;
  rejectedQuantity?: number;
  damagedQuantity?: number;
  notes?: string;
  createdAt: string;
}

export interface OutgoingShipment {
  issueId: string;
  dateIssued: string;
  itemCode: string;
  trackingNo: string;
  serialNumber?: string;
  serialNumbers?: string[];
  warehouse: string; // Source Warehouse Code
  customer: string; // Customer or destination name
  quantityIssued: number;
  po?: string; // Customer PO
  itemName: string;
  condition: ProductCondition;
  salesOrderNumber?: string;
  shipmentStatus: 'Draft' | 'Reserved' | 'Dispatched' | 'Delivered' | 'Cancelled';
  issuedBy: string;
  notes?: string;
  createdAt: string;
}

export interface StockMovement {
  movementId: string;
  date: string;
  movementType: MovementType;
  itemCode: string;
  serialNumber?: string;
  warehouse: string;
  quantity: number; // positive or negative
  unitCost: number;
  currency: string;
  referenceDocType: 'Incoming Shipment' | 'Outgoing Shipment' | 'Transfer' | 'Adjustment' | 'Opening Balance';
  referenceDocId: string;
  reason: string;
  recordedBy: string;
  createdAt: string;
}

export interface Supplier {
  supplierId: string;
  supplierName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  paymentTerms: string;
  currency: string;
  leadTime: number; // in days
  notes?: string;
  active: boolean;
}

export interface Customer {
  customerId: string;
  customerName: string;
  standardizedName: string;
  contactPerson: string;
  email: string;
  phone: string;
  billingAddress: string;
  shippingAddress: string;
  country: string;
  customerType: 'End User' | 'Distributor' | 'System Integrator' | 'Internal / Warehouse';
  potentialDuplicateOf?: string;
  reviewStatus: 'Confirmed' | 'Needs Review' | 'Merged';
  notes?: string;
  active: boolean;
}

export interface PurchaseRequest {
  requestId: string;
  requestDate: string;
  requestedBy: string;
  itemCode: string;
  description: string;
  quantity: number;
  preferredSupplier: string;
  requiredDate: string;
  destinationWarehouse: string;
  estimatedCost: number;
  currency: string;
  justification: string;
  approvalStatus: 'Pending Review' | 'Approved' | 'Rejected';
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface PurchaseOrder {
  poNumber: string;
  supplier: string;
  orderDate: string;
  expectedDeliveryDate: string;
  destinationWarehouse: string;
  itemCode: string;
  description: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  currency: string;
  taxAndShippingCost: number;
  paymentTerms: string;
  orderStatus: 'Draft' | 'Ordered' | 'Partially Received' | 'Fully Received' | 'Cancelled';
  supplierReference?: string;
  notes?: string;
  createdAt: string;
}

export interface GoodsReceipt {
  grnId: string;
  poNumber: string;
  receiptDate: string;
  warehouse: string;
  receivedBy: string;
  notes?: string;
  createdAt: string;
}

export interface WarehouseTransfer {
  transferId: string;
  dateInitiated: string;
  sourceWarehouse: string;
  destinationWarehouse: string;
  itemCode: string;
  serialNumber?: string;
  quantity: number;
  condition: ProductCondition;
  transferStatus: 'Draft' | 'Dispatched' | 'In Transit' | 'Received' | 'Cancelled';
  dispatchedBy?: string;
  dispatchDate?: string;
  receivedBy?: string;
  receiptDate?: string;
  shortageQuantity: number;
  damagedQuantity: number;
  discrepancyNotes?: string;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
  createdAt: string;
}

export interface StockAdjustment {
  adjustmentId: string;
  date: string;
  warehouse: string;
  itemCode: string;
  serialNumber?: string;
  adjustmentType: AdjustmentType;
  quantityChange: number; // e.g. +5 or -2
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  approvalStatus: 'Pending Approval' | 'Approved' | 'Rejected';
  notes?: string;
  createdAt: string;
}

export interface ShipmentTrackingRecord {
  shipmentId: string;
  shipmentType: 'Inbound' | 'Outbound' | 'Inter-Warehouse';
  trackingNumber: string;
  carrier: string;
  referenceNumber: string; // PO, SO, or Transfer ID
  partyName: string; // Supplier, Customer, or Destination
  sourceWarehouse: string;
  destinationWarehouse?: string;
  shipDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  shipmentStatus: ShipmentStatus;
  shippingCost: number;
  currency: string;
  trackingUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface SerialNumberRecord {
  serialNumber: string;
  productId?: string;
  itemCode: string;
  condition: ProductCondition;
  warehouse: string;
  currentStatus: SerialStatus;
  receiptReference?: string;
  issueReference?: string;
  transferReference?: string;
  lastMovementDate: string;
}

export interface AppUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  assignedWarehouses: string[]; // ['*'] for all, or ['WH-001', 'WH-002']
  active: boolean;
  lastLogin?: string;
}

export interface AuditLog {
  logId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  previousValues?: string;
  newValues?: string;
  reason?: string;
  relatedTransactionId?: string;
}

export interface ImportLog {
  importId: string;
  date: string;
  sourceFilename: string;
  entityType: string;
  totalRows: number;
  acceptedRows: number;
  rejectedRows: number;
  errorSummary?: string;
  performedBy: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  spreadsheetUrl?: string | null;
  serviceAccountEmail: string;
  isConfigured: boolean;
  hasOAuthToken?: boolean;
  autoSyncEnabled?: boolean;
  lastSyncTime?: string | null;
  lastSyncStatus?: string | null;
  lastSyncSummary?: string | null;
  lastTestedAt?: string;
  connectionStatus?: 'Connected' | 'Not Configured' | 'Authentication Error' | 'Missing Sheets' | 'Error';
  statusMessage?: string;
  worksheetsStatus?: { name: string; exists: boolean; rowCount?: number }[];
}

