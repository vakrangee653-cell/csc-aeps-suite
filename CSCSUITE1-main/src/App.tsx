import React, { useState, useEffect } from 'react';
import { Mail, X } from 'lucide-react';
import { User, Transaction, Customer, ServiceItem, WalletTransaction } from './types';
import { DEFAULT_SERVICES, getStoredData, setStoredData } from './utils';

// Import Child Components
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import IdCropper from './components/IdCropper';
import BiodataBuilder from './components/BiodataBuilder';
import CspManager from './components/CspManager';
import ReportsHub from './components/ReportsHub';
import StaffManager from './components/StaffManager';
import AdminPanel from './components/AdminPanel';
import AgeCalculator from './components/AgeCalculator';
import Profile from './components/Profile';
import AuthOverlay from './components/AuthOverlay';

export default function App() {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(true);

  // Core global databases
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);

  // Simulated live mailbox widget popup
  const [mockEmailVisible, setMockEmailVisible] = useState(false);
  const [mockEmailSubject, setMockEmailSubject] = useState('');
  const [mockEmailBody, setMockEmailBody] = useState('');

  // Initial Data loader from LocalStorage
  useEffect(() => {
    // 1. Session check
    const savedSession = localStorage.getItem('csc_active_user');
    if (savedSession) {
      try {
        setActiveUser(JSON.parse(savedSession));
      } catch (e) {
        console.error('Session restore failed:', e);
      }
    }

    // 2. Load lists
    setTransactions(getStoredData<Transaction[]>('csc_csp_transactions', []));
    setCustomers(getStoredData<Customer[]>('csc_csp_customers', []));
    setServices(getStoredData<ServiceItem[]>('csc_csp_rates', DEFAULT_SERVICES));
    
    const savedWalletTxs = getStoredData<WalletTransaction[]>('csc_wallet_transactions', []);
    setWalletTransactions(savedWalletTxs);

    // Initial Wallet balance compute
    const credits = savedWalletTxs.filter(w => w.type === 'credit').reduce((sum, w) => sum + w.amount, 0);
    const debits = savedWalletTxs.filter(w => w.type === 'debit').reduce((sum, w) => sum + w.amount, 0);
    setWalletBalance(credits - debits);

    // Theme layer
    const storedTheme = localStorage.getItem('csc_theme') || 'dark';
    setDarkMode(storedTheme === 'dark');
    document.documentElement.setAttribute('data-theme', storedTheme);
  }, []);

  // Sync utilities
  const toggleDarkMode = () => {
    const nextTheme = !darkMode ? 'dark' : 'light';
    setDarkMode(!darkMode);
    localStorage.setItem('csc_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem('csc_active_user');
    setActiveUser(null);
    setCurrentTab('dashboard');
  };

  const handleLoginSuccess = (user: User) => {
    localStorage.setItem('csc_active_user', JSON.stringify(user));
    setActiveUser(user);
    
    // Auto populate Owner's mailbox profile if not present
    if (user.role === 'Owner') {
      localStorage.setItem('csc_profile_name', user.name);
      localStorage.setItem('csc_profile_email', user.email);
    }
  };

  // Modifier: Add Transaction
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const freshTx: Transaction = {
      ...newTx,
      id: "tx_" + Date.now()
    };
    const updated = [freshTx, ...transactions];
    setTransactions(updated);
    setStoredData('csc_csp_transactions', updated);
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    setStoredData('csc_csp_transactions', updated);
  };

  // Modifier: Add Customer (Cascades with Wallet deductions and ledger cash bookings)
  const handleAddCustomer = (newCust: Omit<Customer, 'id' | 'dues' | 'commission'>) => {
    const duesValue = Math.max(0, newCust.charge - newCust.paid);
    
    // Fetch associated service govt portal charges
    const associatedSrv = services.find(s => s.id === newCust.serviceId);
    const govtFee = associatedSrv ? associatedSrv.govtFee : 0;
    const commissionValue = Math.max(0, newCust.charge - govtFee);

    const freshCust: Customer = {
      ...newCust,
      id: "cust_" + Date.now(),
      dues: duesValue,
      commission: commissionValue
    };

    const updatedCustList = [freshCust, ...customers];
    setCustomers(updatedCustList);
    setStoredData('csc_csp_customers', updatedCustList);

    // CASCADING EFFECT A: Auto-deduct Govt portal fee from Wallet
    if (govtFee > 0) {
      const remainingWallet = walletBalance - govtFee;
      const walletTx: WalletTransaction = {
        id: "wt_" + Date.now(),
        date: newCust.date,
        type: 'debit',
        amount: govtFee,
        sourceOrDestination: 'Govt Utility Portal Charge',
        description: `Deducted for service: ${newCust.serviceName}`,
        balanceAfter: remainingWallet
      };
      const updatedWalletTxs = [walletTx, ...walletTransactions];
      setWalletTransactions(updatedWalletTxs);
      setWalletBalance(remainingWallet);
      setStoredData('csc_wallet_transactions', updatedWalletTxs);
    }

    // CASCADING EFFECT B: Log a Cash-In entry inside cashbook Ledger if amount was paid
    if (newCust.paid > 0) {
      handleAddTransaction({
        type: 'income',
        amount: newCust.paid,
        date: newCust.date,
        category: 'Service Charge',
        paymentMode: 'Cash',
        description: `Paid by client: ${newCust.name} for ${newCust.serviceName}`
      });
    }
  };

  const handleDeleteCustomer = (id: string) => {
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    setStoredData('csc_csp_customers', updated);
  };

  const handleClearCustomerDues = (customerId: string, payAmt: number) => {
    const updated = customers.map(c => {
      if (c.id === customerId) {
        const nextPaid = c.paid + payAmt;
        const nextDues = Math.max(0, c.charge - nextPaid);
        return {
          ...c,
          paid: nextPaid,
          dues: nextDues
        };
      }
      return c;
    });
    setCustomers(updated);
    setStoredData('csc_csp_customers', updated);

    // Log the payoff transaction in the Ledger cash receipt
    const targetCust = customers.find(c => c.id === customerId);
    if (targetCust) {
      handleAddTransaction({
        type: 'income',
        amount: payAmt,
        date: new Date().toISOString().split('T')[0],
        category: 'Service Charge',
        paymentMode: 'Cash',
        description: `Dues pay-off receipt from customer: ${targetCust.name}`
      });
    }
  };

  const handleAddWalletTransaction = (newWt: Omit<WalletTransaction, 'id' | 'balanceAfter'>) => {
    const nextBal = newWt.type === 'credit' 
      ? walletBalance + newWt.amount 
      : walletBalance - newWt.amount;

    const freshWt: WalletTransaction = {
      ...newWt,
      id: "wt_" + Date.now(),
      balanceAfter: nextBal
    };

    const updated = [freshWt, ...walletTransactions];
    setWalletTransactions(updated);
    setWalletBalance(nextBal);
    setStoredData('csc_wallet_transactions', updated);

    // Cascades Load Money back to ledger expenses if top-up occurs with cash out
    if (newWt.type === 'credit' && newWt.sourceOrDestination === 'Cash') {
      handleAddTransaction({
        type: 'expense',
        amount: newWt.amount,
        date: newWt.date,
        category: 'Other Utility',
        paymentMode: 'Cash',
        description: `Transfer out: loaded money to digital utility wallet`
      });
    }
  };

  const handleAddCustomService = (newSrv: Omit<ServiceItem, 'id' | 'isCustom'>) => {
    const freshSrv: ServiceItem = {
      ...newSrv,
      id: "srv_cust_" + Date.now(),
      isCustom: true
    };
    const updated = [...services, freshSrv];
    setServices(updated);
    setStoredData('csc_csp_rates', updated);
  };

  const handleDeleteCustomService = (id: string) => {
    const updated = services.filter(s => s.id !== id);
    setServices(updated);
    setStoredData('csc_csp_rates', updated);
  };

  const handleResetServices = () => {
    setServices(DEFAULT_SERVICES);
    setStoredData('csc_csp_rates', DEFAULT_SERVICES);
    alert('Catalog restored to baseline standard government rates.');
  };

  const handleDatabaseWipe = () => {
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
      if (k.startsWith('csc_')) {
        localStorage.removeItem(k);
      }
    });
    setTransactions([]);
    setCustomers([]);
    setServices(DEFAULT_SERVICES);
    setWalletTransactions([]);
    setWalletBalance(0);
    setActiveUser(null);
  };

  const handleMockEmailTrigger = (subject: string, body: string) => {
    setMockEmailSubject(subject);
    setMockEmailBody(body);
    setMockEmailVisible(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#090d16] text-gray-900 dark:text-[#f8fafc] font-sans antialiased">
      
      {/* 1. AUTH GATES LOCKED CHECKPOINT */}
      {!activeUser ? (
        <AuthOverlay 
          onLoginSuccess={handleLoginSuccess}
          onMockEmailTrigger={handleMockEmailTrigger}
        />
      ) : (
        <div className="app-container">
          
          {/* 2. SIDEBAR NAVIGATION */}
          <Sidebar 
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            userRole={activeUser.role}
            userName={activeUser.name}
            onLogout={handleLogout}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
          />

          {/* 3. WORKSPACE CONTAINER */}
          <main className="main-content">
            
            {currentTab === 'dashboard' && (
              <Dashboard 
                activeUser={activeUser}
                transactions={transactions}
                customers={customers}
                services={services}
                walletBalance={walletBalance}
                onAddTransaction={handleAddTransaction}
                onAddCustomer={handleAddCustomer}
                onClearCustomerDues={handleClearCustomerDues}
              />
            )}

            {currentTab === 'profile' && (
              <Profile />
            )}

            {currentTab === 'aadhaar' && (
              <IdCropper />
            )}

            {currentTab === 'biodata' && (
              <BiodataBuilder />
            )}

            {currentTab === 'csp' && (
              <CspManager 
                transactions={transactions}
                customers={customers}
                services={services}
                walletTransactions={walletTransactions}
                walletBalance={walletBalance}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onAddCustomer={handleAddCustomer}
                onDeleteCustomer={handleDeleteCustomer}
                onClearCustomerDues={handleClearCustomerDues}
                onAddWalletTransaction={handleAddWalletTransaction}
                onAddCustomService={handleAddCustomService}
                onDeleteCustomService={handleDeleteCustomService}
                onResetServices={handleResetServices}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsHub 
                transactions={transactions}
                customers={customers}
              />
            )}

            {currentTab === 'services' && (
              <CspManager 
                transactions={transactions}
                customers={customers}
                services={services}
                walletTransactions={walletTransactions}
                walletBalance={walletBalance}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onAddCustomer={handleAddCustomer}
                onDeleteCustomer={handleDeleteCustomer}
                onClearCustomerDues={handleClearCustomerDues}
                onAddWalletTransaction={handleAddWalletTransaction}
                onAddCustomService={handleAddCustomService}
                onDeleteCustomService={handleDeleteCustomService}
                onResetServices={handleResetServices}
              />
            )}

            {currentTab === 'staff' && (
              <StaffManager 
                onStaffUpdated={() => {
                  // Trigger render reload of staff lists
                  setTransactions([...transactions]);
                }}
              />
            )}

            {currentTab === 'admin' && (
              <AdminPanel 
                transactions={transactions}
                customers={customers}
                onDatabaseWipe={handleDatabaseWipe}
              />
            )}

            {currentTab === 'age' && (
              <AgeCalculator />
            )}

          </main>
        </div>
      )}

      {/* 4. SIMULATED CLIENT MAILBOX NOTIFIER */}
      {mockEmailVisible && (
        <div 
          className="mock-email-notification flex flex-col gap-2 p-4 rounded-xl shadow-2xl bg-white dark:bg-slate-900 border border-blue-500/30 font-sans text-xs max-w-sm"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 99999,
          }}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-extrabold text-gray-900 dark:text-white">📧 Simulated Inbox Client</div>
                <p className="text-[10px] text-gray-400">help@smartspe.in</p>
              </div>
            </div>
            <button 
              onClick={() => setMockEmailVisible(false)}
              className="text-gray-400 hover:text-gray-900 dark:hover:text-white p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-gray-50 dark:bg-gray-950/60 p-3 rounded-lg border border-gray-100 dark:border-gray-800 text-left leading-relaxed mt-2 text-gray-700 dark:text-gray-300 select-all font-sans">
            <p className="font-bold text-gray-950 dark:text-white mb-2">{mockEmailSubject}</p>
            <p className="text-[11px] font-medium">{mockEmailBody}</p>
          </div>
        </div>
      )}

    </div>
  );
}
