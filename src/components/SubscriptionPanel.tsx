import React, { useState } from 'react';
import { 
  Crown, Check, Zap, Sparkles, QrCode, CreditCard, 
  Calendar, ShieldCheck, AlertCircle, RefreshCw, Smartphone, CheckCircle, Info,
  X
} from 'lucide-react';
import { User } from '../types';
import { getStoredData, setStoredData } from '../utils';

interface SubscriptionPanelProps {
  activeUser: User;
  onUpdateUser: (updated: User) => void;
  onMockEmailTrigger: (subject: string, body: string, toEmail?: string) => void;
}

export default function SubscriptionPanel({ 
  activeUser, onUpdateUser, onMockEmailTrigger 
}: SubscriptionPanelProps) {
  const [selectedPlanName, setSelectedPlanName] = useState<'Basic' | 'Premium' | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<1 | 2 | 3>(1); // 1: QR checkout, 2: processing transaction, 3: success
  const [currentUpiMode, setCurrentUpiMode] = useState<'phonepe' | 'gpay' | 'paytm' | 'qr'>('qr');
  const [isYearly, setIsYearly] = useState(false);

  // Stored active plan (defaulting from session/user object)
  const currentPlan = activeUser.subscriptionPlan || 'Free';
  const expiryDateString = activeUser.subscriptionExpiry || 'N/A';

  const handleOpenCheckout = (plan: 'Basic' | 'Premium') => {
    setSelectedPlanName(plan);
    setPaymentStep(1);
    setShowPayModal(true);
  };

  const handleSimulatePayment = () => {
    setPaymentStep(2); // processing loader
    setTimeout(() => {
      // Create new user subscription details
      const durationDays = isYearly ? 365 : 30;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + durationDays);
      const formattedExpiry = futureDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      const updatedUser: User = {
        ...activeUser,
        subscriptionPlan: selectedPlanName || 'Free',
        subscriptionExpiry: formattedExpiry
      };

      // 1. Sync User state up
      onUpdateUser(updatedUser);

      // 2. Persist in registered users list
      const allUsers = getStoredData<User[]>('csc_users', []);
      const index = allUsers.findIndex(u => u.id === activeUser.id);
      if (index !== -1) {
        allUsers[index] = updatedUser;
        setStoredData('csc_users', allUsers);
      }

      // 3. Trigger email notification
      const price = selectedPlanName === 'Basic' 
        ? (isYearly ? '₹1,592/year (20% Off)' : '₹199/month')
        : (isYearly ? '₹3,992/year (20% Off)' : '₹499/month');

      onMockEmailTrigger(
        `Subscription Active: Welcome to SmartSpe ${selectedPlanName}!`,
        `Hi ${activeUser.name},\n\nYour transaction was successful! Your ${selectedPlanName} membership is now active until ${formattedExpiry}. \n\nTransaction Reference: TXN_SUB_${Date.now().toString().slice(-6)}\nAmount Paid: ${price}\nThank you for choosing SmartSpe!`,
        activeUser.email
      );

      setPaymentStep(3); // success view
    }, 2500);
  };

  const handleCancelSubscription = () => {
    if (window.confirm('क्या आप सचमुच अपनी एक्टिव सब्सक्रिप्शन को निरस्त (Cancel) करना चाहते हैं?')) {
      const updatedUser: User = {
        ...activeUser,
        subscriptionPlan: 'Free',
        subscriptionExpiry: undefined
      };

      onUpdateUser(updatedUser);

      // Sync registered users
      const allUsers = getStoredData<User[]>('csc_users', []);
      const index = allUsers.findIndex(u => u.id === activeUser.id);
      if (index !== -1) {
        allUsers[index] = updatedUser;
        setStoredData('csc_users', allUsers);
      }
      alert('Subscription cancelled. Your account mode changed to baseline Free.');
    }
  };

  // Pricing calculations
  const basicPrice = isYearly ? 1592 : 199;
  const premiumPrice = isYearly ? 3992 : 499;

  return (
    <div className="flex flex-col gap-6 font-sans">
      
      {/* HEADER SECTION */}
      <div className="panel-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="panel-title flex items-center gap-2 text-2xl font-black">
            <Crown className="w-6 h-6 text-yellow-500 shrink-0" />
            <span>SmartSpe Premium VIP Member Club</span>
          </h2>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            अपने डिजिटल सेवा केंद्र (CSC Center) को अपग्रेड करें। टूल्स का उपयोग बढ़ाएं और अधिक कमीशन कमाएं।
          </p>
        </div>

        {/* Toggle billing period */}
        <div className="flex items-center gap-3 bg-gray-100 dark:bg-slate-900/60 p-1 rounded-xl self-start border border-gray-200 dark:border-gray-800">
          <button 
            onClick={() => setIsYearly(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!isYearly ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setIsYearly(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${isYearly ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
          >
            Yearly
            <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">Save 20%</span>
          </button>
        </div>
      </div>

      {/* ACTIVE PLAN METRIC BLOCK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="metric-card bg-gradient-to-r from-slate-900 to-slate-950 text-white border-blue-500/20 p-5 rounded-2xl flex flex-col justify-between min-h-36">
          <div>
            <div className="text-gray-400 text-xs font-bold uppercase tracking-widest flex justify-between items-center">
              <span>Your Active Tier / प्लान</span>
              {currentPlan !== 'Free' ? (
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">Active</span>
              ) : (
                <span className="bg-gray-500/20 text-gray-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-gray-500/30">Standard</span>
              )}
            </div>
            <div className="text-3xl font-black mt-2 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500 shrink-0 animate-pulse" />
              <span>{currentPlan === 'Premium' ? 'Premium Pro Pro' : currentPlan === 'Basic' ? 'Basic Starter' : 'Baseline Free'}</span>
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-4 flex items-center justify-between border-t border-white/5 pt-3">
            <span>Valid Until: {expiryDateString}</span>
            {currentPlan !== 'Free' && (
              <button 
                onClick={handleCancelSubscription}
                className="text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
              >
                Disable Plan
              </button>
            )}
          </div>
        </div>

        <div className="metric-card bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">
              Gated Tool Access Status / टूल्स स्टेटस
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span>Resume & Biodata Builder:</span>
                <span className={`font-bold ${currentPlan !== 'Free' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {currentPlan !== 'Free' ? 'Unlocked (चालू)' : 'Locked (बंद)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Aadhaar ID Crop Engine:</span>
                <span className={`font-bold ${currentPlan === 'Premium' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {currentPlan === 'Premium' ? 'Unlocked (चालू)' : 'Locked (Premium Only)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Advanced Multi-Staff Records:</span>
                <span className={`font-bold ${currentPlan === 'Premium' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {currentPlan === 'Premium' ? 'Unlocked (चालू)' : 'Locked (Premium Only)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="metric-card bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-blue-900 dark:text-blue-300">UPI Automated Settlement</h4>
              <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed mt-1">
                सभी पेमेंट्स लाइव सिमूलेट होकर आपके डिजिटल वॉलेट से लिंक होते हैं। रसीद आपके ईमेल पर तुरंत पहुंचती है।
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* PLAN COMPARISON CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        
        {/* FREE PLAN */}
        <div className="config-card flex flex-col justify-between border-gray-200 dark:border-gray-800 p-6 relative">
          <div>
            <div className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-1">STANDARD</div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Baseline Free</h3>
            <p className="text-xs text-gray-400 mt-2">सीमित उपयोग, मूल लेजर एंट्रीज के लिए और शुरुआती कार्यकर्ताओं के लिए।</p>
            
            <div className="my-6">
              <span className="text-4xl font-extrabold text-gray-900 dark:text-white">₹0</span>
              <span className="text-gray-400 text-xs ml-1">/ lifetime</span>
            </div>

            <ul className="space-y-3 border-t border-gray-100 dark:border-gray-800/80 pt-4 text-xs">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Standard Ledger Accounting</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Basic Age Calculator Tool</li>
              <li className="flex items-center gap-2 text-gray-400"><X className="w-4 h-4 text-red-500 shrink-0" /> High-Resolution ID Card Cropper (Locked)</li>
              <li className="flex items-center gap-2 text-gray-400"><X className="w-4 h-4 text-red-500 shrink-0" /> Marriage Biodata PDF Tool (Locked)</li>
              <li className="flex items-center gap-2 text-gray-400"><X className="w-4 h-4 text-red-500 shrink-0" /> Staff Directory Manager (Locked)</li>
            </ul>
          </div>

          <button 
            disabled={currentPlan === 'Free'}
            className="w-full mt-8 btn-secondary py-3 text-xs"
          >
            {currentPlan === 'Free' ? 'Current Active' : 'Downgrade via Reset'}
          </button>
        </div>

        {/* BASIC PLAN */}
        <div className="config-card flex flex-col justify-between border-blue-500/20 p-6 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full shadow-md">
            POPULAR FOR BIODATA
          </div>

          <div>
            <div className="font-bold text-blue-500 text-xs uppercase tracking-widest mb-1 mt-1">STARTER PACK</div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Basic Value (कम बजट प्लान)</h3>
            <p className="text-xs text-gray-400 mt-2">वैकल्पिक टूल्स अनलॉक करके ग्राहकों को सुंदर विवाह बायोडाटा और रेज़्यूमे बनायें।</p>
            
            <div className="my-6">
              <span className="text-4xl font-extrabold text-gray-900 dark:text-white">₹{basicPrice}</span>
              <span className="text-gray-400 text-xs ml-1">/ {isYearly ? 'yearly' : 'monthly'}</span>
            </div>

            <ul className="space-y-3 border-t border-gray-100 dark:border-gray-800/80 pt-4 text-xs">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Standard Ledger + Cash Book</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Unlocked: <strong>Marriage Biodata Creator</strong></li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Unlocked: <strong>Professional Job Resumes</strong></li>
              <li className="flex items-center gap-2 text-gray-400"><X className="w-4 h-4 text-red-500 shrink-0" /> High-Resolution Aadhaar ID Cropper (Locked)</li>
              <li className="flex items-center gap-2 text-gray-400"><X className="w-4 h-4 text-red-500 shrink-0" /> Multi-Staff Directory Config (Locked)</li>
            </ul>
          </div>

          <button 
            onClick={() => handleOpenCheckout('Basic')}
            className={`w-full mt-8 btn-primary bg-gradient-to-r from-blue-600 to-cyan-500 py-3 text-xs ${currentPlan === 'Basic' ? 'opacity-70 pointer-events-none' : ''}`}
          >
            {currentPlan === 'Basic' ? 'Current Active (एक्टिव है)' : 'Upgrade to Basic'}
          </button>
        </div>

        {/* PREMIUM PLAN */}
        <div className="config-card flex flex-col justify-between border-amber-500/30 p-6 relative bg-gradient-to-b from-slate-950/20 to-slate-950/60">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full shadow-md">
            RECOMMENDED FOR AGENTS
          </div>

          <div>
            <div className="font-bold text-amber-500 text-xs uppercase tracking-widest mb-1 mt-1">BEST CHOICE</div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Premium VIP Pro</h3>
            <p className="text-xs text-gray-400 mt-2">सभी टूल्स और सेटिंग्स पूर्ण रूप से ऑटोमेटेड और अनब्लॉक। बेस्ट कमीशन ग्रोथ।</p>
            
            <div className="my-6">
              <span className="text-4xl font-extrabold text-amber-500">₹{premiumPrice}</span>
              <span className="text-gray-400 text-xs ml-1">/ {isYearly ? 'yearly' : 'monthly'}</span>
            </div>

            <ul className="space-y-3 border-t border-gray-100 dark:border-gray-800/80 pt-4 text-xs">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> <strong>Full Access to Aadhaar & Pan ID Cropper</strong></li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> <strong>Marriage Biodata & Resume Builder</strong></li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Advanced Financial Reports Hub</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Unlimited custom services + commission catalog</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Premium VIP Live Call Support Priority</li>
            </ul>
          </div>

          <button 
            onClick={() => handleOpenCheckout('Premium')}
            className={`w-full mt-8 btn-primary bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:text-black font-black py-3 text-xs ${currentPlan === 'Premium' ? 'opacity-70 pointer-events-none' : ''}`}
          >
            {currentPlan === 'Premium' ? 'Current Active (एक्टिव है)' : 'Upgrade to Premium'}
          </button>
        </div>

      </div>

      {/* UPI CHECKOUT POPUP MODAL */}
      {showPayModal && (
        <div className="modal-overlay active" style={{ zIndex: 99999 }}>
          <div className="modal-card w-full max-w-md bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 text-left">
            
            <div className="modal-header border-b border-gray-100 dark:border-gray-800 pb-3 flex justify-between items-center">
              <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>SmartPay Secure Gateway (सिम्युलेटेड भुगतान)</span>
              </div>
              <button 
                onClick={() => setShowPayModal(false)}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="modal-body py-4">
              
              {/* STEP 1: SCAN QR CHECKOUT */}
              {paymentStep === 1 && (
                <div className="flex flex-col gap-4">
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block">BILLING ITEM</span>
                    <h4 className="text-base font-black text-gray-900 dark:text-white mt-0.5">
                      {selectedPlanName === 'Basic' ? 'SmartSpe Basic Starter Pack' : 'SmartSpe Premium VIP Pro Pack'}
                    </h4>
                    <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                      ₹{selectedPlanName === 'Basic' ? basicPrice : premiumPrice} / {isYearly ? 'Yearly Plan' : 'Monthly Plan'}
                    </p>
                  </div>

                  {/* Mock UPI selectors */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <button 
                      onClick={() => setCurrentUpiMode('qr')}
                      className={`p-2 border rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${currentUpiMode === 'qr' ? 'border-blue-500 bg-blue-50/10' : 'border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/40'}`}
                    >
                      <QrCode className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      <span className="text-[10px]">QR Scan</span>
                    </button>
                    <button 
                      onClick={() => setCurrentUpiMode('gpay')}
                      className={`p-2 border rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${currentUpiMode === 'gpay' ? 'border-blue-500 bg-blue-50/10' : 'border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/40'}`}
                    >
                      <Smartphone className="w-5 h-5 text-amber-500" />
                      <span className="text-[10px]">Google Pay</span>
                    </button>
                    <button 
                      onClick={() => setCurrentUpiMode('phonepe')}
                      className={`p-2 border rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${currentUpiMode === 'phonepe' ? 'border-blue-500 bg-blue-50/10' : 'border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/40'}`}
                    >
                      <Smartphone className="w-5 h-5 text-purple-500" />
                      <span className="text-[10px]">PhonePe</span>
                    </button>
                    <button 
                      onClick={() => setCurrentUpiMode('paytm')}
                      className={`p-2 border rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${currentUpiMode === 'paytm' ? 'border-blue-500 bg-blue-50/10' : 'border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/40'}`}
                    >
                      <Smartphone className="w-5 h-5 text-cyan-500" />
                      <span className="text-[10px]">Paytm</span>
                    </button>
                  </div>

                  {currentUpiMode === 'qr' && (
                    <div className="flex flex-col items-center gap-3 py-2 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-dashed border-blue-500/30">
                      <div className="w-36 h-36 bg-white p-2 rounded-lg flex items-center justify-center shadow-inner relative group border border-slate-200">
                        {/* Dynamic Dummy QR code */}
                        <div className="w-full h-full bg-[radial-gradient(#1e293b_40%,transparent_0%)] bg-[size:8px_8px] flex items-center justify-center">
                          <span className="text-[10px] font-black text-blue-600 bg-white/90 p-1 border rounded z-10 select-none">UPI PAYMENT SCAN</span>
                        </div>
                      </div>
                      <div className="text-center text-[10px] text-gray-500 leading-relaxed max-w-xs">
                        <span className="font-bold block text-gray-700 dark:text-gray-300">Scan this QR via PhonePe, GPay or Paytm app to initiate checkout</span>
                        अपने पसंदीदा ऐप से क्यूआर कोड को स्कैन करें और पिन दर्ज़ करें।
                      </div>
                    </div>
                  )}

                  {currentUpiMode !== 'qr' && (
                    <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-950/60 border border-gray-100 dark:border-gray-800 rounded-xl">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Enter UPI ID / वीपीए आईडी</label>
                      <input 
                        type="text" 
                        placeholder="yourname@okhdfcbank" 
                        defaultValue={`${activeUser.mobile}@okaxis`}
                        className="p-2 border rounded bg-white dark:bg-slate-900 border-gray-300 dark:border-gray-800 text-xs text-slate-800 dark:text-white"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">UPI transaction alert prompt will appear on your device.</p>
                    </div>
                  )}

                  <button 
                    onClick={handleSimulatePayment}
                    className="btn-primary w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 border-none text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow cursor-pointer mt-2"
                  >
                    <Smartphone className="w-5 h-5 shrink-0" />
                    Simulate Payment Complete (भुगतान का सिम्यूलेशन करें)
                  </button>
                </div>
              )}

              {/* STEP 2: PROCESSING TRANSACTION LOADER */}
              {paymentStep === 2 && (
                <div className="flex flex-col items-center text-center gap-4 py-8">
                  <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <h3 className="font-black text-lg text-gray-900 dark:text-white">Connecting Secure Bank Servers...</h3>
                    <p className="text-xs text-gray-400 mt-2 max-w-xs leading-relaxed">
                      Please do not refresh nor navigate back. Processing token settlements & issuing simulated VIP credentials.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 3: TRANSACTION SUCCESS SUMMARY */}
              {paymentStep === 3 && (
                <div className="flex flex-col items-center text-center gap-5 py-6">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-500 rounded-full flex items-center justify-center shadow">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-gray-900 dark:text-white">Transaction Succeeded!</h3>
                    <p className="text-xs text-emerald-500 font-bold mt-1 uppercase tracking-wide">
                      Congratulations / बधाई हो! SMART-SPE MEMEBUR DISCOVERED
                    </p>
                    <p className="text-xs text-gray-400 mt-3 max-w-xs leading-relaxed">
                      तैयार है आपका {selectedPlanName} प्लान। सभी टूल्स और फीचर्स स्वचालित रूप से सक्रिय हो चुके हैं। रसीद आपके इनबॉक्स (नीचे दाईं ओर) दिखाई देगी।
                    </p>
                  </div>

                  <button 
                    onClick={() => {
                      setShowPayModal(false);
                      // Full page reload or local recompute triggers rendering of unlocked tabs
                    }}
                    className="btn-primary w-full mt-4 py-3 bg-slate-900 hover:bg-slate-950"
                  >
                    Close Setup & Continue (होम स्क्रीन पर जाएँ)
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
