import React, { useState } from 'react';
import { 
  Wallet, PlusCircle, Search, RefreshCw, UserPlus, 
  Briefcase, Edit3, Trash2, Milestone, ArrowRightLeft, DollarSign 
} from 'lucide-react';
import { Transaction, Customer, ServiceItem, WalletTransaction } from '../types';

interface CspManagerProps {
  transactions: Transaction[];
  customers: Customer[];
  services: ServiceItem[];
  walletTransactions: WalletTransaction[];
  walletBalance: number;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  onAddCustomer: (cust: Omit<Customer, 'id' | 'dues' | 'commission'>) => void;
  onDeleteCustomer: (id: string) => void;
  onClearCustomerDues: (customerId: string, amount: number) => void;
  onAddWalletTransaction: (wt: Omit<WalletTransaction, 'id' | 'balanceAfter'>) => void;
  onAddCustomService: (srv: Omit<ServiceItem, 'id' | 'isCustom'>) => void;
  onDeleteCustomService: (id: string) => void;
  onResetServices: () => void;
}

export default function CspManager({
  transactions, customers, services, walletTransactions, walletBalance,
  onAddTransaction, onDeleteTransaction, onAddCustomer, onDeleteCustomer,
  onClearCustomerDues, onAddWalletTransaction, onAddCustomService, onDeleteCustomService, onResetServices
}: CspManagerProps) {
  const [activeTab, setActiveTab] = useState<'ledger' | 'customers' | 'rates' | 'wallet'>('ledger');

  // TAB 1: Ledger form states
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txMode, setTxMode] = useState<'Cash' | 'UPI / GPay' | 'Net Banking'>('Cash');
  const [txCategory, setTxCategory] = useState('Service Charge');
  const [txDesc, setTxDesc] = useState('');
  const [searchLedger, setSearchLedger] = useState('');

  // TAB 2: Customer form states
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custDate, setCustDate] = useState(new Date().toISOString().split('T')[0]);
  const [custAddress, setCustAddress] = useState('');
  const [custServiceId, setCustServiceId] = useState(services[0]?.id || '');
  const [custCharge, setCustCharge] = useState('');
  const [custPaid, setCustPaid] = useState('');
  const [custWorkStatus, setCustWorkStatus] = useState<'Pending' | 'Processing' | 'Complete'>('Complete');
  const [isManualService, setIsManualService] = useState(false);
  const [custManualServiceName, setCustManualServiceName] = useState('');
  const [searchCustomers, setSearchCustomers] = useState('');

  // TAB 3: Custom Rate Services state & Modal
  const [rateFilter, setRateFilter] = useState<string>('all');
  const [rateSearch, setRateSearch] = useState('');
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [newSrvName, setNewSrvName] = useState('');
  const [newSrvCat, setNewSrvCat] = useState<'Government' | 'Banking' | 'Insurance' | 'Recharge' | 'Other'>('Government');
  const [newSrvGovtFee, setNewSrvGovtFee] = useState('');
  const [newSrvCustFee, setNewSrvCustFee] = useState('');

  // TAB 4: Wallet load state
  const [walletAmount, setWalletAmount] = useState('');
  const [walletDate, setWalletDate] = useState(new Date().toISOString().split('T')[0]);
  const [walletSource, setWalletSource] = useState('Cash');
  const [walletDesc, setWalletDesc] = useState('');
  const [searchWallet, setSearchWallet] = useState('');

  // Auto fee filler on product selector
  React.useEffect(() => {
    if (custServiceId && custServiceId !== 'manual') {
      const selected = services.find(s => s.id === custServiceId);
      if (selected) {
        setCustCharge(String(selected.custFee));
        setIsManualService(false);
      }
    } else if (custServiceId === 'manual') {
      setIsManualService(true);
      setCustCharge('');
    }
  }, [custServiceId, services]);

  // Ledger stats
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netLedgerBalance = totalIncome - totalExpense;

  // Customer stats
  const totalCustomersCount = customers.length;
  const totalCustomerDues = customers.reduce((sum, c) => sum + c.dues, 0);

  // Quick Pay Out wallet calculation
  const totalWalletDebited = walletTransactions.filter(w => w.type === 'debit').reduce((sum, w) => sum + w.amount, 0);

  // Tab 3 Rate Cards filtering
  const filteredServices = services.filter(srv => {
    const matchesCat = rateFilter === 'all' || srv.category === rateFilter;
    const matchesSearch = srv.name.toLowerCase().includes(rateSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleLogTransaction = () => {
    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    onAddTransaction({
      type: txType,
      amount: amt,
      date: txDate,
      category: txCategory,
      paymentMode: txMode,
      description: txDesc || 'No notes'
    });
    setTxAmount('');
    setTxDesc('');
    alert('Cash ledger transaction saved!');
  };

  const handleLogCustomer = () => {
    if (!custName || !custPhone) {
      alert('Name and mobile numbers are required fields.');
      return;
    }
    const chargeVal = parseFloat(custCharge) || 0;
    const paidVal = parseFloat(custPaid) || 0;

    let srvName = '';
    let finalServiceId = custServiceId;

    if (custServiceId === 'manual') {
      srvName = custManualServiceName || 'Manual Custom Service';
      finalServiceId = 'srv_custom_manual';
    } else {
      const selected = services.find(s => s.id === custServiceId);
      srvName = selected ? selected.name : 'CSC Service';
    }

    onAddCustomer({
      name: custName,
      phone: custPhone,
      date: custDate,
      address: custAddress || 'Not Provided',
      serviceId: finalServiceId,
      serviceName: srvName,
      charge: chargeVal,
      paid: paidVal,
      workStatus: custWorkStatus
    });

    setCustName('');
    setCustPhone('');
    setCustAddress('');
    setCustPaid('');
    setCustManualServiceName('');
    alert('Billing recorded successfully!');
  };

  const handleSaveCustomService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSrvName) {
      alert('Please enter a service name.');
      return;
    }
    const govt = parseFloat(newSrvGovtFee) || 0;
    const cust = parseFloat(newSrvCustFee) || 0;

    onAddCustomService({
      name: newSrvName,
      category: newSrvCat,
      govtFee: govt,
      custFee: cust,
      commission: Math.max(0, cust - govt)
    });

    setNewSrvName('');
    setNewSrvGovtFee('');
    setNewSrvCustFee('');
    setIsServiceModalOpen(false);
    alert('Custom Service rate added!');
  };

  const handleWalletLoad = () => {
    const amt = parseFloat(walletAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter credit top-up amount.');
      return;
    }

    onAddWalletTransaction({
      date: walletDate,
      type: 'credit',
      amount: amt,
      sourceOrDestination: walletSource,
      description: walletDesc || 'Wallet load via custom GPay / Cash balance'
    });

    setWalletAmount('');
    setWalletDesc('');
    alert('Money loaded successfully! Wallet balance updated.');
  };

  // List filters
  const filteredTransactions = transactions.filter(t => 
    t.category.toLowerCase().includes(searchLedger.toLowerCase()) ||
    t.description.toLowerCase().includes(searchLedger.toLowerCase())
  );

  const filteredCustomersList = customers.filter(c => 
    c.name.toLowerCase().includes(searchCustomers.toLowerCase()) ||
    c.phone.includes(searchCustomers) ||
    c.serviceName.toLowerCase().includes(searchCustomers.toLowerCase())
  );

  const filteredWalletList = walletTransactions.filter(w => 
    w.description.toLowerCase().includes(searchWallet.toLowerCase()) ||
    w.sourceOrDestination.toLowerCase().includes(searchWallet.toLowerCase())
  );

  const selectedServiceObj = services.find(s => s.id === custServiceId);
  const tempCharge = parseFloat(custCharge) || 0;
  const tempPaid = parseFloat(custPaid) || 0;
  const liveCommission = selectedServiceObj ? Math.max(0, tempCharge - selectedServiceObj.govtFee) : Math.max(0, tempCharge * 0.4);
  const calculatedDues = Math.max(0, tempCharge - tempPaid);

  return (
    <div className="flex flex-col gap-5">
      
      <div className="panel-header">
        <h2 className="panel-title">
          <Wallet className="w-5 h-5 shrink-0" />
          VLE Center Business Manager (CSP & Wallet)
        </h2>
      </div>

      <div className="form-tabs text-xs select-none">
        <button 
          className={`form-tab ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          🔑 Income & Expense Ledger
        </button>
        <button 
          className={`form-tab ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          👤 Customer directory & Dues
        </button>
        <button 
          className={`form-tab ${activeTab === 'rates' ? 'active' : ''}`}
          onClick={() => setActiveTab('rates')}
        >
          📂 Service Rates Config
        </button>
        <button 
          className={`form-tab ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          🪙 CSC Portal Wallet Passbook
        </button>
      </div>

      {/* TAB 1: Ledger layout */}
      {activeTab === 'ledger' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-xl text-center">
              <span className="text-emerald-500 font-extrabold text-3xl">₹{totalIncome.toFixed(2)}</span>
              <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">Total Ledger Income</div>
            </div>
            <div className="bg-rose-500/5 border border-rose-500/10 p-5 rounded-xl text-center">
              <span className="text-rose-500 font-extrabold text-3xl">₹{totalExpense.toFixed(2)}</span>
              <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">Total Ledger Expenses</div>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-xl text-center">
              <span className="text-blue-500 font-extrabold text-3xl">₹{netLedgerBalance.toFixed(2)}</span>
              <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">Net Cash Flow</div>
            </div>
          </div>

          <div className="tool-layout">
            <div className="config-card">
              <h3 className="font-bold border-b border-gray-100 dark:border-gray-800 pb-2">Log Cash Operation</h3>
              
              <div className="form-group">
                <label>Operation Type</label>
                <select value={txType} onChange={(e) => setTxType(e.target.value as any)}>
                  <option value="income">Income (Cash In / Revenue)</option>
                  <option value="expense">Expense (Cash Out / Office Spend)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input type="number" placeholder="0.00" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Payment Target Date</label>
                  <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Payment Method</label>
                  <select value={txMode} onChange={(e) => setTxMode(e.target.value as any)}>
                    <option value="Cash">Cash</option>
                    <option value="UPI / GPay">UPI / GPay</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Business Category</label>
                  <select value={txCategory} onChange={(e) => setTxCategory(e.target.value)}>
                    <option value="Service Charge">Customer Service Charge</option>
                    <option value="CSC Commision">CSC Portal Commission</option>
                    <option value="Internet / Electricity">Internet / Cable</option>
                    <option value="Shop Rent">Office rent</option>
                    <option value="Stationery / Paper">Paper & spiral coils</option>
                    <option value="Staff Salary">Staff Wages</option>
                    <option value="Other Utility">Other Overheads</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description note</label>
                <input type="text" placeholder="e.g. spiral binding paper roll and custom copies" value={txDesc} onChange={(e) => setTxDesc(e.target.value)} />
              </div>

              <button onClick={handleLogTransaction} className="btn-primary mt-2 flex items-center justify-center gap-2">
                <PlusCircle className="w-4 h-4" /> Save Operation Entry
              </button>
            </div>

            {/* LEDGER DATA TABLE */}
            <div className="config-card overflow-x-auto">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2 flex-wrap gap-2">
                <h3 className="font-bold">Operations Cashbook Ledger</h3>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search ledger..." 
                    value={searchLedger}
                    onChange={(e) => setSearchLedger(e.target.value)}
                    className="p-1.5 pl-8 border rounded-lg text-xs"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse mt-2">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Type</th>
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5">Payment</th>
                    <th className="py-2.5 text-right">Amount</th>
                    <th className="py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-400">No ledger reports found</td>
                    </tr>
                  ) : (
                    filteredTransactions.map(tx => (
                      <tr key={tx.id} className="border-b border-gray-50 dark:border-gray-850 hover:bg-gray-100/5">
                        <td className="py-2.5 font-mono">{tx.date}</td>
                        <td className="py-2.5 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] text-center ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-rose-500'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-2.5">{tx.category}</td>
                        <td className="py-2.5">{tx.paymentMode}</td>
                        <td className={`py-2.5 text-right font-black ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          ₹{tx.amount.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-center">
                          <button onClick={() => onDeleteTransaction(tx.id)} className="text-rose-500 hover:text-rose-600 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: Customer list Layout */}
      {activeTab === 'customers' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-xl text-center">
              <span className="text-blue-500 font-extrabold text-3xl">{totalCustomersCount}</span>
              <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">Total CSC Customers Registered</div>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-xl text-center">
              <span className="text-amber-500 font-extrabold text-3xl">₹{totalCustomerDues.toFixed(2)}</span>
              <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">Outstanding Dues</div>
            </div>
          </div>

          <div className="tool-layout">
            <div className="config-card">
              <h3 className="font-bold border-b border-gray-100 dark:border-gray-800 pb-2">Record Customer Billing</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="Raman Gupta" value={custName} onChange={(e) => setCustName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input type="text" placeholder="10 Digits number" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Billing date</label>
                  <input type="date" value={custDate} onChange={(e) => setCustDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Client Service Type</label>
                  <select value={custServiceId} onChange={(e) => setCustServiceId(e.target.value)}>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (Portal: ₹{s.govtFee})</option>
                    ))}
                    <option value="manual">Custom Single Job (Manual Fee)</option>
                  </select>
                </div>
              </div>

              {isManualService && (
                <div className="form-group">
                  <label>Custom Job Description</label>
                  <input type="text" placeholder="e.g. Color Xerox bundle" value={custManualServiceName} onChange={(e) => setCustManualServiceName(e.target.value)} />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="form-group">
                  <label>Rate Charged (₹)</label>
                  <input type="number" placeholder="0" value={custCharge} onChange={(e) => setCustCharge(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Paid Amount (₹)</label>
                  <input type="number" placeholder="0" value={custPaid} onChange={(e) => setCustPaid(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Work Status</label>
                  <select value={custWorkStatus} onChange={(e) => setCustWorkStatus(e.target.value as any)}>
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Billing Village Address</label>
                <input type="text" placeholder="Gali no 3, Jaipur" value={custAddress} onChange={(e) => setCustAddress(e.target.value)} />
              </div>

              <div className="flex justify-between items-center bg-blue-500/5 p-3 rounded-lg text-[11px] border border-blue-500/10 select-none">
                <span>Calculated Profit Margin: <strong className="text-emerald-500">₹{liveCommission.toFixed(2)}</strong></span>
                <span>Outstanding Dues: <strong className="text-amber-500">₹{calculatedDues.toFixed(2)}</strong></span>
              </div>

              <button onClick={handleLogCustomer} className="btn-primary flex items-center justify-center gap-2 py-3.5">
                <UserPlus className="w-5 h-5 shrink-0" /> Log Billing & Update Ledger
              </button>
            </div>

            {/* CUSTOMER DIRECTORY TABLE */}
            <div className="config-card overflow-x-auto">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2 flex-wrap gap-2">
                <h3 className="font-bold">Clients Directory & Dues Record</h3>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search name/mobile..." 
                    value={searchCustomers}
                    onChange={(e) => setSearchCustomers(e.target.value)}
                    className="p-1.5 pl-8 border rounded-lg text-xs"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse mt-2">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400">
                    <th className="py-2.5">Name / Phone</th>
                    <th className="py-2.5">Service Job</th>
                    <th className="py-2.5 text-right">Fee</th>
                    <th className="py-2.5 text-right">Paid</th>
                    <th className="py-2.5 text-right">Dues</th>
                    <th className="py-2.5 text-center">Work Status</th>
                    <th className="py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomersList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-gray-400">No customer records matching</td>
                    </tr>
                  ) : (
                    filteredCustomersList.map(c => (
                      <tr key={c.id} className="border-b border-gray-50 dark:border-gray-850 hover:bg-gray-100/5">
                        <td className="py-2.5">
                          <div className="font-bold">{c.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{c.phone}</div>
                        </td>
                        <td className="py-2.5 max-w-[120px] truncate">{c.serviceName}</td>
                        <td className="py-2.5 text-right font-bold">₹{c.charge.toFixed(2)}</td>
                        <td className="py-2.5 text-right text-emerald-500">₹{c.paid.toFixed(2)}</td>
                        <td className={`py-2.5 text-right font-black ${c.dues > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                          ₹{c.dues.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${c.workStatus === 'Complete' ? 'bg-emerald-500/10 text-emerald-500' : c.workStatus === 'Processing' ? 'bg-cyan-500/10 text-cyan-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {c.workStatus}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            {c.dues > 0 && (
                              <button 
                                onClick={() => {
                                  const amtVal = parseFloat(prompt(`Enter dues pay off amount for ${c.name} (Max outstanding: ₹${c.dues}):`, String(c.dues)) || '');
                                  if (!isNaN(amtVal) && amtVal > 0) {
                                    onClearCustomerDues(c.id, amtVal);
                                  }
                                }}
                                className="px-1.5 py-0.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white text-[10px] rounded font-bold transition"
                              >
                                Clear Dues
                              </button>
                            )}
                            <button onClick={() => onDeleteCustomer(c.id)} className="text-rose-500 hover:text-rose-600 p-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: Custom Rates list */}
      {activeTab === 'rates' && (
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-center flex-wrap gap-4 border-b border-gray-100 dark:border-gray-800 pb-2">
            <div className="flex gap-2">
              {['all', 'Government', 'Banking', 'Insurance', 'Recharge'].map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setRateFilter(cat)}
                  className={`px-3 py-1 bg-gray-50 dark:bg-gray-900 border rounded-full text-xs font-semibold ${rateFilter === cat ? 'border-blue-500 text-blue-500 font-bold' : 'border-gray-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Search catalog..." 
                value={rateSearch}
                onChange={(e) => setRateSearch(e.target.value)}
                className="p-1 px-3 border rounded text-xs w-44"
              />
              <button 
                onClick={() => setIsServiceModalOpen(true)}
                className="p-1.5 px-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs rounded shadow"
              >
                Add Custom Rate
              </button>
              <button onClick={onResetServices} className="p-1 text-gray-500 hover:text-gray-900" title="Reset default catalog rates">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
            {filteredServices.map(srv => {
              const profitMargin = srv.custFee - srv.govtFee;
              return (
                <div key={srv.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-gray-100 dark:border-gray-800 relative flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                      {srv.category}
                    </span>
                    <h4 className="font-extrabold text-sm text-gray-900 dark:text-white mt-2 leading-snug">{srv.name}</h4>
                    
                    <div className="flex justify-between items-center text-xs text-gray-400 mt-4 border-t border-gray-50 dark:border-gray-850/60 pt-2">
                      <span>Govt charge: ₹{srv.govtFee}</span>
                      <span>Customer Price: ₹{srv.custFee}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-100 dark:border-gray-800/80">
                    <span className="text-xs text-gray-500 font-bold">VLE Margin Profit: <strong className="text-emerald-500">₹{profitMargin.toFixed(2)}</strong></span>
                    {srv.isCustom && (
                      <button onClick={() => onDeleteCustomService(srv.id)} className="text-rose-500 hover:text-rose-600 p-1" title="Delete custom Rate">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ADD SERVICE MODAL POPUP */}
          {isServiceModalOpen && (
            <div className="modal-overlay active">
              <div className="modal-card select-none">
                <div className="modal-header">
                  <h3 className="modal-title">Define Custom rate Card</h3>
                  <button onClick={() => setIsServiceModalOpen(false)} className="modal-close-btn">&times;</button>
                </div>
                <form onSubmit={handleSaveCustomService}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>Service Label Name</label>
                      <input type="text" value={newSrvName} onChange={(e) => setNewSrvName(e.target.value)} required placeholder="e.g. PVC Card alignment print" />
                    </div>
                    
                    <div className="form-group">
                      <label>Category Group</label>
                      <select value={newSrvCat} onChange={(e) => setNewSrvCat(e.target.value as any)}>
                        <option value="Government">Government Portal</option>
                        <option value="Banking">Banking kiosk</option>
                        <option value="Insurance">Insurance sync</option>
                        <option value="Recharge">Mobile Utility</option>
                        <option value="Other">Miscellaneous Jobs</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-group">
                        <label>Govt Portal Fee (₹)</label>
                        <input type="number" value={newSrvGovtFee} onChange={(e) => setNewSrvGovtFee(e.target.value)} placeholder="0" />
                      </div>
                      <div className="form-group">
                        <label>VLE Customer Rate (₹)</label>
                        <input type="number" value={newSrvCustFee} onChange={(e) => setNewSrvCustFee(e.target.value)} placeholder="0" />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer flex gap-2">
                    <button type="button" onClick={() => setIsServiceModalOpen(false)} className="btn-secondary w-1/2 py-2 text-xs">Cancel</button>
                    <button type="submit" className="btn-primary w-1/2 py-2 text-xs">Create rate</button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 4: Wallet Passbook statement */}
      {activeTab === 'wallet' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-xl text-center">
              <span className="text-blue-500 font-extrabold text-3xl">₹{walletBalance.toFixed(2)}</span>
              <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">Stored Wallet Balance</div>
            </div>
            <div className="bg-rose-500/5 border border-rose-500/10 p-5 rounded-xl text-center">
              <span className="text-rose-500 font-extrabold text-3xl">₹{totalWalletDebited.toFixed(2)}</span>
              <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">Government Charges Debited</div>
            </div>
          </div>

          <div className="tool-layout">
            <div className="config-card">
              <h3 className="font-bold border-b border-gray-100 dark:border-gray-800 pb-2">Load Money into Wallet</h3>
              <p className="text-xs text-gray-400 leading-snug">Transfer cash balance or bank assets into active government utility credits.</p>

              <div className="form-group mt-2">
                <label>Top-Up Amount (₹)</label>
                <input type="number" placeholder="1000.00" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Loading Date</label>
                  <input type="date" value={walletDate} onChange={(e) => setWalletDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Source Account</label>
                  <select value={walletSource} onChange={(e) => setWalletSource(e.target.value)}>
                    <option value="Cash">Cash (Cash drawer)</option>
                    <option value="Bank Account">Bank (GPay / Netbanking)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Reference Details</label>
                <input type="text" placeholder="e.g. UPI Ref Id 342211" value={walletDesc} onChange={(e) => setWalletDesc(e.target.value)} />
              </div>

              <button onClick={handleWalletLoad} className="btn-primary mt-2 flex items-center justify-center gap-2 py-3">
                <PlusCircle className="w-4 h-4 shrink-0" /> Load money
              </button>

            </div>

            {/* WALLET STATEMENT TABLE */}
            <div className="config-card overflow-x-auto">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2 flex-wrap gap-2">
                <h3 className="font-bold">CSC Wallet Passbook</h3>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search passbook..." 
                    value={searchWallet}
                    onChange={(e) => setSearchWallet(e.target.value)}
                    className="p-1.5 pl-8 border rounded-lg text-xs"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse mt-2">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-bold">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Type</th>
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5 text-right">Debit / Credit</th>
                    <th className="py-2.5 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWalletList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-400">Passbook entries empty</td>
                    </tr>
                  ) : (
                    filteredWalletList.map(w => (
                      <tr key={w.id} className="border-b border-gray-50 dark:border-gray-850 hover:bg-gray-100/5">
                        <td className="py-2.5 font-mono">{w.date}</td>
                        <td className="py-2.5 font-bold uppercase text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded ${w.type === 'credit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-rose-500'}`}>
                            {w.type}
                          </span>
                        </td>
                        <td className="py-2.5 max-w-[150px] truncate">{w.description}</td>
                        <td className={`py-2.5 text-right font-black ${w.type === 'credit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {w.type === 'credit' ? '+' : '-'}₹{w.amount.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right font-bold font-mono">₹{w.balanceAfter.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
