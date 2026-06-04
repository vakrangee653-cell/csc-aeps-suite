import React, { useState } from 'react';
import { BarChart3, Printer, Calendar, ListChecks, UserMinus, FileUp } from 'lucide-react';
import { Transaction, Customer } from '../types';

interface ReportsHubProps {
  transactions: Transaction[];
  customers: Customer[];
}

export default function ReportsHub({ transactions, customers }: ReportsHubProps) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState<'ledger' | 'dues' | 'pl'>('pl');

  // Quick select date ranges
  const setQuickDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const setThisMonthRange = () => {
    const start = new Date();
    start.setDate(1); 
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
  };

  const setAllTimeRange = () => {
    setStartDate('2026-01-01');
    setEndDate(new Date().toISOString().split('T')[0]);
  };

  // Filtered lists depending on selected start/end dates
  const filteredTx = transactions.filter(t => t.date >= startDate && t.date <= endDate);
  const filteredCustomers = customers.filter(c => c.date >= startDate && c.date <= endDate);

  // Compute values within range
  const rangeLedgerIncome = filteredTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const rangeLedgerExpense = filteredTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  
  const rangeCustMargins = filteredCustomers.reduce((sum, c) => sum + c.commission, 0);
  const rangeDuesOutstanding = filteredCustomers.reduce((sum, c) => sum + c.dues, 0);

  const profitLossTotalMargin = rangeCustMargins - rangeLedgerExpense;

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to launch print jobs.");
      return;
    }

    const title = reportType === 'ledger' ? 'Ledger statement' : reportType === 'dues' ? 'Dues statement' : 'Profit & Loss Statement';
    let contentHtml = '';

    if (reportType === 'ledger') {
      contentHtml = `
        <div class="report-box">
          <h2 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px;">Cashbook Ledger Report</h2>
          <p style="text-align: center; font-size: 12px; color: #555;">Range: ${startDate} to ${endDate}</p>
          <div style="display: flex; justify-content: space-around; margin: 20px 0; font-weight: bold; background: #eee; padding: 10px;">
            <span>Total Cash In: ₹${rangeLedgerIncome.toFixed(2)}</span>
            <span>Total Spend: ₹${rangeLedgerExpense.toFixed(2)}</span>
            <span>Net Balance: ₹${(rangeLedgerIncome - rangeLedgerExpense).toFixed(2)}</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background-color: #ddd;">
                <th style="padding: 8px; border: 1px solid #aaa;">Date</th>
                <th style="padding: 8px; border: 1px solid #aaa;">Type</th>
                <th style="padding: 8px; border: 1px solid #aaa;">Category</th>
                <th style="padding: 8px; border: 1px solid #aaa;">Method</th>
                <th style="padding: 8px; border: 1px solid #aaa; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTx.map(t => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #aaa;">${t.date}</td>
                  <td style="padding: 8px; border: 1px solid #aaa; font-weight: bold; text-transform: uppercase;">${t.type}</td>
                  <td style="padding: 8px; border: 1px solid #aaa;">${t.category}</td>
                  <td style="padding: 8px; border: 1px solid #aaa;">${t.paymentMode}</td>
                  <td style="padding: 8px; border: 1px solid #aaa; text-align: right; font-weight: bold;">₹${t.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (reportType === 'dues') {
      contentHtml = `
        <div class="report-box">
          <h2 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px;">Outstanding Client Dues List</h2>
          <p style="text-align: center; font-size: 12px; color: #555;">Range: ${startDate} to ${endDate}</p>
          <div style="text-align: right; font-weight: bold; padding: 10px; margin-bottom: 10px; background: #eee;">
            Estimated Outstanding: ₹${rangeDuesOutstanding.toFixed(2)}
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background-color: #ddd;">
                <th style="padding: 8px; border: 1px solid #aaa;">Date</th>
                <th style="padding: 8px; border: 1px solid #aaa;">Name</th>
                <th style="padding: 8px; border: 1px solid #aaa;">Mobile</th>
                <th style="padding: 8px; border: 1px solid #aaa;">Service</th>
                <th style="padding: 8px; border: 1px solid #aaa; text-align: right;">Dues Balance</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCustomers.filter(c => c.dues > 0).map(c => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #aaa;">${c.date}</td>
                  <td style="padding: 8px; border: 1px solid #aaa; font-weight: bold;">${c.name}</td>
                  <td style="padding: 8px; border: 1px solid #aaa;">${c.phone}</td>
                  <td style="padding: 8px; border: 1px solid #aaa;">${c.serviceName}</td>
                  <td style="padding: 8px; border: 1px solid #aaa; text-align: right; font-weight: bold; color: #b45309;">₹${c.dues.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      contentHtml = `
        <div class="report-box">
          <h2 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px;">Commercial Profit & Loss Account</h2>
          <p style="text-align: center; font-size: 12px; color: #555;">Range: ${startDate} to ${endDate}</p>
          
          <div style="margin: 20px 0; line-height: 1.6; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd;">
              <span><strong>(+) Customer billing service margins:</strong></span>
              <span style="color: green; font-weight: bold;">+ ₹${rangeCustMargins.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd;">
              <span><strong>(-) Stationery / Rent / Network expenses out:</strong></span>
              <span style="color: red; font-weight: bold;">- ₹${rangeLedgerExpense.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 16px; font-weight: bold; background: #ddd; padding: 10px;">
              <span>Net profit margin balance:</span>
              <span style="${profitLossTotalMargin >= 0 ? 'color: green' : 'color: red'}">₹${profitLossTotalMargin.toFixed(2)}</span>
            </div>
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { margin: 20mm; font-family: sans-serif; color: #111; background-color: #fff; }
            .report-box { max-width: 800px; margin: 0 auto; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #aaa; padding: 10px; text-align: left; }
            @page { size: A4; margin: 15mm; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${contentHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col gap-5">
      
      <div className="panel-header">
        <h2 className="panel-title">
          <BarChart3 className="w-5 h-5 shrink-0" />
          VLE Reports & P&L Statement Center
        </h2>
      </div>

      <div className="tool-layout">
        
        {/* FILTERS PANEL */}
        <div className="config-card p-5 gap-3.5">
          <h3 className="font-bold text-gray-950 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
            1. Fine-Tune date constraints
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <button onClick={() => setQuickDateRange(0)} className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-900 border rounded-lg">Today</button>
            <button onClick={() => setQuickDateRange(7)} className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-900 border rounded-lg">Last 7 Days</button>
            <button onClick={setThisMonthRange} className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-900 border rounded-lg">This Month</button>
            <button onClick={setAllTimeRange} className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-900 border rounded-lg">All Time</button>
          </div>

          <h3 className="font-bold text-gray-950 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2 pt-2">
            2. Choose statement mode
          </h3>

          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setReportType('pl')}
              className={`p-3 text-left font-bold text-xs rounded-xl flex items-center gap-2 border ${reportType === 'pl' ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400' : 'border-gray-200 text-gray-600'}`}
            >
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Center Profit & Loss account statement
            </button>

            <button 
              onClick={() => setReportType('ledger')}
              className={`p-3 text-left font-bold text-xs rounded-xl flex items-center gap-2 border ${reportType === 'ledger' ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' : 'border-gray-200 text-gray-600'}`}
            >
              <Calendar className="w-4 h-4 text-emerald-500" />
              Cashbook Operations Ledger statement
            </button>

            <button 
              onClick={() => setReportType('dues')}
              className={`p-3 text-left font-bold text-xs rounded-xl flex items-center gap-2 border ${reportType === 'dues' ? 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400' : 'border-gray-200 text-gray-600'}`}
            >
              <UserMinus className="w-4 h-4 text-amber-500" />
              Outstanding debt dues checklist
            </button>
          </div>
        </div>

        {/* STATEMENT VIEW COLUMN */}
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900/40 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl max-h-[400px] overflow-y-auto">
            <h3 className="font-extrabold text-xs uppercase tracking-widest text-[#06B6D4] mb-3">Workspace print proof</h3>
            
            {/* RENDER P&L PROOF */}
            {reportType === 'pl' && (
              <div className="bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 p-4 rounded-xl text-left select-none text-xs">
                <div className="text-center font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2 mb-4">
                  <div>VLE Commercial P&L Account</div>
                  <div className="text-[10px] text-gray-400 font-bold tracking-wider mt-1">{startDate} to {endDate}</div>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800">
                  <span>Gross margins from billing commissions</span>
                  <span className="font-extrabold text-emerald-500">+₹{rangeCustMargins.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-850">
                  <span>Cumulative Ledger expenses (Stationery/Rent)</span>
                  <span className="font-extrabold text-rose-500">-₹{rangeLedgerExpense.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center py-3 bg-blue-500/5 p-3 rounded-xl mt-4 font-bold text-gray-950 dark:text-white">
                  <span>Absolute Net profit range balance</span>
                  <span className={profitLossTotalMargin >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                    ₹{profitLossTotalMargin.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* RENDER LEDGER PROOF */}
            {reportType === 'ledger' && (
              <div className="bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 p-4 rounded-xl text-left text-xs select-none max-h-[300px] overflow-y-auto">
                <div className="text-center font-bold border-b border-gray-200 dark:border-gray-800 pb-2 mb-3">
                  <div>Ledger Operation summaries</div>
                  <div className="text-[10px] text-gray-400">{startDate} to {endDate}</div>
                </div>
                
                {filteredTx.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 font-bold">Entries range empty</div>
                ) : (
                  filteredTx.map(t => (
                    <div key={t.id} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-850">
                      <div>
                        <div className="font-bold">{t.category}</div>
                        <div className="text-[10px] text-gray-400">{t.date} ({t.paymentMode})</div>
                      </div>
                      <span className={`font-black ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {t.type === 'income' ? '+' : '-'}₹{t.amount.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* RENDER DUES PROOF */}
            {reportType === 'dues' && (
              <div className="bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 p-4 rounded-xl text-left text-xs select-none max-h-[300px] overflow-y-auto">
                <div className="text-center font-bold border-b border-gray-200 dark:border-gray-800 pb-2 mb-3">
                  <div>Outstanding Client debt Checklist</div>
                  <div className="text-[10px] text-gray-400 font-extrabold">{startDate} to {endDate}</div>
                </div>

                {filteredCustomers.filter(c => c.dues > 0).length === 0 ? (
                  <div className="text-center py-6 text-gray-400 font-bold">No outstanding client dues found</div>
                ) : (
                  filteredCustomers.filter(c => c.dues > 0).map(c => (
                    <div key={c.id} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-850">
                      <div>
                        <div className="font-bold">{c.name}</div>
                        <div className="text-[10px] text-gray-400">{c.phone} • {c.serviceName}</div>
                      </div>
                      <span className="font-black text-amber-500">
                        ₹{c.dues.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>

          <button onClick={handlePrintReport} className="btn-primary py-3.5 flex items-center justify-center gap-2">
            <Printer className="w-5 h-5 shrink-0" />
            Launch printable job Statement
          </button>
        </div>

      </div>

    </div>
  );
}
