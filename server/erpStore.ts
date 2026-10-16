import {
  Product,
  Warehouse,
  WarehouseInventoryItem,
  ConsolidatedInventoryItem,
  IncomingShipment,
  OutgoingShipment,
  StockMovement,
  Supplier,
  Customer,
  PurchaseRequest,
  PurchaseOrder,
  WarehouseTransfer,
  StockAdjustment,
  ShipmentTrackingRecord,
  SerialNumberRecord,
  AppUser,
  AuditLog,
  ImportLog,
  ProductCondition,
} from '../src/types/erp';

class ERPStore {
  public products: Product[] = [];
  public warehouses: Warehouse[] = [];
  public warehouseInventory: WarehouseInventoryItem[] = [];
  public consolidatedInventory: ConsolidatedInventoryItem[] = [];
  public incomingShipments: IncomingShipment[] = [];
  public outgoingShipments: OutgoingShipment[] = [];
  public stockMovements: StockMovement[] = [];
  public suppliers: Supplier[] = [];
  public customers: Customer[] = [];
  public purchaseRequests: PurchaseRequest[] = [];
  public purchaseOrders: PurchaseOrder[] = [];
  public warehouseTransfers: WarehouseTransfer[] = [];
  public stockAdjustments: StockAdjustment[] = [];
  public shipmentTrackings: ShipmentTrackingRecord[] = [];
  public serialNumbers: SerialNumberRecord[] = [];
  public users: AppUser[] = [];
  public auditLogs: AuditLog[] = [];
  public importLogs: ImportLog[] = [];

  constructor() {
    this.seedInitialData();
    this.recalculateAllInventory();
  }

  private seedInitialData() {
    // 1. Initial 9 Warehouses from project specifications
    this.warehouses = [
      {
        warehouseCode: 'WH-001',
        warehouseName: 'Main Warehouse',
        location: 'TLS, USA',
        manager: 'Imtiaz',
        address: '1400 Industrial Blvd, Houston, TX 77001, USA',
        active: true,
        createdAt: '2026-01-10T08:00:00Z',
      },
      {
        warehouseCode: 'WH-002',
        warehouseName: 'Secondary Warehouse',
        location: 'TOLL, UAE',
        manager: 'Anoop',
        address: 'Jebel Ali Free Zone Logistics City, Dubai, UAE',
        active: true,
        createdAt: '2026-01-10T08:00:00Z',
      },
      {
        warehouseCode: 'WH-003',
        warehouseName: 'Regional Warehouse',
        location: 'SNT, UAE',
        manager: 'Santhosh',
        address: 'Al Quoz Industrial Area 4, Dubai, UAE',
        active: true,
        createdAt: '2026-01-10T08:00:00Z',
      },
      {
        warehouseCode: 'WH-004',
        warehouseName: 'Regional Warehouse',
        location: 'BFLO, USA',
        manager: 'Denial',
        address: '88 Exchange Street, Buffalo, NY 14202, USA',
        active: true,
        createdAt: '2026-01-10T08:00:00Z',
      },
      {
        warehouseCode: 'WH-005',
        warehouseName: 'Regional Warehouse',
        location: 'USA',
        manager: 'Unassigned',
        address: 'Midwest Distribution Hub, Chicago, IL 60607, USA',
        active: true,
        createdAt: '2026-01-10T08:00:00Z',
      },
      {
        warehouseCode: 'WH-006',
        warehouseName: 'Regional Warehouse',
        location: 'NMK, UAE',
        manager: 'Noorisha',
        address: 'Industrial Park Phase 2, Sharjah, UAE',
        active: true,
        createdAt: '2026-01-10T08:00:00Z',
      },
      {
        warehouseCode: 'WH-007',
        warehouseName: 'Regional Warehouse',
        location: 'AJMAN, UAE',
        manager: 'Unassigned',
        address: 'Jurfor Industrial Zone, Ajman, UAE',
        active: true,
        createdAt: '2026-01-10T08:00:00Z',
      },
      {
        warehouseCode: 'WH-008',
        warehouseName: 'Regional Warehouse',
        location: 'PAK',
        manager: 'Gulfam',
        address: 'S.I.T.E Industrial Area, Karachi, Pakistan',
        active: true,
        createdAt: '2026-01-10T08:00:00Z',
      },
      {
        warehouseCode: 'WH-009',
        warehouseName: 'Regional Warehouse',
        location: 'KSA',
        manager: 'Asif',
        address: '2nd Industrial City, Dammam, Saudi Arabia',
        active: true,
        createdAt: '2026-01-10T08:00:00Z',
      },
    ];

    // 2. Initial Products catalog (Industrial Automation & Electronics)
    this.products = [
      {
        productId: 'PRD-1001',
        itemCode: '140ACI03000',
        standardizedItemCode: 'SCH-MOD-140ACI03000',
        itemName: 'Modicon Quantum Analog Input Module',
        description: '8 Channel Current Analog Input Module 4-20mA / 0-20mA, High Precision',
        manufacturer: 'Schneider Electric',
        category: 'PLC Analog I/O',
        condition: 'New in Box',
        unitOfMeasure: 'EA',
        defaultUnitCost: 480,
        currency: 'USD',
        reorderLevel: 5,
        preferredSupplier: 'Schneider Direct',
        barcode: '3389110328912',
        active: true,
        createdAt: '2026-01-15T09:00:00Z',
        updatedAt: '2026-02-01T10:00:00Z',
      },
      {
        productId: 'PRD-1002',
        itemCode: '140ACI03000-USED',
        standardizedItemCode: 'SCH-MOD-140ACI03000',
        itemName: 'Modicon Quantum Analog Input Module (Used)',
        description: '8 Channel Current Analog Input Module, Bench Tested & Verified',
        manufacturer: 'Schneider Electric',
        category: 'PLC Analog I/O',
        condition: 'Used',
        unitOfMeasure: 'EA',
        defaultUnitCost: 260,
        currency: 'USD',
        reorderLevel: 3,
        preferredSupplier: 'European Surplus Automation',
        barcode: '',
        active: true,
        createdAt: '2026-01-15T09:00:00Z',
        updatedAt: '2026-02-01T10:00:00Z',
      },
      {
        productId: 'PRD-1003',
        itemCode: '140ACI03000-TESTED',
        standardizedItemCode: 'SCH-MOD-140ACI03000',
        itemName: 'Modicon Quantum Analog Input Module (Tested)',
        description: 'Certified Refurbished & Factory Recalibrated with Test Certificate',
        manufacturer: 'Schneider Electric',
        category: 'PLC Analog I/O',
        condition: 'Tested',
        unitOfMeasure: 'EA',
        defaultUnitCost: 340,
        currency: 'USD',
        reorderLevel: 2,
        preferredSupplier: 'European Surplus Automation',
        barcode: '',
        active: true,
        createdAt: '2026-01-15T09:00:00Z',
        updatedAt: '2026-02-01T10:00:00Z',
      },
      {
        productId: 'PRD-1004',
        itemCode: 'BMXP342020',
        standardizedItemCode: 'SCH-M340-BMXP342020',
        itemName: 'Modicon M340 Performance CPU 2020',
        description: 'Modicon M340 Processor 4MB Ethernet Modbus CANopen Port',
        manufacturer: 'Schneider Electric',
        category: 'PLC CPU',
        condition: 'New in Box',
        unitOfMeasure: 'EA',
        defaultUnitCost: 920,
        currency: 'USD',
        reorderLevel: 4,
        preferredSupplier: 'Schneider Direct',
        barcode: '3595863908871',
        active: true,
        createdAt: '2026-01-18T10:00:00Z',
        updatedAt: '2026-02-10T12:00:00Z',
      },
      {
        productId: 'PRD-1005',
        itemCode: '6ES7515-2AM01-0AB0',
        standardizedItemCode: 'SIE-S715-CPU1515',
        itemName: 'SIMATIC S7-1500 CPU 1515-2 PN',
        description: 'Central Processing Unit with Work Memory 500KB Code / 3MB Data, Dual PROFINET',
        manufacturer: 'Siemens',
        category: 'PLC CPU',
        condition: 'New in Box',
        unitOfMeasure: 'EA',
        defaultUnitCost: 1850,
        currency: 'USD',
        reorderLevel: 4,
        preferredSupplier: 'European Surplus Automation',
        barcode: '4025515082121',
        active: true,
        createdAt: '2026-01-20T11:00:00Z',
        updatedAt: '2026-02-15T15:00:00Z',
      },
      {
        productId: 'PRD-1006',
        itemCode: '6AV2123-2GB03-0AX0',
        standardizedItemCode: 'SIE-HMI-KTP700',
        itemName: 'SIMATIC HMI KTP700 Basic Touch',
        description: 'Key and Touch Operation, 7 Inch TFT Display 65536 Colors, PROFINET Interface',
        manufacturer: 'Siemens',
        category: 'HMI',
        condition: 'New in Box',
        unitOfMeasure: 'EA',
        defaultUnitCost: 620,
        currency: 'USD',
        reorderLevel: 6,
        preferredSupplier: 'European Surplus Automation',
        barcode: '4025515083111',
        active: true,
        createdAt: '2026-01-20T11:30:00Z',
        updatedAt: '2026-02-15T15:00:00Z',
      },
      {
        productId: 'PRD-1007',
        itemCode: '1756-L73',
        standardizedItemCode: 'AB-CLOGIX-L73',
        itemName: 'ControlLogix 5570 Controller 8MB',
        description: 'Allen-Bradley ControlLogix Processor, 8MB Memory, USB Port, 128 Axes',
        manufacturer: 'Allen-Bradley / Rockwell',
        category: 'PLC CPU',
        condition: 'New in Box',
        unitOfMeasure: 'EA',
        defaultUnitCost: 3100,
        currency: 'USD',
        reorderLevel: 3,
        preferredSupplier: 'Rockwell Distributors USA',
        barcode: '1061259834192',
        active: true,
        createdAt: '2026-01-22T08:00:00Z',
        updatedAt: '2026-02-18T10:00:00Z',
      },
      {
        productId: 'PRD-1008',
        itemCode: '1734-IB8',
        standardizedItemCode: 'AB-POINTIO-IB8',
        itemName: 'POINT I/O 8-Point 24VDC Digital Input',
        description: 'Sink Input Module, 8 Channels, Removable Terminal Block Compatible',
        manufacturer: 'Allen-Bradley / Rockwell',
        category: 'PLC Digital I/O',
        condition: 'New, No Box',
        unitOfMeasure: 'EA',
        defaultUnitCost: 95,
        currency: 'USD',
        reorderLevel: 10,
        preferredSupplier: 'Rockwell Distributors USA',
        barcode: '',
        active: true,
        createdAt: '2026-01-22T08:30:00Z',
        updatedAt: '2026-02-18T10:00:00Z',
      },
      {
        productId: 'PRD-1009',
        itemCode: 'ACS880-01-045A-3',
        standardizedItemCode: 'ABB-DRV-ACS880-45A',
        itemName: 'ABB Industrial Single Drive 22kW',
        description: 'Variable Frequency Drive ACS880, 45A, 380-415V, Wall Mounted IP21',
        manufacturer: 'ABB',
        category: 'Drives & Inverters',
        condition: 'New in Box',
        unitOfMeasure: 'EA',
        defaultUnitCost: 2450,
        currency: 'USD',
        reorderLevel: 2,
        preferredSupplier: 'European Surplus Automation',
        barcode: '6438177519283',
        active: true,
        createdAt: '2026-01-25T14:00:00Z',
        updatedAt: '2026-02-20T16:00:00Z',
      },
      {
        productId: 'PRD-1010',
        itemCode: 'NJ501-1400',
        standardizedItemCode: 'OMR-SYSMAC-NJ501',
        itemName: 'Omron Sysmac NJ501 Machine Controller',
        description: 'Machine Automation Controller 64 Motion Axes, EtherCAT & EtherNet/IP',
        manufacturer: 'Omron',
        category: 'Motion Controllers',
        condition: 'Open Box',
        unitOfMeasure: 'EA',
        defaultUnitCost: 2850,
        currency: 'USD',
        reorderLevel: 2,
        preferredSupplier: 'Tokyo Motion & Controls',
        barcode: '4547648392102',
        active: true,
        createdAt: '2026-01-28T09:00:00Z',
        updatedAt: '2026-02-22T11:00:00Z',
      },
    ];

    // 3. Suppliers
    this.suppliers = [
      {
        supplierId: 'SUP-001',
        supplierName: 'Schneider Electric Direct',
        contactPerson: 'Marc Lefebvre',
        email: 'procurement@schneider-automation.eu',
        phone: '+33 1 41 29 70 00',
        address: '35 Rue Joseph Monier, 92500 Rueil-Malmaison',
        country: 'France',
        paymentTerms: 'Net 30',
        currency: 'USD',
        leadTime: 12,
        notes: 'Primary supplier for Modicon Quantum, Premium, and M340/M580 series.',
        active: true,
      },
      {
        supplierId: 'SUP-002',
        supplierName: 'Rockwell Distributors USA',
        contactPerson: 'David Miller',
        email: 'sales@rockwell-distrib-usa.com',
        phone: '+1 414 382 2000',
        address: '1201 S 2nd St, Milwaukee, WI 53204',
        country: 'USA',
        paymentTerms: 'Net 15',
        currency: 'USD',
        leadTime: 7,
        notes: 'Authorized distributor for ControlLogix, CompactLogix, and Point I/O.',
        active: true,
      },
      {
        supplierId: 'SUP-003',
        supplierName: 'European Surplus Automation',
        contactPerson: 'Hans Richter',
        email: 'h.richter@euro-surplus-plc.de',
        phone: '+49 89 2314 880',
        address: 'Industriestrasse 14, 80339 Munich',
        country: 'Germany',
        paymentTerms: 'Wire Prepayment',
        currency: 'USD',
        leadTime: 10,
        notes: 'Specializes in hard-to-find Siemens S7-300/400/1500 and tested units.',
        active: true,
      },
      {
        supplierId: 'SUP-004',
        supplierName: 'Tokyo Motion & Controls',
        contactPerson: 'Kenji Sato',
        email: 'exports@tokyo-motion-japan.jp',
        phone: '+81 3 3280 5000',
        address: 'Chiyoda-ku 2-1-1, Tokyo',
        country: 'Japan',
        paymentTerms: 'Letter of Credit',
        currency: 'USD',
        leadTime: 14,
        notes: 'High reliability for Omron Sysmac, Mitsubishi Electric, and Fanuc servo drives.',
        active: true,
      },
      {
        supplierId: 'SUP-005',
        supplierName: 'Global Industrial Exchange',
        contactPerson: 'Tariq Al-Mansoor',
        email: 'orders@global-ind-dxb.ae',
        phone: '+971 4 881 4455',
        address: 'JAFZA One Tower, Dubai',
        country: 'UAE',
        paymentTerms: 'Net 30',
        currency: 'USD',
        leadTime: 4,
        notes: 'Middle East regional fast supplier for emergency factory breakdown spares.',
        active: true,
      },
    ];

    // 4. Customers (including Radwell USA, Radwell UK, and duplicate review workflow records as requested)
    this.customers = [
      {
        customerId: 'CUST-001',
        customerName: 'Radwell, USA',
        standardizedName: 'Radwell International Inc.',
        contactPerson: 'Johnathan Hayes',
        email: 'us-procure@radwell.com',
        phone: '+1 800 332 4336',
        billingAddress: '1 Mill Street, Willingboro, NJ 08046',
        shippingAddress: '1 Mill Street, Willingboro, NJ 08046',
        country: 'USA',
        customerType: 'Distributor',
        reviewStatus: 'Confirmed',
        notes: 'US Headquarters account. Large monthly purchase volumes.',
        active: true,
      },
      {
        customerId: 'CUST-002',
        customerName: 'Radwell, UK',
        standardizedName: 'Radwell International UK Ltd',
        contactPerson: 'Emma Watson',
        email: 'uk-purchasing@radwell.co.uk',
        phone: '+44 1782 576800',
        billingAddress: 'Unit 2 Dalewood Rd, Newcastle-under-Lyme, ST5 9QZ',
        shippingAddress: 'Unit 2 Dalewood Rd, Newcastle-under-Lyme, ST5 9QZ',
        country: 'UK',
        customerType: 'Distributor',
        reviewStatus: 'Confirmed',
        notes: 'UK / European division account. Distinct VAT and logistics pipeline.',
        active: true,
      },
      {
        customerId: 'CUST-003',
        customerName: 'Radwell International UK, Ltd',
        standardizedName: 'Radwell International UK Ltd',
        contactPerson: 'Accounts Payable',
        email: 'invoicing@radwell-uk.com',
        phone: '+44 1782 576800',
        billingAddress: 'Unit 2 Dalewood Road, Staffordshire, UK',
        shippingAddress: 'Unit 2 Dalewood Road, Staffordshire, UK',
        country: 'UK',
        customerType: 'Distributor',
        potentialDuplicateOf: 'CUST-002',
        reviewStatus: 'Needs Review',
        notes: 'Imported duplicate record with slight spelling variation. Requires admin reconciliation.',
        active: true,
      },
      {
        customerId: 'CUST-004',
        customerName: 'Apex Automation Solutions',
        standardizedName: 'Apex Automation Solutions LLC',
        contactPerson: 'Khalid Al-Nuaimi',
        email: 'projects@apex-auto.ae',
        phone: '+971 2 645 8890',
        billingAddress: 'Musaffah Industrial M-12, Abu Dhabi',
        shippingAddress: 'Musaffah Industrial M-12, Abu Dhabi',
        country: 'UAE',
        customerType: 'System Integrator',
        reviewStatus: 'Confirmed',
        notes: 'Oil & gas automation contractor for ADNOC projects.',
        active: true,
      },
      {
        customerId: 'CUST-005',
        customerName: 'Delta Controls & Instrumentation',
        standardizedName: 'Delta Controls Ltd',
        contactPerson: 'Robert Keith',
        email: 'purchasing@delta-controls.ca',
        phone: '+1 604 572 3444',
        billingAddress: '4010 180 St, Surrey, BC V3Z 1A7',
        shippingAddress: '4010 180 St, Surrey, BC V3Z 1A7',
        country: 'Canada',
        customerType: 'End User',
        reviewStatus: 'Confirmed',
        notes: 'Commercial building automation & BMS specialist.',
        active: true,
      },
      {
        customerId: 'CUST-006',
        customerName: 'Saudi Aramco Contractor Ops',
        standardizedName: 'Saudi Aramco Maintenance Services',
        contactPerson: 'Fahad Al-Harbi',
        email: 'maintenance.ops@aramco-contractors.com.sa',
        phone: '+966 13 874 0111',
        billingAddress: 'Dhahran 31311, Eastern Province',
        shippingAddress: 'Ras Tanura Refineries Gate 4, Dammam',
        country: 'Saudi Arabia',
        customerType: 'End User',
        reviewStatus: 'Confirmed',
        notes: 'Requires OEM certificates and tested reports with all shipments.',
        active: true,
      },
    ];

    // 5. Users and Roles
    this.users = [
      {
        userId: 'USR-001',
        name: 'Imtiaz Khan',
        email: 'imtiaz.manager@apexpulse.com',
        role: 'Super Admin',
        assignedWarehouses: ['*'],
        active: true,
        lastLogin: '2026-10-16T12:00:00Z',
      },
      {
        userId: 'USR-002',
        name: 'Anoop Sharma',
        email: 'anoop.toll@apexpulse.com',
        role: 'Warehouse Manager',
        assignedWarehouses: ['WH-002'],
        active: true,
        lastLogin: '2026-10-16T10:15:00Z',
      },
      {
        userId: 'USR-003',
        name: 'Santhosh K',
        email: 'santhosh.snt@apexpulse.com',
        role: 'Warehouse Operator',
        assignedWarehouses: ['WH-003', 'WH-007'],
        active: true,
        lastLogin: '2026-10-16T09:30:00Z',
      },
      {
        userId: 'USR-004',
        name: 'Denial Foster',
        email: 'denial.bflo@apexpulse.com',
        role: 'Warehouse Manager',
        assignedWarehouses: ['WH-004'],
        active: true,
        lastLogin: '2026-10-15T18:00:00Z',
      },
      {
        userId: 'USR-005',
        name: 'Rachel Vance',
        email: 'rachel.procurement@apexpulse.com',
        role: 'Procurement Manager',
        assignedWarehouses: ['*'],
        active: true,
        lastLogin: '2026-10-16T11:45:00Z',
      },
      {
        userId: 'USR-006',
        name: 'Carlos Mendez',
        email: 'carlos.logistics@apexpulse.com',
        role: 'Logistics Manager',
        assignedWarehouses: ['*'],
        active: true,
        lastLogin: '2026-10-16T11:20:00Z',
      },
      {
        userId: 'USR-007',
        name: 'Noorisha Begum',
        email: 'noorisha.nmk@apexpulse.com',
        role: 'Inventory Controller',
        assignedWarehouses: ['WH-006'],
        active: true,
        lastLogin: '2026-10-16T08:50:00Z',
      },
      {
        userId: 'USR-008',
        name: 'Sarah Lin',
        email: 'sarah.finance@apexpulse.com',
        role: 'Finance / Reporting User',
        assignedWarehouses: ['*'],
        active: true,
        lastLogin: '2026-10-15T16:30:00Z',
      },
      {
        userId: 'USR-009',
        name: 'Auditor Guest',
        email: 'auditor@external-review.org',
        role: 'Read-Only User',
        assignedWarehouses: ['*'],
        active: true,
        lastLogin: '2026-10-14T14:10:00Z',
      },
    ];

    // 6. Initial Opening Stock Movements and Transactions
    // We establish opening balance movements across warehouses
    const openingMovements: StockMovement[] = [
      // 140ACI03000 across TLS (WH-001), TOLL (WH-002), BFLO (WH-004)
      {
        movementId: 'MVT-0001',
        date: '2026-02-01T08:00:00Z',
        movementType: 'Opening Balance',
        itemCode: '140ACI03000',
        serialNumber: 'SN-SCH-4011',
        warehouse: 'WH-001', // TLS
        quantity: 12,
        unitCost: 480,
        currency: 'USD',
        referenceDocType: 'Opening Balance',
        referenceDocId: 'INIT-2026',
        reason: 'Initial physical inventory count FY2026',
        recordedBy: 'Imtiaz',
        createdAt: '2026-02-01T08:00:00Z',
      },
      {
        movementId: 'MVT-0002',
        date: '2026-02-01T08:00:00Z',
        movementType: 'Opening Balance',
        itemCode: '140ACI03000',
        serialNumber: 'SN-SCH-4012',
        warehouse: 'WH-002', // TOLL
        quantity: 8,
        unitCost: 480,
        currency: 'USD',
        referenceDocType: 'Opening Balance',
        referenceDocId: 'INIT-2026',
        reason: 'Initial physical inventory count FY2026',
        recordedBy: 'Anoop',
        createdAt: '2026-02-01T08:00:00Z',
      },
      {
        movementId: 'MVT-0003',
        date: '2026-02-01T08:00:00Z',
        movementType: 'Opening Balance',
        itemCode: '140ACI03000',
        warehouse: 'WH-004', // BFLO
        quantity: 5,
        unitCost: 480,
        currency: 'USD',
        referenceDocType: 'Opening Balance',
        referenceDocId: 'INIT-2026',
        reason: 'Initial physical inventory count FY2026',
        recordedBy: 'Denial',
        createdAt: '2026-02-01T08:00:00Z',
      },
      {
        movementId: 'MVT-0004',
        date: '2026-02-01T08:00:00Z',
        movementType: 'Opening Balance',
        itemCode: '140ACI03000-USED',
        warehouse: 'WH-003', // SNT
        quantity: 4,
        unitCost: 260,
        currency: 'USD',
        referenceDocType: 'Opening Balance',
        referenceDocId: 'INIT-2026',
        reason: 'Refurbished stock intake',
        recordedBy: 'Santhosh',
        createdAt: '2026-02-01T08:00:00Z',
      },
      {
        movementId: 'MVT-0005',
        date: '2026-02-01T08:00:00Z',
        movementType: 'Opening Balance',
        itemCode: '140ACI03000-TESTED',
        warehouse: 'WH-006', // NMK
        quantity: 6,
        unitCost: 340,
        currency: 'USD',
        referenceDocType: 'Opening Balance',
        referenceDocId: 'INIT-2026',
        reason: 'Lab verified stock',
        recordedBy: 'Noorisha',
        createdAt: '2026-02-01T08:00:00Z',
      },
      {
        movementId: 'MVT-0006',
        date: '2026-02-01T08:00:00Z',
        movementType: 'Opening Balance',
        itemCode: 'BMXP342020',
        serialNumber: 'SN-M340-9901',
        warehouse: 'WH-001', // TLS
        quantity: 7,
        unitCost: 920,
        currency: 'USD',
        referenceDocType: 'Opening Balance',
        referenceDocId: 'INIT-2026',
        reason: 'Stock migration',
        recordedBy: 'Imtiaz',
        createdAt: '2026-02-01T08:00:00Z',
      },
      {
        movementId: 'MVT-0007',
        date: '2026-02-01T08:00:00Z',
        movementType: 'Opening Balance',
        itemCode: '6ES7515-2AM01-0AB0',
        serialNumber: 'SN-S15-7781',
        warehouse: 'WH-002', // TOLL
        quantity: 4,
        unitCost: 1850,
        currency: 'USD',
        referenceDocType: 'Opening Balance',
        referenceDocId: 'INIT-2026',
        reason: 'Stock migration',
        recordedBy: 'Anoop',
        createdAt: '2026-02-01T08:00:00Z',
      },
      {
        movementId: 'MVT-0008',
        date: '2026-02-01T08:00:00Z',
        movementType: 'Opening Balance',
        itemCode: '6AV2123-2GB03-0AX0',
        warehouse: 'WH-008', // PAK
        quantity: 9,
        unitCost: 620,
        currency: 'USD',
        referenceDocType: 'Opening Balance',
        referenceDocId: 'INIT-2026',
        reason: 'Stock migration',
        recordedBy: 'Gulfam',
        createdAt: '2026-02-01T08:00:00Z',
      },
      {
        movementId: 'MVT-0009',
        date: '2026-02-01T08:00:00Z',
        movementType: 'Opening Balance',
        itemCode: '1756-L73',
        serialNumber: 'SN-CLX-5511',
        warehouse: 'WH-009', // KSA
        quantity: 3,
        unitCost: 3100,
        currency: 'USD',
        referenceDocType: 'Opening Balance',
        referenceDocId: 'INIT-2026',
        reason: 'Stock migration for Aramco spares contract',
        recordedBy: 'Asif',
        createdAt: '2026-02-01T08:00:00Z',
      },
      {
        movementId: 'MVT-0010',
        date: '2026-02-01T08:00:00Z',
        movementType: 'Opening Balance',
        itemCode: '1734-IB8',
        warehouse: 'WH-005', // USA
        quantity: 24,
        unitCost: 95,
        currency: 'USD',
        referenceDocType: 'Opening Balance',
        referenceDocId: 'INIT-2026',
        reason: 'Bulk digital input stock',
        recordedBy: 'Imtiaz',
        createdAt: '2026-02-01T08:00:00Z',
      },
      {
        movementId: 'MVT-0011',
        date: '2026-02-01T08:00:00Z',
        movementType: 'Opening Balance',
        itemCode: 'ACS880-01-045A-3',
        serialNumber: 'SN-ABB-8801',
        warehouse: 'WH-007', // AJMAN
        quantity: 2,
        unitCost: 2450,
        currency: 'USD',
        referenceDocType: 'Opening Balance',
        referenceDocId: 'INIT-2026',
        reason: 'Heavy drive inventory',
        recordedBy: 'Anoop',
        createdAt: '2026-02-01T08:00:00Z',
      },
      {
        movementId: 'MVT-0012',
        date: '2026-02-01T08:00:00Z',
        movementType: 'Opening Balance',
        itemCode: 'NJ501-1400',
        serialNumber: 'SN-OMR-5001',
        warehouse: 'WH-002', // TOLL
        quantity: 3,
        unitCost: 2850,
        currency: 'USD',
        referenceDocType: 'Opening Balance',
        referenceDocId: 'INIT-2026',
        reason: 'Motion controller intake',
        recordedBy: 'Anoop',
        createdAt: '2026-02-01T08:00:00Z',
      },
    ];

    this.stockMovements = openingMovements;

    // 7. Seed Serial Numbers
    this.serialNumbers = [
      {
        serialNumber: 'SN-SCH-4011',
        productId: 'PRD-1001',
        itemCode: '140ACI03000',
        condition: 'New in Box',
        warehouse: 'WH-001',
        currentStatus: 'Available',
        receiptReference: 'INIT-2026',
        lastMovementDate: '2026-02-01T08:00:00Z',
      },
      {
        serialNumber: 'SN-SCH-4012',
        productId: 'PRD-1001',
        itemCode: '140ACI03000',
        condition: 'New in Box',
        warehouse: 'WH-002',
        currentStatus: 'Available',
        receiptReference: 'INIT-2026',
        lastMovementDate: '2026-02-01T08:00:00Z',
      },
      {
        serialNumber: 'SN-M340-9901',
        productId: 'PRD-1004',
        itemCode: 'BMXP342020',
        condition: 'New in Box',
        warehouse: 'WH-001',
        currentStatus: 'Available',
        receiptReference: 'INIT-2026',
        lastMovementDate: '2026-02-01T08:00:00Z',
      },
      {
        serialNumber: 'SN-S15-7781',
        productId: 'PRD-1005',
        itemCode: '6ES7515-2AM01-0AB0',
        condition: 'New in Box',
        warehouse: 'WH-002',
        currentStatus: 'Available',
        receiptReference: 'INIT-2026',
        lastMovementDate: '2026-02-01T08:00:00Z',
      },
      {
        serialNumber: 'SN-CLX-5511',
        productId: 'PRD-1007',
        itemCode: '1756-L73',
        condition: 'New in Box',
        warehouse: 'WH-009',
        currentStatus: 'Available',
        receiptReference: 'INIT-2026',
        lastMovementDate: '2026-02-01T08:00:00Z',
      },
      {
        serialNumber: 'SN-ABB-8801',
        productId: 'PRD-1009',
        itemCode: 'ACS880-01-045A-3',
        condition: 'New in Box',
        warehouse: 'WH-007',
        currentStatus: 'Available',
        receiptReference: 'INIT-2026',
        lastMovementDate: '2026-02-01T08:00:00Z',
      },
      {
        serialNumber: 'SN-OMR-5001',
        productId: 'PRD-1010',
        itemCode: 'NJ501-1400',
        condition: 'Open Box',
        warehouse: 'WH-002',
        currentStatus: 'Available',
        receiptReference: 'INIT-2026',
        lastMovementDate: '2026-02-01T08:00:00Z',
      },
    ];

    // 8. Purchase Requests
    this.purchaseRequests = [
      {
        requestId: 'PR-2026-001',
        requestDate: '2026-10-10T09:00:00Z',
        requestedBy: 'Anoop Sharma',
        itemCode: '6ES7515-2AM01-0AB0',
        description: 'SIMATIC S7-1500 CPU 1515-2 PN for Aramco Emergency Shutdown system project',
        quantity: 5,
        preferredSupplier: 'European Surplus Automation',
        requiredDate: '2026-11-05',
        destinationWarehouse: 'WH-002',
        estimatedCost: 9250,
        currency: 'USD',
        justification: 'Stock below safety reorder threshold for regional critical project spares.',
        approvalStatus: 'Approved',
        approvedBy: 'Rachel Vance',
        createdAt: '2026-10-10T09:00:00Z',
      },
      {
        requestId: 'PR-2026-002',
        requestDate: '2026-10-14T11:30:00Z',
        requestedBy: 'Denial Foster',
        itemCode: '1756-L73',
        description: 'ControlLogix 5570 Controller for Buffalo assembly plant client backlog',
        quantity: 3,
        preferredSupplier: 'Rockwell Distributors USA',
        requiredDate: '2026-11-15',
        destinationWarehouse: 'WH-004',
        estimatedCost: 9300,
        currency: 'USD',
        justification: '3 pending quotes from Radwell USA requiring immediate dispatch capability.',
        approvalStatus: 'Pending Review',
        createdAt: '2026-10-14T11:30:00Z',
      },
    ];

    // 9. Purchase Orders
    this.purchaseOrders = [
      {
        poNumber: 'PO-2026-101',
        supplier: 'Schneider Electric Direct',
        orderDate: '2026-09-15T10:00:00Z',
        expectedDeliveryDate: '2026-10-25',
        destinationWarehouse: 'WH-001',
        itemCode: '140ACI03000',
        description: 'Modicon Quantum Analog Input Module (8 Channel Current)',
        quantityOrdered: 10,
        quantityReceived: 4,
        unitCost: 480,
        currency: 'USD',
        taxAndShippingCost: 150,
        paymentTerms: 'Net 30',
        orderStatus: 'Partially Received',
        supplierReference: 'SE-FR-98214',
        notes: 'Partial receipt delivered; remaining 6 units in air transit via DHL Express.',
        createdAt: '2026-09-15T10:00:00Z',
      },
      {
        poNumber: 'PO-2026-102',
        supplier: 'European Surplus Automation',
        orderDate: '2026-10-11T14:00:00Z',
        expectedDeliveryDate: '2026-10-28',
        destinationWarehouse: 'WH-002',
        itemCode: '6ES7515-2AM01-0AB0',
        description: 'SIMATIC S7-1500 CPU 1515-2 PN',
        quantityOrdered: 5,
        quantityReceived: 0,
        unitCost: 1850,
        currency: 'USD',
        taxAndShippingCost: 320,
        paymentTerms: 'Wire Prepayment',
        orderStatus: 'Ordered',
        supplierReference: 'ESA-DE-44109',
        notes: 'Awaiting export clearance from Munich hub.',
        createdAt: '2026-10-11T14:00:00Z',
      },
    ];

    // 10. Incoming Shipments (Shipment Tracker Incoming Stock table)
    this.incomingShipments = [
      {
        receiptId: 'IN-REC-2026-001',
        date: '2026-10-05T14:30:00Z',
        trackingNo: 'DHL-948210334',
        itemCode: '140ACI03000',
        serialNumber: 'SN-SCH-4015',
        warehouse: 'WH-001',
        supplier: 'Schneider Electric Direct',
        quantityReceived: 4,
        itemName: 'Modicon Quantum Analog Input Module',
        unitCost: 480,
        currency: 'USD',
        purchaseOrderNumber: 'PO-2026-101',
        receiptStatus: 'Confirmed',
        condition: 'New in Box',
        receivedBy: 'Imtiaz',
        acceptedQuantity: 4,
        rejectedQuantity: 0,
        damagedQuantity: 0,
        notes: 'Physical boxes intact, factory seal verified. Stored in Bin A-04.',
        createdAt: '2026-10-05T14:30:00Z',
      },
      {
        receiptId: 'IN-REC-2026-002',
        date: '2026-10-15T10:00:00Z',
        trackingNo: 'FDX-771928014',
        itemCode: 'BMXP342020',
        serialNumber: 'SN-M340-9905',
        warehouse: 'WH-002',
        supplier: 'Global Industrial Exchange',
        quantityReceived: 2,
        itemName: 'Modicon M340 Performance CPU 2020',
        unitCost: 920,
        currency: 'USD',
        receiptStatus: 'Inspected',
        condition: 'New in Box',
        receivedBy: 'Anoop',
        acceptedQuantity: 2,
        rejectedQuantity: 0,
        damagedQuantity: 0,
        notes: 'Awaiting final GRN confirmation from warehouse lead.',
        createdAt: '2026-10-15T10:00:00Z',
      },
    ];

    // Record stock movement for confirmed incoming shipment IN-REC-2026-001
    this.stockMovements.push({
      movementId: 'MVT-0013',
      date: '2026-10-05T14:30:00Z',
      movementType: 'Receipt',
      itemCode: '140ACI03000',
      serialNumber: 'SN-SCH-4015',
      warehouse: 'WH-001',
      quantity: 4,
      unitCost: 480,
      currency: 'USD',
      referenceDocType: 'Incoming Shipment',
      referenceDocId: 'IN-REC-2026-001',
      reason: 'PO-2026-101 Partial Receipt (4 units)',
      recordedBy: 'Imtiaz',
      createdAt: '2026-10-05T14:30:00Z',
    });

    this.serialNumbers.push({
      serialNumber: 'SN-SCH-4015',
      productId: 'PRD-1001',
      itemCode: '140ACI03000',
      condition: 'New in Box',
      warehouse: 'WH-001',
      currentStatus: 'Available',
      receiptReference: 'IN-REC-2026-001',
      lastMovementDate: '2026-10-05T14:30:00Z',
    });

    // 11. Outgoing Shipments (Shipment Tracker Outgoing Stock table)
    this.outgoingShipments = [
      {
        issueId: 'OUT-ISS-2026-001',
        dateIssued: '2026-10-08T16:00:00Z',
        itemCode: '140ACI03000',
        trackingNo: 'UPS-1Z9999999999',
        serialNumber: 'SN-SCH-4011',
        warehouse: 'WH-001',
        customer: 'Radwell, USA',
        quantityIssued: 2,
        po: 'RAD-PO-4482',
        itemName: 'Modicon Quantum Analog Input Module',
        condition: 'New in Box',
        salesOrderNumber: 'SO-2026-088',
        shipmentStatus: 'Dispatched',
        issuedBy: 'Imtiaz',
        notes: 'Priority air courier. Packing list attached to pallet 1.',
        createdAt: '2026-10-08T16:00:00Z',
      },
    ];

    // Deduct stock for confirmed dispatch OUT-ISS-2026-001
    this.stockMovements.push({
      movementId: 'MVT-0014',
      date: '2026-10-08T16:00:00Z',
      movementType: 'Dispatch',
      itemCode: '140ACI03000',
      serialNumber: 'SN-SCH-4011',
      warehouse: 'WH-001',
      quantity: -2,
      unitCost: 480,
      currency: 'USD',
      referenceDocType: 'Outgoing Shipment',
      referenceDocId: 'OUT-ISS-2026-001',
      reason: 'Sales order dispatch to Radwell, USA (PO RAD-PO-4482)',
      recordedBy: 'Imtiaz',
      createdAt: '2026-10-08T16:00:00Z',
    });

    // Update serial status to Dispatched
    const sn4011 = this.serialNumbers.find((s) => s.serialNumber === 'SN-SCH-4011');
    if (sn4011) {
      sn4011.currentStatus = 'Dispatched';
      sn4011.issueReference = 'OUT-ISS-2026-001';
      sn4011.lastMovementDate = '2026-10-08T16:00:00Z';
    }

    // 12. Warehouse Transfers (Inter-Warehouse paired movements)
    this.warehouseTransfers = [
      {
        transferId: 'TRF-2026-001',
        dateInitiated: '2026-10-12T11:00:00Z',
        sourceWarehouse: 'WH-001', // TLS
        destinationWarehouse: 'WH-004', // BFLO
        itemCode: 'BMXP342020',
        serialNumber: 'SN-M340-9901',
        quantity: 2,
        condition: 'New in Box',
        transferStatus: 'In Transit',
        dispatchedBy: 'Imtiaz',
        dispatchDate: '2026-10-12T15:00:00Z',
        shortageQuantity: 0,
        damagedQuantity: 0,
        trackingNumber: 'FDX-FREIGHT-88210',
        carrier: 'FedEx Freight',
        notes: 'Transfer requested by Buffalo hub to fulfill Northeast customer commitments.',
        createdAt: '2026-10-12T11:00:00Z',
      },
    ];

    // Transfer Out from WH-001 (deducts source balance, puts into in-transit)
    this.stockMovements.push({
      movementId: 'MVT-0015',
      date: '2026-10-12T15:00:00Z',
      movementType: 'Transfer Out',
      itemCode: 'BMXP342020',
      serialNumber: 'SN-M340-9901',
      warehouse: 'WH-001',
      quantity: -2,
      unitCost: 920,
      currency: 'USD',
      referenceDocType: 'Transfer',
      referenceDocId: 'TRF-2026-001',
      reason: 'Inter-warehouse transfer to BFLO (WH-004)',
      recordedBy: 'Imtiaz',
      createdAt: '2026-10-12T15:00:00Z',
    });

    const snM340 = this.serialNumbers.find((s) => s.serialNumber === 'SN-M340-9901');
    if (snM340) {
      snM340.currentStatus = 'In Transit';
      snM340.transferReference = 'TRF-2026-001';
      snM340.lastMovementDate = '2026-10-12T15:00:00Z';
    }

    // 13. Stock Adjustments (Cycle count corrections)
    this.stockAdjustments = [
      {
        adjustmentId: 'ADJ-2026-001',
        date: '2026-10-09T14:00:00Z',
        warehouse: 'WH-002', // TOLL
        itemCode: '140ACI03000',
        adjustmentType: 'Physical Count Correction',
        quantityChange: 1,
        reason: 'Surplus unit found during quarterly bin audit in Bin B-12',
        requestedBy: 'Anoop Sharma',
        approvedBy: 'Imtiaz Khan',
        approvalStatus: 'Approved',
        notes: 'Audited and verified barcode against manufacturer batch.',
        createdAt: '2026-10-09T14:00:00Z',
      },
    ];

    // Add movement for approved adjustment
    this.stockMovements.push({
      movementId: 'MVT-0016',
      date: '2026-10-09T14:00:00Z',
      movementType: 'Adjustment',
      itemCode: '140ACI03000',
      warehouse: 'WH-002',
      quantity: 1,
      unitCost: 480,
      currency: 'USD',
      referenceDocType: 'Adjustment',
      referenceDocId: 'ADJ-2026-001',
      reason: 'Physical count surplus approved (+1)',
      recordedBy: 'Imtiaz Khan',
      createdAt: '2026-10-09T14:00:00Z',
    });

    // 14. Central Shipment Tracking
    this.shipmentTrackings = [
      {
        shipmentId: 'SHP-TRK-001',
        shipmentType: 'Inbound',
        trackingNumber: 'DHL-948210334',
        carrier: 'DHL Express',
        referenceNumber: 'PO-2026-101',
        partyName: 'Schneider Electric Direct',
        sourceWarehouse: 'Paris, France',
        destinationWarehouse: 'WH-001 (TLS, USA)',
        shipDate: '2026-10-01',
        expectedDeliveryDate: '2026-10-05',
        actualDeliveryDate: '2026-10-05',
        shipmentStatus: 'Delivered',
        shippingCost: 150,
        currency: 'USD',
        trackingUrl: 'https://www.dhl.com/en/express/tracking.html?AWB=948210334',
        notes: 'Partially delivered. First 4 units received and stored in TLS warehouse.',
        createdAt: '2026-10-01T09:00:00Z',
      },
      {
        shipmentId: 'SHP-TRK-002',
        shipmentType: 'Outbound',
        trackingNumber: 'UPS-1Z9999999999',
        carrier: 'UPS Worldwide',
        referenceNumber: 'OUT-ISS-2026-001',
        partyName: 'Radwell, USA',
        sourceWarehouse: 'WH-001 (TLS, USA)',
        destinationWarehouse: 'Willingboro, NJ',
        shipDate: '2026-10-08',
        expectedDeliveryDate: '2026-10-18',
        shipmentStatus: 'In Transit',
        shippingCost: 85,
        currency: 'USD',
        trackingUrl: 'https://www.ups.com/track?tracknum=1Z9999999999',
        notes: 'Customs cleared, currently scheduled for delivery.',
        createdAt: '2026-10-08T16:00:00Z',
      },
      {
        shipmentId: 'SHP-TRK-003',
        shipmentType: 'Inter-Warehouse',
        trackingNumber: 'FDX-FREIGHT-88210',
        carrier: 'FedEx Freight',
        referenceNumber: 'TRF-2026-001',
        partyName: 'WH-004 (BFLO, USA)',
        sourceWarehouse: 'WH-001 (TLS, USA)',
        destinationWarehouse: 'WH-004 (BFLO, USA)',
        shipDate: '2026-10-12',
        expectedDeliveryDate: '2026-10-19',
        shipmentStatus: 'In Transit',
        shippingCost: 110,
        currency: 'USD',
        trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr=88210',
        notes: 'Inter-warehouse stock transfer: 2 units BMXP342020.',
        createdAt: '2026-10-12T15:00:00Z',
      },
    ];

    // 15. Audit Logs
    this.auditLogs = [
      {
        logId: 'AUD-001',
        userId: 'USR-001',
        userName: 'Imtiaz Khan',
        action: 'OPENING_STOCK_IMPORT',
        entityType: 'StockLedger',
        entityId: 'INIT-2026',
        timestamp: '2026-02-01T08:00:00Z',
        newValues: 'Loaded FY2026 verified opening stock balances across 9 warehouses',
        reason: 'System initialization and migration',
        relatedTransactionId: 'INIT-2026',
      },
      {
        logId: 'AUD-002',
        userId: 'USR-001',
        userName: 'Imtiaz Khan',
        action: 'CONFIRM_RECEIPT',
        entityType: 'IncomingShipment',
        entityId: 'IN-REC-2026-001',
        timestamp: '2026-10-05T14:30:00Z',
        newValues: 'Quantity 4 accepted into WH-001 from PO-2026-101',
        reason: 'Physical delivery confirmation',
        relatedTransactionId: 'MVT-0013',
      },
      {
        logId: 'AUD-003',
        userId: 'USR-001',
        userName: 'Imtiaz Khan',
        action: 'CONFIRM_DISPATCH',
        entityType: 'OutgoingShipment',
        entityId: 'OUT-ISS-2026-001',
        timestamp: '2026-10-08T16:00:00Z',
        newValues: 'Quantity 2 dispatched to Radwell, USA',
        reason: 'Customer sales order dispatch',
        relatedTransactionId: 'MVT-0014',
      },
      {
        logId: 'AUD-004',
        userId: 'USR-001',
        userName: 'Imtiaz Khan',
        action: 'DISPATCH_TRANSFER',
        entityType: 'WarehouseTransfer',
        entityId: 'TRF-2026-001',
        timestamp: '2026-10-12T15:00:00Z',
        newValues: 'Quantity 2 transferred from WH-001 to WH-004 (In Transit)',
        reason: 'Inter-warehouse stock rebalancing',
        relatedTransactionId: 'MVT-0015',
      },
    ];

    // 16. Import Logs
    this.importLogs = [
      {
        importId: 'IMP-001',
        date: '2026-02-01T07:30:00Z',
        sourceFilename: 'legacy_warehouse_master_2026.csv',
        entityType: 'Warehouses',
        totalRows: 9,
        acceptedRows: 9,
        rejectedRows: 0,
        performedBy: 'Imtiaz Khan',
      },
      {
        importId: 'IMP-002',
        date: '2026-02-01T07:45:00Z',
        sourceFilename: 'industrial_electronics_catalog.xlsx',
        entityType: 'Products',
        totalRows: 10,
        acceptedRows: 10,
        rejectedRows: 0,
        performedBy: 'Imtiaz Khan',
      },
    ];
  }

  /**
   * Authoritative Business Logic Calculation:
   * Opening Stock + Confirmed Incoming + Positive Adjustments - Confirmed Outgoing - Negative Adjustments = Calculated Current Stock
   */
  public recalculateAllInventory() {
    const warehouseInventoryMap = new Map<string, WarehouseInventoryItem>();

    // Initialize all product x warehouse pairs that have movements or products
    for (const prod of this.products) {
      for (const wh of this.warehouses) {
        const key = `${wh.warehouseCode}__${prod.itemCode}`;
        warehouseInventoryMap.set(key, {
          warehouse: wh.warehouseCode,
          itemCode: prod.itemCode,
          currentStock: 0,
          adjustment: 0,
          openingStock: 0,
          totalIncoming: 0,
          totalOutgoing: 0,
          reorderStatus: 'Out of Stock',
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    // Process movements sequentially
    for (const mvt of this.stockMovements) {
      const key = `${mvt.warehouse}__${mvt.itemCode}`;
      let item = warehouseInventoryMap.get(key);
      if (!item) {
        item = {
          warehouse: mvt.warehouse,
          itemCode: mvt.itemCode,
          currentStock: 0,
          adjustment: 0,
          openingStock: 0,
          totalIncoming: 0,
          totalOutgoing: 0,
          reorderStatus: 'Out of Stock',
          lastUpdated: mvt.date,
        };
        warehouseInventoryMap.set(key, item);
      }

      if (mvt.movementType === 'Opening Balance') {
        item.openingStock += mvt.quantity;
      } else if (mvt.movementType === 'Receipt' || mvt.movementType === 'Transfer In') {
        item.totalIncoming += mvt.quantity;
      } else if (mvt.movementType === 'Dispatch' || mvt.movementType === 'Transfer Out') {
        item.totalOutgoing += Math.abs(mvt.quantity);
      } else if (mvt.movementType === 'Adjustment') {
        item.adjustment += mvt.quantity;
      }

      if (mvt.movementType === 'Dispatch' || mvt.movementType === 'Transfer Out') {
        item.outDate = mvt.date.split('T')[0];
      }

      // Calculated Current Stock:
      item.currentStock =
        item.openingStock + item.totalIncoming + item.adjustment - item.totalOutgoing;

      const prod = this.products.find((p) => p.itemCode === item!.itemCode);
      const reorderLevel = prod?.reorderLevel || 5;

      if (item.currentStock <= 0) {
        item.reorderStatus = 'Out of Stock';
      } else if (item.currentStock <= reorderLevel) {
        item.reorderStatus = 'Low Stock';
      } else {
        item.reorderStatus = 'Normal';
      }

      item.lastUpdated = mvt.date;
    }

    // Filter to rows that have either stock > 0, movements, or are active catalog items
    this.warehouseInventory = Array.from(warehouseInventoryMap.values()).filter(
      (item) => item.openingStock > 0 || item.totalIncoming > 0 || item.totalOutgoing > 0 || item.currentStock > 0
    );

    // Calculate Consolidated Inventory
    const consolidatedMap = new Map<string, ConsolidatedInventoryItem>();

    for (const prod of this.products) {
      // Find all warehouse inventories for this itemCode
      const whItems = this.warehouseInventory.filter((w) => w.itemCode === prod.itemCode);

      const tlsStock = whItems.find((w) => w.warehouse === 'WH-001')?.currentStock || 0;
      const tollStock = whItems.find((w) => w.warehouse === 'WH-002')?.currentStock || 0;
      const sntStock = whItems.find((w) => w.warehouse === 'WH-003')?.currentStock || 0;
      const bfloStock = whItems.find((w) => w.warehouse === 'WH-004')?.currentStock || 0;
      const usaStock = whItems.find((w) => w.warehouse === 'WH-005')?.currentStock || 0;
      const nmkStock = whItems.find((w) => w.warehouse === 'WH-006')?.currentStock || 0;
      const ajmanStock = whItems.find((w) => w.warehouse === 'WH-007')?.currentStock || 0;
      const pakStock = whItems.find((w) => w.warehouse === 'WH-008')?.currentStock || 0;
      const ksaStock = whItems.find((w) => w.warehouse === 'WH-009')?.currentStock || 0;

      const totalCompanyStock =
        tlsStock +
        tollStock +
        sntStock +
        bfloStock +
        usaStock +
        nmkStock +
        ajmanStock +
        pakStock +
        ksaStock;

      // Calculate stock in transit (transfers that are 'In Transit')
      const inTransitTransfers = this.warehouseTransfers.filter(
        (t) => t.itemCode === prod.itemCode && t.transferStatus === 'In Transit'
      );
      const stockInTransit = inTransitTransfers.reduce((acc, t) => acc + t.quantity, 0);

      // Calculate reserved stock (sales orders / draft issues that are reserved)
      const reservedIssues = this.outgoingShipments.filter(
        (o) => o.itemCode === prod.itemCode && o.shipmentStatus === 'Reserved'
      );
      const reservedStock = reservedIssues.reduce((acc, o) => acc + o.quantityIssued, 0);

      const availableStock = Math.max(0, totalCompanyStock - reservedStock);

      consolidatedMap.set(prod.itemCode, {
        itemCode: prod.itemCode,
        standardizedItemCode: prod.standardizedItemCode || prod.itemCode,
        itemDescription: prod.itemName,
        manufacturer: prod.manufacturer,
        condition: prod.condition,
        unitCost: prod.defaultUnitCost,
        currency: prod.currency,
        totalCompanyStock,
        availableStock,
        reservedStock,
        stockInTransit,
        tls: tlsStock,
        toll: tollStock,
        bflo: bfloStock,
        nmk: nmkStock,
        pak: pakStock,
        ksa: ksaStock,
        snt: sntStock,
        usa: usaStock,
        ajman: ajmanStock,
        lastUpdated: new Date().toISOString(),
      });
    }

    this.consolidatedInventory = Array.from(consolidatedMap.values());
  }

  // Audit helper
  public logAudit(userId: string, userName: string, action: string, entityType: string, entityId: string, newValues?: string, reason?: string, relatedId?: string) {
    const log: AuditLog = {
      logId: `AUD-${Date.now().toString().slice(-6)}`,
      userId,
      userName,
      action,
      entityType,
      entityId,
      timestamp: new Date().toISOString(),
      newValues,
      reason,
      relatedTransactionId: relatedId,
    };
    this.auditLogs.unshift(log);
  }

  // Check available stock in a specific warehouse
  public getAvailableStock(warehouseCode: string, itemCode: string): number {
    const item = this.warehouseInventory.find(
      (w) => w.warehouse === warehouseCode && w.itemCode === itemCode
    );
    return item ? item.currentStock : 0;
  }
}

export const erpStore = new ERPStore();
