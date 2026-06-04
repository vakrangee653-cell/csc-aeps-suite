import React, { useState, useEffect } from 'react';
import { 
  Sun, Calendar, TrendingUp, AlertCircle, Wallet, 
  ArrowUpRight, ArrowDownLeft, Scale, Zap, ExternalLink, Search, Check, CreditCard, Landmark, Globe, FileCheck2, Monitor 
} from 'lucide-react';
import { Transaction, Customer, ServiceItem, User } from '../types';

interface DashboardProps {
  activeUser: User;
  transactions: Transaction[];
  customers: Customer[];
  services: ServiceItem[];
  walletBalance: number;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onAddCustomer: (cust: Omit<Customer, 'id' | 'dues' | 'commission'>) => void;
  onClearCustomerDues: (customerId: string, amount: number) => void;
}

export default function Dashboard({
  activeUser, transactions, customers, services, walletBalance,
  onAddTransaction, onAddCustomer, onClearCustomerDues
}: DashboardProps) {
  const [time, setTime] = useState(new Date());
  const [quickTab, setQuickTab] = useState<'cash' | 'customer' | 'search'>('cash');
  
  // Header details loaded from localStorage if custom modifications occurred
  const [shopName, setShopName] = useState('APNA DIGITAL CSC CENTER');
  const [profileName, setProfileName] = useState('VLE Partner');

  // Tab A: Transaction form
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txCategory, setTxCategory] = useState('Service Charge');
  const [txMode, setTxMode] = useState<'Cash' | 'UPI / GPay' | 'Net Banking'>('Cash');
  const [txDesc, setTxDesc] = useState('');

  // Tab B: Customer form
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custDate, setCustDate] = useState(new Date().toISOString().split('T')[0]);
  const [custAddress, setCustAddress] = useState('');
  const [custServiceId, setCustServiceId] = useState('');
  const [custCharge, setCustCharge] = useState('');
  const [custPaid, setCustPaid] = useState('');
  const [custWorkStatus, setCustWorkStatus] = useState<'Pending' | 'Processing' | 'Complete'>('Complete');
  
  // Custom manual service state
  const [isManualService, setIsManualService] = useState(false);
  const [custManualServiceName, setCustManualServiceName] = useState('');

  // Tab C: Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [clearAmount, setClearAmount] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Dynamic welcome info loader
    const storedShopName = localStorage.getItem('csc_profile_shop_name');
    const storedProfileName = localStorage.getItem('csc_profile_name');
    if (storedShopName) setShopName(storedShopName);
    if (storedProfileName) setProfileName(storedProfileName);
  }, [activeUser]);

  // Set default service on load or services list updates
  useEffect(() => {
    if (services.length > 0) {
      setCustServiceId(services[0].id);
    }
  }, [services]);

  // Auto fee filler based on chosen service id
  useEffect(() => {
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

  // Calculations for stats
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  const todayEarnings = customers
    .filter(c => c.date === todayStr)
    .reduce((sum, c) => sum + (c.commission || 0), 0);

  const monthEarnings = customers
    .filter(c => c.date.startsWith(currentMonthStr))
    .reduce((sum, c) => sum + (c.commission || 0), 0);

  const totalEarnings = customers.reduce((sum, c) => sum + (c.commission || 0), 0);
  const totalDues = customers.reduce((sum, c) => sum + (c.dues || 0), 0);

  const ledgerIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const ledgerExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netLedgerBalance = ledgerIncome - ledgerExpense;

  // Format functions
  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getGreeting = () => {
    const hrs = time.getHours();
    if (hrs < 12) return `Good Morning, ${profileName}! ☀️`;
    if (hrs < 17) return `Good Afternoon, ${profileName}! 🌤️`;
    if (hrs < 22) return `Good Evening, ${profileName}! 🌙`;
    return `Working Late? Keep it up, ${profileName}! 💼`;
  };

  // Handlers
  const handleSaveTransaction = () => {
    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid monetary amount.');
      return;
    }
    onAddTransaction({
      type: txType,
      amount: amt,
      date: txDate,
      category: txCategory,
      paymentMode: txMode,
      description: txDesc || 'Logged via Quick Console'
    });
    setTxAmount('');
    setTxDesc('');
    alert('Transaction logged successfully!');
  };

  const handleSaveCustomer = () => {
    if (!custName || !custPhone) {
      alert('Please fill in Customer Name and Mobile Number.');
      return;
    }
    const chargeVal = parseFloat(custCharge) || 0;
    const paidVal = parseFloat(custPaid) || 0;

    let srvName = '';
    let finalServiceId = custServiceId;

    if (custServiceId === 'manual') {
      srvName = custManualServiceName || 'Custom CSC Service';
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
    setCustManualServiceName('');
    setCustPaid('');
    alert('Customer sheet record added!');
  };

  // Live calculated fields inside active layout B
  const activeSrv = services.find(s => s.id === custServiceId);
  const chargeNum = parseFloat(custCharge) || 0;
  const paidNum = parseFloat(custPaid) || 0;
  const calculatedDues = Math.max(0, chargeNum - paidNum);
  const calculatedCommission = activeSrv 
    ? Math.max(0, chargeNum - activeSrv.govtFee) 
    : Math.max(0, chargeNum * 0.4); // fallback 40% margin

  // Search Results
  const matchedCustomers = searchQuery.trim() === '' ? [] : customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. HERO GREETING BANNER WITH LIVE CLOCK */}
      <div className="dashboard-hero-banner flex flex-wrap justify-between items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-cyan-950/40 border border-gray-100 dark:border-gray-800">
        <div className="hero-left shrink-0">
          <h1 id="hero-greeting" className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-1">
            {getGreeting()}
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-bold text-blue-600 dark:text-blue-400 select-all" id="hero-shop-name">
              {shopName}
            </span>
            <span>• Online CSC Partner Network</span>
          </div>
        </div>
        
        <div className="hero-clock-container text-right">
          <div className="live-clock font-mono text-2xl font-black text-blue-600 dark:text-blue-400">
            {formatTime(time)}
          </div>
          <div className="live-date text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1">
            {formatDate(time)}
          </div>
        </div>
      </div>

      {/* 2. STATS KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Card 1: Today Margin */}
        <div className="metric-card border-l-4 border-emerald-500 bg-white dark:bg-slate-900/50 p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Sun className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-extrabold text-emerald-600 dark:text-emerald-500">
              ₹{todayEarnings.toFixed(2)}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold mt-1">Today's Profit</div>
          </div>
        </div>

        {/* Card 2: Month Margin */}
        <div className="metric-card border-l-4 border-emerald-500 bg-white dark:bg-slate-900/50 p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-extrabold text-emerald-600 dark:text-emerald-500">
              ₹{monthEarnings.toFixed(2)}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold mt-1">Monthly Profit</div>
          </div>
        </div>

        {/* Card 3: Total Margin */}
        <div className="metric-card border-l-4 border-cyan-500 bg-white dark:bg-slate-900/50 p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-extrabold text-cyan-600 dark:text-[#06B6D4]">
              ₹{totalEarnings.toFixed(2)}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold mt-1">Total Margin</div>
          </div>
        </div>

        {/* Card 4: Outs Dues */}
        <div className="metric-card border-l-4 border-amber-500 bg-white dark:bg-slate-900/50 p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-extrabold text-amber-600 dark:text-amber-500">
              ₹{totalDues.toFixed(2)}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold mt-1">Pending Dues</div>
          </div>
        </div>

        {/* Card 5: CSC Wallet */}
        <div className="metric-card border-l-4 border-blue-500 bg-white dark:bg-slate-900/50 p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-extrabold text-blue-600 dark:text-blue-500">
              ₹{walletBalance.toFixed(2)}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold mt-1">CSC Wallet</div>
          </div>
        </div>

        {/* Card 6: Cash in hand Ledger */}
        <div className="metric-card border-l-4 border-indigo-500 bg-white dark:bg-slate-900/50 p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              ₹{netLedgerBalance.toFixed(2)}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold mt-1">Net Cash Balance</div>
          </div>
        </div>

        {/* Card 7: Shop Ledger Income */}
        <div className="metric-card border-l-4 border-emerald-500 bg-white dark:bg-slate-900/50 p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-extrabold text-emerald-600 dark:text-emerald-500">
              ₹{ledgerIncome.toFixed(2)}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold mt-1">Cash Receipts</div>
          </div>
        </div>

        {/* Card 8: Shop Ledger Spendings */}
        <div className="metric-card border-l-4 border-rose-500 bg-white dark:bg-slate-900/50 p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-extrabold text-rose-600 dark:text-rose-500">
              ₹{ledgerExpense.toFixed(2)}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold mt-1">Expenditures</div>
          </div>
        </div>

      </div>

      {/* 3. QUICK ENTRY TABBED PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="md:col-span-2 config-card bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 dark:border-gray-800/80 pb-3 gap-4">
            <h2 className="font-bold text-gray-950 dark:text-white flex items-center gap-2 text-base md:text-lg select-none">
              <span className="p-1 px-1.5 bg-amber-500/10 text-amber-500 rounded-md">
                <Zap className="w-4 h-4 fill-amber-500" />
              </span>
              Quick Action Entry Panel
            </h2>
            
            <div className="quick-tabs-container">
              <button 
                onClick={() => setQuickTab('cash')}
                className={`quick-tab-btn text-xs md:text-sm ${quickTab === 'cash' ? 'active' : ''}`}
              >
                ⚡ Cash Tx
              </button>
              <button 
                onClick={() => setQuickTab('customer')}
                className={`quick-tab-btn text-xs md:text-sm ${quickTab === 'customer' ? 'active' : ''}`}
              >
                👥 Customer Bill
              </button>
              <button 
                onClick={() => setQuickTab('search')}
                className={`quick-tab-btn text-xs md:text-sm ${quickTab === 'search' ? 'active' : ''}`}
              >
                🔍 Search & Dues
              </button>
            </div>
          </div>

          {/* TAB A: Quick Cash Transaction */}
          {quickTab === 'cash' && (
            <div className="flex flex-col gap-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="form-group">
                  <label htmlFor="q-tx-type">Tx Type</label>
                  <select 
                    id="q-tx-type" 
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as 'income' | 'expense')}
                    className="p-2 border rounded-md"
                  >
                    <option value="income">Income (Cash In)</option>
                    <option value="expense">Expense (Cash Out)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="q-tx-amount">Amount (₹)</label>
                  <input 
                    type="number" 
                    id="q-tx-amount" 
                    placeholder="0.00" 
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="p-2 border rounded-md"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="q-tx-date">Date</label>
                  <input 
                    type="date" 
                    id="q-tx-date" 
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="p-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="q-tx-cat">Category</label>
                  <select 
                    id="q-tx-cat"
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="p-2 border rounded-md"
                  >
                    <option value="Service Charge">Customer Service Charge</option>
                    <option value="CSC Commision">CSC Commission</option>
                    <option value="Staff Salary">Staff Wages</option>
                    <option value="Stationery / Paper">Stationery & Paper</option>
                    <option value="Internet / Electricity">WiFi & Electricity</option>
                    <option value="Shop Rent">Shop Room Rent</option>
                    <option value="Other Utility">Other Expenses</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="q-tx-mode">Payment Mode</label>
                  <select 
                    id="q-tx-mode"
                    value={txMode}
                    onChange={(e) => setTxMode(e.target.value as any)}
                    className="p-2 border rounded-md"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI / GPay">UPI / GPay</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="q-tx-desc">Brief Description</label>
                <input 
                  type="text" 
                  id="q-tx-desc" 
                  placeholder="e.g. Spiral binding paper fees"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  className="p-2 border rounded-md"
                />
              </div>

              <button 
                onClick={handleSaveTransaction}
                className="btn-primary mt-2 py-3 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save Cash Ledger Transaction
              </button>
            </div>
          )}

          {/* TAB B: Quick Customer Bill */}
          {quickTab === 'customer' && (
            <div className="flex flex-col gap-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="form-group">
                  <label htmlFor="q-cust-name">Customer Name</label>
                  <input 
                    type="text" 
                    id="q-cust-name" 
                    placeholder="Ramesh Sharma" 
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="p-2 border rounded-md"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="q-cust-phone">Mobile Phone</label>
                  <input 
                    type="text" 
                    id="q-cust-phone" 
                    placeholder="9876543210" 
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="p-2 border rounded-md"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="q-cust-date">Target Date</label>
                  <input 
                    type="date" 
                    id="q-cust-date" 
                    value={custDate}
                    onChange={(e) => setCustDate(e.target.value)}
                    className="p-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="q-cust-srv">Select Service</label>
                  <select 
                    id="q-cust-srv"
                    value={custServiceId}
                    onChange={(e) => setCustServiceId(e.target.value)}
                    className="p-2 border rounded-md"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (Govt: ₹{s.govtFee})</option>
                    ))}
                    <option value="manual">Custom Service (Create manual rate)</option>
                  </select>
                </div>
                
                {isManualService && (
                  <div className="form-group">
                    <label htmlFor="q-cust-man">Custom Service Label</label>
                    <input 
                      type="text" 
                      id="q-cust-man"
                      placeholder="e.g. PVC Card Print"
                      value={custManualServiceName}
                      onChange={(e) => setCustManualServiceName(e.target.value)}
                      className="p-2 border rounded-md"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="form-group">
                  <label htmlFor="q-cust-charge">Total Charge (₹)</label>
                  <input 
                    type="number" 
                    id="q-cust-charge"
                    value={custCharge}
                    onChange={(e) => setCustCharge(e.target.value)}
                    className="p-2 border rounded-md"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="q-cust-paid">Amount Paid (₹)</label>
                  <input 
                    type="number" 
                    id="q-cust-paid"
                    placeholder="0.00"
                    value={custPaid}
                    onChange={(e) => setCustPaid(e.target.value)}
                    className="p-2 border rounded-md"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="q-cust-status">Work Status</label>
                  <select 
                    id="q-cust-status"
                    value={custWorkStatus}
                    onChange={(e) => setCustWorkStatus(e.target.value as any)}
                    className="p-2 border rounded-md"
                  >
                    <option value="Pending">Work Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="q-cust-addr">Village Address</label>
                <input 
                  type="text" 
                  id="q-cust-addr" 
                  placeholder="Street / Village / Ward"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="p-2 border rounded-md"
                />
              </div>

              <div className="flex justify-between items-center bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 text-xs select-none">
                <span className="text-gray-500">Margin Commission Profit: <strong className="text-emerald-500">₹{calculatedCommission.toFixed(2)}</strong></span>
                <span className="text-gray-500">Outs Dues Balance: <strong className="text-amber-500">₹{calculatedDues.toFixed(2)}</strong></span>
              </div>

              <button 
                onClick={handleSaveCustomer}
                className="btn-primary mt-2 py-3 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save Customer Billing Record
              </button>
            </div>
          )}

          {/* TAB C: Customer search & clear */}
          {quickTab === 'search' && (
            <div className="flex flex-col gap-4 mt-4">
              <div className="form-group">
                <label htmlFor="search-bill-field">Search Customer Name or Mobile No.</label>
                <div className="relative">
                  <input 
                    type="text" 
                    id="search-bill-field"
                    placeholder="Type to filter..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="p-2 pl-10 border rounded-md w-full"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto flex flex-col gap-2 pr-1 select-none">
                {matchedCustomers.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400">
                    {searchQuery.trim() === '' ? 'Type search text' : 'No customers matched search'}
                  </div>
                ) : (
                  matchedCustomers.map(cust => (
                    <div 
                      key={cust.id} 
                      className="p-3 bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                    >
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white text-sm">{cust.name}</div>
                        <div className="text-xs text-gray-500 flex gap-2">
                          <span>{cust.phone}</span>
                          <span>•</span>
                          <span>{cust.serviceName}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs text-gray-400 font-bold uppercase">Dues Outstanding</div>
                          <div className={`text-sm font-extrabold ${cust.dues > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            ₹{cust.dues.toFixed(2)}
                          </div>
                        </div>

                        {cust.dues > 0 && (
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="number" 
                              placeholder="0"
                              value={clearAmount[cust.id] || ''}
                              onChange={(e) => setClearAmount({
                                ...clearAmount,
                                [cust.id]: e.target.value
                              })}
                              className="p-1 px-2 text-xs border rounded w-16 bg-white dark:bg-slate-900 text-center font-mono font-bold"
                            />
                            <button 
                              onClick={() => {
                                const payAmt = parseFloat(clearAmount[cust.id]) || cust.dues;
                                onClearCustomerDues(cust.id, payAmt);
                                setClearAmount({ ...clearAmount, [cust.id]: '' });
                                alert('Dues processed!');
                              }}
                              className="p-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded shadow"
                            >
                              Pay
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Portals list Column widgets */}
        <div className="widget-card bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col gap-4">
          <h3 className="text-xs md:text-sm font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 dark:border-gray-850 pb-2">
            <ExternalLink className="w-4 h-4 text-blue-500" />
            Official Portals Hub
          </h3>

          <div className="portal-links-grid">
            <a href="https://digitalseva.csc.gov.in/" target="_blank" rel="noopener noreferrer" className="portal-btn portal-csc">
              <Monitor />
              <span>CSC Portal</span>
            </a>
            <a href="https://myaadhaar.uidai.gov.in/" target="_blank" rel="noopener noreferrer" className="portal-btn portal-uidai">
              <Globe />
              <span>My Aadhaar</span>
            </a>
            <a href="https://www.tin-nsdl.com/" target="_blank" rel="noopener noreferrer" className="portal-btn portal-pan">
              <CreditCard />
              <span>NSDL PAN</span>
            </a>
            <a href="https://www.gst.gov.in/" target="_blank" rel="noopener noreferrer" className="portal-btn portal-gst">
              <FileCheck2 />
              <span>GST Portal</span>
            </a>
            <a href="https://www.passportindia.gov.in/" target="_blank" rel="noopener noreferrer" className="portal-btn portal-passport">
              <Globe />
              <span>Passport India</span>
            </a>
            <a href="https://www.incometax.gov.in/" target="_blank" rel="noopener noreferrer" className="portal-btn portal-tax">
              <Landmark />
              <span>Income Tax</span>
            </a>
          </div>

          <div className="mt-auto p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 text-xs text-orange-500 flex gap-2">
            <div>💡</div>
            <p className="leading-relaxed">
              VLE partners are requested to check customer certificates before final portal print. Government portal charges apply on billing credit cycles.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
