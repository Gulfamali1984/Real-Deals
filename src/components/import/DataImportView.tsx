import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Download,
  Info,
  Check,
} from 'lucide-react';
import { ImportLog, Warehouse, Product } from '../../types/erp';

interface DataImportViewProps {
  importLogs: ImportLog[];
  warehouses: Warehouse[];
  products: Product[];
  onCommitImport: (payload: { entityType: string; rows: any[]; filename?: string }) => Promise<{
    accepted: number;
    rejected: number;
    errors: string[];
  }>;
}

export const DataImportView: React.FC<DataImportViewProps> = ({
  importLogs,
  warehouses,
  products,
  onCommitImport,
}) => {
  const [selectedEntity, setSelectedEntity] = useState<'Products' | 'OpeningStock' | 'Customers'>('Products');
  const [rawCsvText, setRawCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validationReport, setValidationReport] = useState<{
    validCount: number;
    invalidCount: number;
    issues: string[];
  } | null>(null);
  const [isDryRun, setIsDryRun] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<{
    accepted: number;
    rejected: number;
    errors: string[];
  } | null>(null);

  // Sample CSV Presets for easy user testing
  const loadSamplePreset = (type: 'Products' | 'OpeningStock' | 'Customers') => {
    setSelectedEntity(type);
    setValidationReport(null);
    setCommitResult(null);

    if (type === 'Products') {
      setRawCsvText(
`itemCode,itemName,description,manufacturer,category,condition,defaultUnitCost,currency
6ES7516-3FN02-0AB0,SIMATIC S7-1500F CPU 1516F-3 PN/DP,Fail-Safe Central Processing Unit 1.5MB Code,Siemens,PLC CPU,New in Box,2940,USD
1756-L83E,ControlLogix 5580 Controller 10MB,High Performance Controller with 1Gbps Ethernet Port,Allen-Bradley / Rockwell,PLC CPU,New in Box,3850,USD
140CPS11420,Modicon Quantum Power Supply,115/230VAC 11A Standalone Power Supply,Schneider Electric,Power Supplies,Used,380,USD
MDX61B0011-5A3-4-00,Movidrive B Drive Inverter,Drive inverter 1.1kW 3-Phase 380-500V,SEW-Eurodrive,Drives & Inverters,Tested,750,USD`
      );
    } else if (type === 'OpeningStock') {
      setRawCsvText(
`warehouse,itemCode,quantity,unitCost,serialNumber
WH-001,140ACI03000,5,480,SN-SCH-9081
WH-002,6ES7515-2AM01-0AB0,2,1850,SN-SIE-1021
WH-004,1756-L73,2,3100,SN-AB-8802
WH-006,BMXP342020,3,920,SN-M34-3310`
      );
    } else if (type === 'Customers') {
      setRawCsvText(
`customerName,standardizedName,contactPerson,email,country,customerType
Radwell Deutschland GmbH,Radwell International LLC,Klaus Mueller,de-orders@radwell.de,Germany,Distributor
Apex Industrial Automation FZE,Apex Automation Solutions LLC,Fadi Haddad,procure@apex-fze.ae,UAE,System Integrator
Aramco Oilfield Services,Saudi Aramco Maintenance Services,Saad Al-Ghamdi,contracts@aramco-services.com,Saudi Arabia,End User`
      );
    }
  };

  // Simple RFC 4180 CSV parser
  const parseCSV = () => {
    if (!rawCsvText.trim()) return;

    const lines = rawCsvText.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return;

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const rowObj: any = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] !== undefined ? values[idx] : '';
      });
      return rowObj;
    });

    setParsedRows(rows);

    // Validate rows
    let valid = 0;
    let invalid = 0;
    const issues: string[] = [];

    rows.forEach((row, idx) => {
      let rowValid = true;
      if (selectedEntity === 'Products') {
        if (!row.itemCode || !row.itemName) {
          rowValid = false;
          issues.push(`Row #${idx + 1}: Missing itemCode or itemName.`);
        }
        if (products.some((p) => p.itemCode.toLowerCase() === row.itemCode.toLowerCase())) {
          rowValid = false;
          issues.push(`Row #${idx + 1}: Item Code "${row.itemCode}" already exists in product catalog.`);
        }
      } else if (selectedEntity === 'OpeningStock') {
        if (!row.warehouse || !row.itemCode || !row.quantity) {
          rowValid = false;
          issues.push(`Row #${idx + 1}: Missing warehouse, itemCode, or quantity.`);
        }
        if (!warehouses.some((w) => w.warehouseCode === row.warehouse)) {
          rowValid = false;
          issues.push(`Row #${idx + 1}: Warehouse "${row.warehouse}" does not match any of the 9 warehouse masters.`);
        }
        if (Number(row.quantity) <= 0) {
          rowValid = false;
          issues.push(`Row #${idx + 1}: Quantity must be greater than zero.`);
        }
      } else if (selectedEntity === 'Customers') {
        if (!row.customerName) {
          rowValid = false;
          issues.push(`Row #${idx + 1}: Missing customerName.`);
        }
      }

      if (rowValid) valid++;
      else invalid++;
    });

    setValidationReport({
      validCount: valid,
      invalidCount: invalid,
      issues,
    });
  };

  const handleCommit = async () => {
    if (parsedRows.length === 0) return;
    setIsCommitting(true);
    try {
      const res = await onCommitImport({
        entityType: selectedEntity,
        rows: parsedRows,
        filename: `${selectedEntity.toLowerCase()}_batch_import.csv`,
      });
      setCommitResult(res);
      setParsedRows([]);
      setValidationReport(null);
      setRawCsvText('');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Enterprise Data Import Center
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              (CSV / Excel / Google Sheets Migration)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Stage and migrate legacy catalog items, opening stock balances, and partner directories with duplicate detection and dry-run validation.
          </p>
        </div>
      </div>

      {/* Target Entity Selection & Sample Presets */}
      <div className="rounded border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">Select Target Entity:</label>
            <select
              value={selectedEntity}
              onChange={(e) => {
                setSelectedEntity(e.target.value as any);
                setValidationReport(null);
                setCommitResult(null);
                setParsedRows([]);
              }}
              className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 outline-none font-medium cursor-pointer"
            >
              <option value="Products">Products & Parts Catalog</option>
              <option value="OpeningStock">Opening Stock Balances (Movements)</option>
              <option value="Customers">Customer Directory</option>
            </select>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Load Template / Preset:</span>
            <button
              onClick={() => loadSamplePreset('Products')}
              className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
            >
              Products Catalog
            </button>
            <button
              onClick={() => loadSamplePreset('OpeningStock')}
              className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
            >
              Opening Balances
            </button>
            <button
              onClick={() => loadSamplePreset('Customers')}
              className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
            >
              Customer Master
            </button>
          </div>
        </div>

        {/* CSV Textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Paste CSV Data or Edit Values (First line must be header names):
          </label>
          <textarea
            rows={6}
            value={rawCsvText}
            onChange={(e) => setRawCsvText(e.target.value)}
            placeholder="Paste CSV contents here..."
            className="w-full rounded border border-slate-300 p-3 font-mono text-xs text-slate-800 outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={parseCSV}
            disabled={!rawCsvText.trim()}
            className="flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Parse & Validate Data</span>
          </button>
        </div>
      </div>

      {/* Validation Result Box */}
      {validationReport && (
        <div className="rounded border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Dry-Run Validation Results
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-emerald-700 font-semibold font-mono tabular-nums">
                ✓ {validationReport.validCount} Valid Rows
              </span>
              {validationReport.invalidCount > 0 && (
                <span className="text-red-600 font-semibold font-mono tabular-nums">
                  ⚠ {validationReport.invalidCount} Rejected Rows
                </span>
              )}
            </div>
          </div>

          {validationReport.issues.length > 0 && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700 space-y-1">
              <div className="font-semibold">Issues Detected:</div>
              <ul className="list-disc list-inside space-y-0.5">
                {validationReport.issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Table Preview */}
          {parsedRows.length > 0 && (
            <div className="rounded border border-slate-200 overflow-x-auto max-h-60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-semibold">
                  <tr>
                    {Object.keys(parsedRows[0]).map((h) => (
                      <th key={h} className="py-2 px-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {parsedRows.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {Object.values(row).map((v: any, cIdx) => (
                        <td key={cIdx} className="py-1.5 px-3 whitespace-nowrap">
                          {String(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleCommit}
              disabled={isCommitting || validationReport.validCount === 0}
              className="flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors"
            >
              <Check className="h-4 w-4" />
              <span>{isCommitting ? 'Committing...' : `Commit ${validationReport.validCount} Valid Rows to Database`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {commitResult && (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <strong className="font-semibold">Import Complete:</strong> Successfully committed {commitResult.accepted} records to the live ERP database and updated inventory balances.
            </div>
          </div>
        </div>
      )}

      {/* Import Audit Logs */}
      <div className="rounded border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Import History & Source Audit Log
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Import ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Source File</th>
                <th className="py-2.5 px-3">Entity Type</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-right text-emerald-700">Accepted</th>
                <th className="py-2.5 px-3 text-right text-red-600">Rejected</th>
                <th className="py-2.5 px-3">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {importLogs.map((log) => (
                <tr key={log.importId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                    {log.importId}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(log.date).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{log.sourceFilename}</td>
                  <td className="py-2.5 px-3">{log.entityType}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">{log.totalRows}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-emerald-700">
                    {log.acceptedRows}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-red-600">
                    {log.rejectedRows}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{log.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
