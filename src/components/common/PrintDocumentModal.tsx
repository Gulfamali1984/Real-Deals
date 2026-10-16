import React from 'react';
import { Printer, X, Download } from 'lucide-react';
import { IncomingShipment, OutgoingShipment, PurchaseOrder } from '../../types/erp';

interface PrintDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'GRN' | 'DISPATCH_NOTE' | 'PACKING_LIST' | 'PO';
  data: any;
}

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({
  isOpen,
  onClose,
  documentType,
  data,
}) => {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 print:p-0 print:bg-white">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none">
        {/* Action Toolbar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Document Preview: {documentType.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Document</span>
            </button>
            <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-8 print:p-0 space-y-6 text-slate-900 font-sans">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-300 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-slate-900 text-white font-bold flex items-center justify-center text-sm rounded">
                  AP
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  ApexPulse Industrial Automation
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Global Warehousing &amp; Electronics Procurement
              </p>
              <p className="text-[11px] text-slate-400">
                1400 Industrial Blvd, Houston TX 77001 · JAFZA Dubai · Munich DE
              </p>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold uppercase tracking-wider text-slate-900">
                {documentType === 'GRN'
                  ? 'GOODS RECEIPT NOTE'
                  : documentType === 'DISPATCH_NOTE'
                  ? 'DISPATCH NOTE'
                  : documentType === 'PACKING_LIST'
                  ? 'PACKING LIST'
                  : 'PURCHASE ORDER'}
              </div>
              <div className="font-mono text-sm font-semibold text-slate-700 mt-1">
                Doc Ref: {data.receiptId || data.issueId || data.poNumber || 'N/A'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Date: {new Date().toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Details Box */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px]">
                {documentType === 'GRN' ? 'Supplier Details' : 'Consignee / Customer'}
              </span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {data.supplier || data.customer || 'Party on file'}
              </div>
              <div className="text-slate-600 mt-1">
                Warehouse Hub:{' '}
                <strong className="text-slate-800">{data.warehouse || data.destinationWarehouse}</strong>
              </div>
              <div className="text-slate-600">
                Carrier Tracking: <strong className="font-mono text-slate-800">{data.trackingNo || 'N/A'}</strong>
              </div>
            </div>

            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px]">
                Reference Documents
              </span>
              <div className="text-slate-800 mt-1">
                PO Reference: <strong className="font-mono">{data.purchaseOrderNumber || data.po || '—'}</strong>
              </div>
              {data.salesOrderNumber && (
                <div className="text-slate-800">
                  Sales Order #: <strong className="font-mono">{data.salesOrderNumber}</strong>
                </div>
              )}
              <div className="text-slate-800">
                Authorized By: <strong className="text-slate-900">{data.receivedBy || data.issuedBy || 'Operations Lead'}</strong>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-300 rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px] text-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Item Code</th>
                  <th className="py-2.5 px-3">Part Description</th>
                  <th className="py-2.5 px-3">Condition</th>
                  <th className="py-2.5 px-3">Serial Numbers</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {data.itemCode}
                  </td>
                  <td className="py-3 px-3 text-slate-800 font-medium">
                    {data.itemName || data.description || 'Industrial Automation Module'}
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {data.condition || 'New in Box'}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                    {data.serialNumbers && data.serialNumbers.length > 0
                      ? data.serialNumbers.join(', ')
                      : data.serialNumber || 'Non-serialized / Lot tracked'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                    {data.quantityReceived || data.quantityIssued || data.quantityOrdered || 1}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Inspection and Sign-off */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs">
            <div>
              <div className="font-semibold text-slate-700">Warehouse Receiving &amp; QA Inspection:</div>
              <div className="h-14 border-b border-slate-400 mt-2"></div>
              <div className="text-[11px] text-slate-400 mt-1">
                Authorized Inspector Signature / Stamp &amp; Date
              </div>
            </div>

            <div>
              <div className="font-semibold text-slate-700">Carrier / Consignee Acceptance:</div>
              <div className="h-14 border-b border-slate-400 mt-2"></div>
              <div className="text-[11px] text-slate-400 mt-1">
                Received in Good Order &amp; Sealed Condition
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
