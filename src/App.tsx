import React, { useState, useEffect } from 'react';
import { Mail, X, Info } from 'lucide-react';
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
import SubscriptionPanel from './components/SubscriptionPanel';
import DeveloperConsole from './components/DeveloperConsole';

// Namespaced segregation loaders to support multi-user operations
function getNamespacedData<T>(keyName: string, defaultValue: T, userId: string): T {
  const namespacedKey = `${keyName}_${userId}`;
  const namespacedValue = localStorage.getItem(namespacedKey);
  if (namespacedValue !== null) {
    try {
      return JSON.parse(namespacedValue) as T;
    } catch (e) {
      return defaultValue;
    }
  }
  
  // Backward compatibility migration lookup
  const legacyValue = localStorage.getItem(keyName);
  if (legacyValue !== null) {
    try {
      const parsed = JSON.parse(legacyValue);
      localStorage.setItem(namespacedKey, legacyValue);
      return parsed as T;
    } catch (e) {
      return defaultValue;
    }
  }
  return defaultValue;
}

function setNamespacedData<T>(keyName: string, value: T, userId: string): void {
  const namespacedKey = `${keyName}_${userId}`;
  try {
    localStorage.setItem(namespacedKey, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to store namespaced key ${namespacedKey}:`, e);
  }
}

export default function App() {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(true);

  // Impersonation feature state (enables developers to emulate raw views)
  const [impersonatorAdmin, setImpersonatorAdmin] = useState<User | null>(null);

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

  // EFFECT 1: Restoring user theme and active credentials once on container mount
  useEffect(() => {
    const savedSession = localStorage.getItem('csc_active_user');
    if (savedSession) {
      try {
        setActiveUser(JSON.parse(savedSession));
      } catch (e) {
        console.error('Session restore failed:', e);
      }
    }

    // Theme layer
    const storedTheme = localStorage.getItem('csc_theme') || 'dark';
    setDarkMode(storedTheme === 'dark');
    document.documentElement.setAttribute('data-theme', storedTheme);
  }, []);

  // EFFECT 2: Loading databases dynamically based on the namespace of the logged-in User ID!
  useEffect(() => {
    if (!activeUser) {
      setTransactions([]);
      setCustomers([]);
      setServices(DEFAULT_SERVICES);
      setWalletTransactions([]);
      setWalletBalance(0);
      return;
    }

    // Isolate namespaces! Note that staff members view their respective owners' schemas
    const uid = activeUser.role === 'Staff' ? 'user_owner' : activeUser.id;
    
    const txs = getNamespacedData<Transaction[]>('csc_csp_transactions', [], uid);
    const custs = getNamespacedData<Customer[]>('csc_csp_customers', [], uid);
    const svcs = getNamespacedData<ServiceItem[]>('csc_csp_rates', DEFAULT_SERVICES, uid);
    const savedWalletTxs = getNamespacedData<WalletTransaction[]>('csc_wallet_transactions', [], uid);

    setTransactions(txs);
    setCustomers(custs);
    setServices(svcs);
    setWalletTransactions(savedWalletTxs);

    // Dynamic Wallet balance sum computation
    const credits = savedWalletTxs.filter(w => w.type === 'credit').reduce((sum, w) => sum + w.amount, 0);
    const debits = savedWalletTxs.filter(w => w.type === 'debit').reduce((sum, w) => sum + w.amount, 0);
    setWalletBalance(credits - debits);
  }, [activeUser?.id]);

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
    setImpersonatorAdmin(null);
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
    const uid = activeUser?.id || 'default';
    const freshTx: Transaction = {
      ...newTx,
      id: "tx_" + Date.now()
    };
    const updated = [freshTx, ...transactions];
    setTransactions(updated);
    setNamespacedData('csc_csp_transactions', updated, uid);
  };

  const handleDeleteTransaction = (id: string) => {
    const uid = activeUser?.id || 'default';
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    setNamespacedData('csc_csp_transactions', updated, uid);
  };

  // Modifier: Add Customer (Cascades with Wallet deductions and ledger cash bookings)
  const handleAddCustomer = (newCust: Omit<Customer, 'id' | 'dues' | 'commission'>) => {
    const uid = activeUser?.id || 'default';
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
    setNamespacedData('csc_csp_customers', updatedCustList, uid);

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
      setNamespacedData('csc_wallet_transactions', updatedWalletTxs, uid);
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
    const uid = activeUser?.id || 'default';
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    setNamespacedData('csc_csp_customers', updated, uid);
  };

  const handleClearCustomerDues = (customerId: string, payAmt: number) => {
    const uid = activeUser?.id || 'default';
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
    setNamespacedData('csc_csp_customers', updated, uid);

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
    const uid = activeUser?.id || 'default';
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
    setNamespacedData('csc_wallet_transactions', updated, uid);

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
    const uid = activeUser?.id || 'default';
    const freshSrv: ServiceItem = {
      ...newSrv,
      id: "srv_cust_" + Date.now(),
      isCustom: true
    };
    const updated = [...services, freshSrv];
    setServices(updated);
    setNamespacedData('csc_csp_rates', updated, uid);
  };

  const handleDeleteCustomService = (id: string) => {
    const uid = activeUser?.id || 'default';
    const updated = services.filter(s => s.id !== id);
    setServices(updated);
    setNamespacedData('csc_csp_rates', updated, uid);
  };

  const handleResetServices = () => {
    const uid = activeUser?.id || 'default';
    setServices(DEFAULT_SERVICES);
    setNamespacedData('csc_csp_rates', DEFAULT_SERVICES, uid);
    alert('Catalog restored to baseline standard government rates.');
  };

  const handleResetWallet = () => {
    const uid = activeUser?.role === 'Staff' ? 'user_owner' : activeUser?.id || 'default';
    setWalletTransactions([]);
    setWalletBalance(0);
    setNamespacedData('csc_wallet_transactions', [], uid);
    alert('Super Admin Action: Wallet top-up history and balance have been successfully reset to ₹0.00.');
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

  const handleMockEmailTrigger = (subject: string, body: string, toEmail?: string) => {
    // 1. Show simulated client mailbox notifier (Pop-up fallback)
    setMockEmailSubject(subject);
    setMockEmailBody(body);
    setMockEmailVisible(true);

    // 2. Dispatch real API call if we have a recipient email
    if (toEmail) {
      fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: toEmail,
          subject,
          body
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.simulated) {
            console.log("📨 Mail output simulated on backend (SMTP_USER/PASS not configured yet).");
          } else {
            console.log(`📨 Real mail successfully dispatched via SMTP to ${toEmail}`);
          }
        } else if (data.error) {
          console.error("❌ Backend email send error:", data.error);
        }
      })
      .catch(err => {
        console.error("❌ Failed to contact SMTP email dispatcher API:", err);
      });
    }
  };

  const handleImpersonateUser = (targetUser: User) => {
    setImpersonatorAdmin(activeUser);
    setActiveUser(targetUser);
    setCurrentTab('dashboard');
  };

  const handleExitImpersonation = () => {
    if (impersonatorAdmin) {
      setActiveUser(impersonatorAdmin);
      setImpersonatorAdmin(null);
      setCurrentTab('developer');
    }
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
        <div className="flex flex-col min-h-screen">
          {/* Warning banner indicating system impersonation state to the Platform Dev Admin */}
          {impersonatorAdmin && (
            <div className="bg-gradient-to-r from-amber-600 to-rose-600 font-sans text-xs font-black text-white px-4 py-2.5 flex justify-between items-center select-none shadow-md z-[9999]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                <span>
                  ⚠️ DEVELOPER SESSION IMPERSONATION: Simulating live view of VLE <strong>{activeUser.name}</strong> ({activeUser.shopName || 'Standalone Store'}).
                </span>
                <span className="bg-black/30 px-2 py-0.5 rounded text-[10px] font-mono text-amber-200">
                  Segment ID: {activeUser.id}
                </span>
              </div>
              <button 
                onClick={handleExitImpersonation}
                className="bg-white hover:bg-gray-100 text-rose-600 font-extrabold text-[10px] py-1 px-3.5 rounded-lg shadow-md transition-all active:scale-95 border-none cursor-pointer"
              >
                Exit Session (डेवलपर पर लौटें)
              </button>
            </div>
          )}

          <div className="app-container flex-1">
            
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
              
              {/* GLOBAL DEVELOPER BROADCAST BANNER DISPLAYED FOR Standard CSC Users */}
              {activeUser.role !== 'Admin' && localStorage.getItem('csc_global_broadcast') && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl mb-5 flex items-start gap-2.5 shadow-sm">
                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-500 font-black text-[9px] rounded-full uppercase shrink-0">Broadcasting Update</span>
                  <div className="text-xs text-rose-500 dark:text-rose-400 font-bold leading-relaxed">
                    {localStorage.getItem('csc_global_broadcast')}
                  </div>
                </div>
              )}
            
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

            {currentTab === 'subscriptions' && (
              <SubscriptionPanel 
                activeUser={activeUser!}
                onUpdateUser={(updated) => {
                  setActiveUser(updated);
                  localStorage.setItem('csc_active_user', JSON.stringify(updated));
                }}
                onMockEmailTrigger={handleMockEmailTrigger}
              />
            )}

            {currentTab === 'aadhaar' && (
              <IdCropper 
                activePlan={activeUser?.subscriptionPlan || 'Free'}
                onNavigateToSubscriptions={() => setCurrentTab('subscriptions')}
              />
            )}

            {currentTab === 'biodata' && (
              <BiodataBuilder 
                activePlan={activeUser?.subscriptionPlan || 'Free'}
                onNavigateToSubscriptions={() => setCurrentTab('subscriptions')}
              />
            )}

            {currentTab === 'csp' && (
              <CspManager 
                activeUser={activeUser}
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
                onResetWallet={handleResetWallet}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsHub 
                transactions={transactions}
                customers={customers}
                activePlan={activeUser?.subscriptionPlan || 'Free'}
                onNavigateToSubscriptions={() => setCurrentTab('subscriptions')}
              />
            )}

            {currentTab === 'services' && (
              <CspManager 
                activeUser={activeUser}
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
                onResetWallet={handleResetWallet}
              />
            )}

            {currentTab === 'staff' && (
              <StaffManager 
                activeUser={activeUser!}
                onStaffUpdated={() => {
                  // Trigger render reload of staff lists
                  setTransactions([...transactions]);
                }}
              />
            )}

            {currentTab === 'admin' && (
              <AdminPanel 
                activeUser={activeUser!}
                transactions={transactions}
                customers={customers}
                services={services}
                onDatabaseWipe={handleDatabaseWipe}
                onToggleServiceStatus={() => {
                  const uid = activeUser?.role === 'Staff' ? 'user_owner' : activeUser?.id || 'default';
                  const svcs = getNamespacedData<ServiceItem[]>('csc_csp_rates', DEFAULT_SERVICES, uid);
                  setServices([...svcs]);
                }}
              />
            )}

            {currentTab === 'age' && (
              <AgeCalculator />
            )}

            {currentTab === 'developer' && activeUser?.role === 'Admin' && (
              <DeveloperConsole 
                activeUser={activeUser}
                onUpdateUser={(updated) => {
                  setActiveUser(updated);
                  localStorage.setItem('csc_active_user', JSON.stringify(updated));
                }}
                onImpersonateUser={handleImpersonateUser}
                impersonatorAdmin={impersonatorAdmin}
                onExitImpersonation={handleExitImpersonation}
              />
            )}

          </main>
        </div>
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
