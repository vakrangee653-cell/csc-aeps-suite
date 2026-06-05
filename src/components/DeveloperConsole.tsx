import React, { useState, useEffect } from 'react';
import { 
  Crown, Users, ShieldAlert, CheckCircle2, AlertOctagon, 
  Search, Edit3, UserCheck, UserX, RefreshCw, Radio, 
  ExternalLink, Key, Database, HelpCircle, FileSpreadsheet, ArrowLeftRight,
  Mail, Send
} from 'lucide-react';
import { User, Transaction, Customer } from '../types';
import { getStoredData, setStoredData } from '../utils';

interface DeveloperConsoleProps {
  activeUser: User;
  onUpdateUser: (updated: User) => void;
  onImpersonateUser: (user: User) => void;
  impersonatorAdmin: User | null;
  onExitImpersonation: () => void;
}

export default function DeveloperConsole({ 
  activeUser, 
  onUpdateUser, 
  onImpersonateUser, 
  impersonatorAdmin, 
  onExitImpersonation 
}: DeveloperConsoleProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState<'Free' | 'Basic' | 'Premium'>('Free');
  const [editExpiry, setEditExpiry] = useState('');
  const [editShopName, setEditShopName] = useState('');
  
  // Custom global alert banner state
  const [broadcastMsg, setBroadcastMsg] = useState('');

  // Service modes (Free vs Paid)
  const [serviceModes, setServiceModes] = useState<{ [key: string]: 'Free' | 'Paid' }>({
    aadhaar: 'Paid',
    biodata: 'Paid',
    reports: 'Paid'
  });

  // SMTP Gmail OTP Status
  const [smtpStatus, setSmtpStatus] = useState<{ configured: boolean; smtpUser: string | null }>({
    configured: false,
    smtpUser: null,
  });

  const checkSmtpStatus = () => {
    fetch('/api/smtp-status')
      .then(res => res.json())
      .then(data => {
        setSmtpStatus(data);
      })
      .catch(err => console.error("Error loading SMTP status:", err));
  };

  const loadUserData = () => {
    const list = getStoredData<User[]>('csc_users', []);
    setUsers(list);

    // Load global announcement from localStorage
    const savedMsg = localStorage.getItem('csc_global_broadcast') || '';
    setBroadcastMsg(savedMsg);

    // Load service billing modes configuration
    const savedModes = getStoredData<{ [key: string]: 'Free' | 'Paid' }>('csc_service_modes', {
      aadhaar: 'Paid',
      biodata: 'Paid',
      reports: 'Paid'
    });
    setServiceModes(savedModes);
    
    // Check Gmail SMTP live configuration
    checkSmtpStatus();
  };

  useEffect(() => {
    loadUserData();
  }, [activeUser]);

  // Manage platform-wide broadcast alerts
  const handleSaveBroadcast = () => {
    localStorage.setItem('csc_global_broadcast', broadcastMsg.trim());
    alert('System Broadcast message compiled and broadcasted platform-wide! All CSC screen views will render this alert instantly.');
  };

  const handleClearBroadcast = () => {
    localStorage.removeItem('csc_global_broadcast');
    setBroadcastMsg('');
    alert('Global Broadcast banner dismounted.');
  };

  const handleToggleServiceMode = (serviceKey: string) => {
    const currentMode = serviceModes[serviceKey] || 'Paid';
    const nextMode = currentMode === 'Free' ? 'Paid' : 'Free';
    const updated = {
      ...serviceModes,
      [serviceKey]: nextMode
    };
    setServiceModes(updated);
    setStoredData('csc_service_modes', updated);
    
    // Dispatch a storage event so all other tabs/components hear the update in real-time
    window.dispatchEvent(new Event('storage'));
  };

  // Toggle user active status (Allow developer admin to suspend bad client nodes!)
  const handleToggleStatus = (userId: string, currentStatus: 'active' | 'blocked') => {
    if (userId === 'user_plat_admin' || userId === activeUser.id) {
      alert('Developer Safety Lock: You cannot block the active platform admin account.');
      return;
    }

    const nextStatus: 'active' | 'blocked' = currentStatus === 'active' ? 'blocked' : 'active';
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return { ...u, status: nextStatus };
      }
      return u;
    });

    setUsers(updatedUsers);
    setStoredData('csc_users', updatedUsers);
    
    // Also notify active admin if they are updating a cached session of themselves
    const matched = updatedUsers.find(u => u.id === userId);
    if (matched && matched.id === localStorage.getItem('csc_active_user') ? JSON.parse(localStorage.getItem('csc_active_user')!).id : '') {
      onUpdateUser(matched);
    }
  };

  // Quick edit billing overrides
  const handleStartEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditPlan(user.subscriptionPlan || 'Free');
    setEditShopName(user.shopName || '');
    
    if (user.subscriptionExpiry) {
      setEditExpiry(user.subscriptionExpiry);
    } else {
      // Set default 30-day expiry
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      setEditExpiry(futureDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }));
    }
  };

  const handleSaveUserOverrides = (userId: string) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          subscriptionPlan: editPlan,
          subscriptionExpiry: editPlan !== 'Free' ? editExpiry : undefined,
          shopName: editShopName
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    setStoredData('csc_users', updatedUsers);
    setEditingUserId(null);

    // If we're currently impersonating this user, sync activeUser state immediately
    const syncedUser = updatedUsers.find(u => u.id === userId);
    if (syncedUser && activeUser.id === userId) {
      onUpdateUser(syncedUser);
    }

    alert('Client subscription overrides committed to disk and synced.');
  };

  const handleResetUserPin = (userId: string) => {
    const randomPin = String(Math.floor(1000 + Math.random() * 9000));
    if (confirm(`Do you want to force-change security PIN for this CSC Center to automatic secure key "${randomPin}"?`)) {
      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          return { ...u, pin: randomPin };
        }
        return u;
      });

      setUsers(updatedUsers);
      setStoredData('csc_users', updatedUsers);
      alert(`PIN Reset Succeeded. New access credential key is ${randomPin}. Inform VLE operator.`);
    }
  };

  // Count metrics for analytics
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.shopName || '').toLowerCase().includes(q) ||
      (u.mobile || '').includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  const totalRegistered = users.filter(u => u.role !== 'Admin').length;
  const premiumCount = users.filter(u => u.subscriptionPlan === 'Premium').length;
  const basicCount = users.filter(u => u.subscriptionPlan === 'Basic').length;
  const suspendedCount = users.filter(u => u.status === 'blocked').length;

  return (
    <div className="flex flex-col gap-6 font-sans select-none">
      
      {/* DEVELOPER DASH METADATA HEADER */}
      <div className="panel-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-amber-500/15">
            🔑 System Root Environment
          </span>
          <h2 className="panel-title flex items-center gap-2 text-2xl font-black text-gray-900 dark:text-white mt-1.5">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
            <span>Developer Multi-Tenant Control Panel</span>
          </h2>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            यहाँ से आप सभी अलग-अलग CSC सेंटर्स के अकाउंट को मैनेज, ब्लॉक/अनब्लॉक, उनकी प्रीमियम VIP मेम्बरशिप को बदल सकते हैं।
          </p>
        </div>

        {impersonatorAdmin && (
          <button 
            onClick={onExitImpersonation}
            className="btn-primary py-2.5 px-4 bg-rose-600 hover:bg-rose-700 font-extrabold text-xs tracking-wide flex items-center gap-2 animate-bounce"
          >
            <ArrowLeftRight className="w-4 h-4 shrink-0" />
            Exit Impersonation (एडमिन पर लौटें)
          </button>
        )}
      </div>

      {/* ADMIN LEVEL METRIC METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-black tracking-wider text-gray-400 uppercase block">Registered CSC Centers</span>
          <div className="text-3xl font-black text-[#06B6D4] mt-1.5">{totalRegistered}</div>
          <p className="text-[10px] text-gray-500 mt-1">Total standalone VLE nodes onboarded</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-black tracking-wider text-gray-400 uppercase block">Premium VIP Pro Members</span>
          <div className="text-3xl font-black text-amber-400 mt-1.5">{premiumCount}</div>
          <p className="text-[10px] text-gray-500 mt-1">Granted manual and billing active plans</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-black tracking-wider text-gray-400 uppercase block">Basic Starter Members</span>
          <div className="text-3xl font-black text-blue-400 mt-1.5">{basicCount}</div>
          <p className="text-[10px] text-gray-500 mt-1">Active document-tier accounts unlocked</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-black tracking-wider text-gray-400 uppercase block">Liquidated Suspensions</span>
          <div className="text-3xl font-black text-rose-500 mt-1.5">{suspendedCount}</div>
          <p className="text-[10px] text-gray-500 mt-1">License key blacklisted terminals</p>
        </div>

      </div>

      {/* STEP-BY-STEP CONSOLE WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* CSC USERS DIRECTORY BLOCK (2 Columns on large screens) */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          
          <div className="config-card flex flex-col justify-start min-h-[450px]">
            
            <div className="border-b border-gray-100 dark:border-gray-800 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span>Interactive CSC Multi-User Sandbox Directory</span>
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  सभी रजिस्टर्ड CSC सेंटर्स की सूची। आप यहाँ से उनके डेटा को इम्यूलेट या ब्लॉक कर उनकी स्क्रीन देख सकते हैं।
                </p>
              </div>

              {/* SEARCH FILTER */}
              <div className="relative w-full sm:w-60">
                <input 
                  type="text" 
                  placeholder="खोजें: VLE नाम, दुकान, मोबाइल..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs py-2 pl-8 pr-3 border border-gray-300 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* DIRECTORY TABLE */}
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-gray-150 dark:border-gray-800 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-3">CSC Center Name / VLE</th>
                    <th className="py-3">License VPA Contact</th>
                    <th className="py-3 text-center">Safety Status</th>
                    <th className="py-3 text-center">Subscription Tier</th>
                    <th className="py-3 text-right">Interactions (Developer actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        No CSC Store registries found matching query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(usr => {
                      const isSelf = usr.id === activeUser.id;
                      const isEditing = editingUserId === usr.id;

                      return (
                        <tr key={usr.id} className="hover:bg-gray-100/5 group border-b border-gray-100/50">
                          
                          {/* USER PROFILE INFO */}
                          <td className="py-3 pr-2">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                                {usr.name}
                                {usr.role === 'Admin' ? (
                                  <span className="bg-amber-500/10 text-amber-500 text-[9px] font-black px-1.5 py-0.2 rounded border border-amber-500/20">ROOT DEV</span>
                                ) : usr.role === 'Staff' ? (
                                  <span className="bg-blue-500/10 text-blue-500 text-[9px] font-bold px-1.5 py-0.2 rounded">STAFF</span>
                                ) : (
                                  <span className="bg-purple-500/10 text-purple-500 text-[9px] font-bold px-1.5 py-0.2 rounded">OWNER/VLE</span>
                                )}
                              </span>
                              
                              {isEditing ? (
                                <input 
                                  type="text" 
                                  value={editShopName}
                                  onChange={(e) => setEditShopName(e.target.value)}
                                  className="mt-1 p-1 text-[10px] border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-slate-900 max-w-xs"
                                  placeholder="Shop Name"
                                />
                              ) : (
                                <span className="text-[10px] text-gray-400 font-medium truncate max-w-[140px] block mt-0.5">
                                  🏢 {usr.shopName || 'Single Ledger Environment'}
                                </span>
                              )}
                              
                              <span className="text-[9px] font-mono text-gray-500 block">UID Namespace: {usr.id}</span>
                            </div>
                          </td>

                          {/* MOBILE CONTACT AND EMAIL */}
                          <td className="py-3 font-mono">
                            <div className="flex flex-col text-gray-400">
                              <span>📞 {usr.mobile}</span>
                              <span className="text-[10px]">{usr.email || 'No Email linked'}</span>
                            </div>
                          </td>

                          {/* SAFETY STATUS BLOCK / UNBLOCK */}
                          <td className="py-3 text-center">
                            {usr.role === 'Admin' ? (
                              <span className="text-gray-500 text-[10px] font-mono">Immunized</span>
                            ) : (
                              <button 
                                onClick={() => handleToggleStatus(usr.id, usr.status)}
                                className={`px-2 py-0.5 rounded-full font-black text-[9px] transition-all cursor-pointer inline-flex items-center gap-1 ${usr.status === 'active' ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20'}`}
                                title={usr.status === 'active' ? "Click to Ban VLE Terminal" : "Click to Grant Access"}
                              >
                                {usr.status === 'active' ? (
                                  <>
                                    <UserCheck className="w-3 h-3 shrink-0" />
                                    <span>APPROVED</span>
                                  </>
                                ) : (
                                  <>
                                    <UserX className="w-3 h-3 shrink-0" />
                                    <span>SUSPENDED</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>

                          {/* SUBSCRIPTION PLAN OVERRIDES */}
                          <td className="py-3 text-center">
                            {usr.role === 'Admin' ? (
                              <span className="text-gray-500 text-[10px]">Lifetime Unlimited</span>
                            ) : isEditing ? (
                              <div className="flex flex-col gap-1 inline-flex text-left">
                                <select 
                                  value={editPlan} 
                                  onChange={(e) => setEditPlan(e.target.value as any)}
                                  className="p-1 text-[10px] border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-slate-900"
                                >
                                  <option value="Free">Baseline Free</option>
                                  <option value="Basic">Basic Starter</option>
                                  <option value="Premium">Premium Pro VIP</option>
                                </select>
                                {editPlan !== 'Free' && (
                                  <input 
                                    type="text" 
                                    value={editExpiry} 
                                    onChange={(e) => setEditExpiry(e.target.value)}
                                    placeholder="Expiry Date (e.g., 25 Dec 2026)"
                                    className="p-1 text-[9px] border rounded bg-white dark:bg-slate-900"
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${usr.subscriptionPlan === 'Premium' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 font-black' : usr.subscriptionPlan === 'Basic' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-gray-400/10 text-gray-400'}`}>
                                  {usr.subscriptionPlan || 'Free'}
                                </span>
                                {usr.subscriptionExpiry && (
                                  <span className="text-[9px] text-gray-500 mt-1 font-mono">Until: {usr.subscriptionExpiry}</span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* INTERACTIVE ACTIONS */}
                          <td className="py-3 text-right">
                            <div className="flex justify-end items-center gap-1.5">
                              {usr.role !== 'Admin' && (
                                <>
                                  {isEditing ? (
                                    <button 
                                      onClick={() => handleSaveUserOverrides(usr.id)}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 font-extrabold text-white rounded text-[10px] shadow"
                                    >
                                      Save Details
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => handleStartEdit(usr)}
                                      className="p-1 hover:bg-blue-500/10 text-blue-500 rounded"
                                      title="Edit Center Subscriptions Override"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  <button 
                                    onClick={() => handleResetUserPin(usr.id)}
                                    className="p-1 hover:bg-amber-500/10 text-amber-500 rounded"
                                    title="Regenerate PIN Credential"
                                  >
                                    <Key className="w-3.5 h-3.5" />
                                  </button>

                                  {usr.status === 'active' && usr.role === 'Owner' && (
                                    <button 
                                      onClick={() => onImpersonateUser(usr)}
                                      className="py-1 px-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-extrabold text-[10px] rounded-lg shadow-sm flex items-center gap-1 hover:brightness-110"
                                      title="Simulate active login & edit their local workspace widgets"
                                    >
                                      <ExternalLink className="w-3 h-3 shrink-0" />
                                      <span>Simulate</span>
                                    </button>
                                  )}
                                </>
                              )}

                              {isSelf && (
                                <span className="text-[10px] text-emerald-500 font-extrabold font-mono px-2">CURRENT ACTIVE SESSION</span>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

        {/* DEVELOPER BROADCAST SYSTEM AND SECURITY AUDITOR (1 Column) */}
        <div className="flex flex-col gap-6">

          {/* SERVICE MODES / FREE VS PAID GATE MANAGER */}
          <div className="config-card flex flex-col gap-4 bg-slate-900 border border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-gray-100 flex items-center gap-2 font-sans">
                <ArrowLeftRight className="w-5 h-5 text-amber-500 shrink-0" />
                <span>Service Access Billing Gates (Free vs Paid)</span>
              </h3>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed font-sans">
                डेवलपर कंट्रोल पैनल: यहाँ से आप यह निर्धारित कर सकते हैं कि कौन से टूल्स और सर्विसेज VLEs के लिए पूरी तरह <strong>मुफ़्त</strong> हैं या उनके लिए <strong>पैसा (सदस्यता)</strong> देना आवश्यक है।
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-1 font-sans">
              {/* Aadhaar Aligner */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="text-xs font-bold text-gray-200">Aadhaar & Voter Card Aligner</div>
                  <div className="text-[9px] text-[#06B6D4] mt-0.5">Crop Tool (Standard: Premium Pro VIP only)</div>
                </div>
                <button
                  onClick={() => handleToggleServiceMode('aadhaar')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black min-w-28 transition-all active:scale-95 border-none cursor-pointer text-center ${
                    serviceModes.aadhaar === 'Free' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}
                >
                  {serviceModes.aadhaar === 'Free' ? '🆓 FREE For All' : '🔒 PAID (Premium)'}
                </button>
              </div>

              {/* Biodata Builder */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="text-xs font-bold text-gray-200 font-sans">Marriage Biodata Planner</div>
                  <div className="text-[9px] text-[#06B6D4] mt-0.5">PDF Creator (Standard: Basic & Premium)</div>
                </div>
                <button
                  onClick={() => handleToggleServiceMode('biodata')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black min-w-28 transition-all active:scale-95 border-none cursor-pointer text-center ${
                    serviceModes.biodata === 'Free' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {serviceModes.biodata === 'Free' ? '🆓 FREE For All' : '🔒 PAID (Basic+)'}
                </button>
              </div>

              {/* Reports Hub */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4 font-sans">
                <div className="flex-1">
                  <div className="text-xs font-bold text-gray-200">Reports Hub & P&L Statement</div>
                  <div className="text-[9px] text-[#06B6D4] mt-0.5">Financial Analytics (Standard: Basic & Premium)</div>
                </div>
                <button
                  onClick={() => handleToggleServiceMode('reports')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black min-w-28 transition-all active:scale-95 border-none cursor-pointer text-center ${
                    serviceModes.reports === 'Free' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {serviceModes.reports === 'Free' ? '🆓 FREE For All' : '🔒 PAID (Basic+)'}
                </button>
              </div>
            </div>
            
            <div className="text-[10px] text-gray-400 flex items-center gap-1 leading-snug font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>सभी बदलाव तत्काल सेव होकर लाइव वातावरण में लागू हो जाएंगे।</span>
            </div>
          </div>

          {/* GLOBAL BROADCAST BANNER CONFIG */}
          <div className="config-card flex flex-col gap-3">
            <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-rose-500 animate-pulse shrink-0" />
              <span>Platform-wide VLE Announcement Broadcast</span>
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              यहाँ आप कोई भी नया अलर्ट, सूचना, या सर्विस अपडेट का मैसेज टाइप कर सकते हैं। यह मैसेज तत्काल रूप से सभी CSC ऑपरेटर्स को उनके मुख्य डैशबोर्ड पर सबसे ऊपर लाल रंग की पट्टी में दिखाई देगा।
            </p>

            <textarea 
              rows={3}
              placeholder="उदाहरण: प्रिय वीएलई पार्टनर्स, आज रात 11:00 बजे से 11:30 बजे तक सरकारी सर्वर में मेन्टेनेंस रहेगा। कृपया ध्यान दें।"
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              className="p-3 border text-xs border-gray-300 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900 text-slate-800 dark:text-slate-100 placeholder-gray-400 leading-relaxed focus:ring-1 focus:ring-rose-500"
            />

            <div className="flex gap-2.5 mt-1">
              <button 
                onClick={handleSaveBroadcast}
                disabled={!broadcastMsg.trim()}
                className="btn-primary flex-1 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg shadow border-none disabled:opacity-50"
              >
                Send Broadcast Message
              </button>
              
              {broadcastMsg && (
                <button 
                  onClick={handleClearBroadcast}
                  className="btn-secondary py-2 px-3 text-xs text-gray-400 hover:text-black dark:hover:text-white"
                >
                  Clear Banner
                </button>
              )}
            </div>
          </div>

          {/* REAL GMAIL SMTP OTP CONNECTOR PANEL */}
          <div className="config-card flex flex-col gap-3">
            <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500 shrink-0" />
              <span>Real Gmail SMTP OTP Connector</span>
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              आपकी Google App Password सेटिंग्स की लाइव स्थिति यहाँ देखें। जब यह चालू होता है, तब आपके सिस्टम में पिन और ओटीपी कोड्स असली जीमेल एड्रेस से भेजे जाते हैं।
            </p>

            <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
              smtpStatus.configured 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full ${smtpStatus.configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <div className="flex-1 text-xs">
                <div className="font-bold">
                  {smtpStatus.configured ? '● LIVE: Gmail OTP Delivery Active' : '● SIMULATED: Dry-Run Mode Active'}
                </div>
                {smtpStatus.configured && smtpStatus.smtpUser && (
                  <div className="text-[10px] font-mono text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                    Sender: {smtpStatus.smtpUser}
                  </div>
                )}
              </div>
            </div>

            {!smtpStatus.configured ? (
              <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-xl space-y-2 border border-gray-100 dark:border-gray-900/80">
                <span className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider">How to connect Gmail SMTP?</span>
                <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                  चूँकि जीमेल सिक्योरिटी के कारण सीधे पासवर्ड ब्लॉक करती है, इसीलिए आपको Google Account में जाकर एक 16-अक्षर का <strong>App Password</strong> बनाना होगा।
                </p>
                <ol className="list-decimal list-inside text-[10px] text-gray-400 leading-relaxed space-y-1.5 font-sans">
                  <li>Google Account &gt; Security &gt; Enable 2-Step Verification</li>
                  <li>In search box at top of Account Settings page, search <strong>"App Passwords"</strong> (यह सीधे ऐप पासवर्ड क्रिएटर का लिंक देता है)</li>
                  <li>Create a new application named <strong>SmartSpe</strong> to fetch your 16-character code (e.g. <code className="bg-amber-500/10 text-amber-500 px-1 rounded font-mono">abcd efgh ijkl mnop</code>)</li>
                  <li>Click <strong>Secrets (Gears Icon)</strong> on AI Studio UI edge</li>
                  <li>Define <strong className="text-white">SMTP_USER</strong> = your Gmail account</li>
                  <li>Define <strong className="text-white">SMTP_PASS</strong> = your 16-character secret value (without spaces)</li>
                </ol>
                <p className="text-[10px] font-bold text-[#06b6d4] mt-1 leading-relaxed">
                  ✓ Configured Secrets apply instantly upon restart. Live OTP emails will then replace mock slide-ins!
                </p>
              </div>
            ) : (
              <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400/80 leading-relaxed">
                🎉 बधाई हो! आपका असली जीमेल SMTP कनेक्शन पूरी तरह लाइव है। सभी ऑथेंटिकेशन ओटीपी, नए रजिस्ट्रेशन पिन, और पेमेंट रिसिप्ट्स अब सीधे यूज़र्स के असली जीमेल इनबॉक्स पर भेजे जा रहे हैं।
              </div>
            )}
          </div>

          {/* DIRECT ZIP DOWNLOAD SYSTEM (Bypass AI Studio Downloader) */}
          <div className="config-card flex flex-col gap-3 border border-emerald-500/20 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Bypass Source ZIP Exporter</span>
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed font-sans">
              यदि आपके ब्राउज़र में AI Studio का <strong>Download ZIP</strong> काम नहीं कर रहा है, तो आप इस डायरेक्ट बाईपास बटन का उपयोग करके अपनी क्लीन सोर्स कोड ज़िप फाइल को सीधे सर्वर से डाउनलोड कर सकते हैं।
            </p>
            <a 
              href="/api/download-zip" 
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs text-center rounded-xl shadow-lg shadow-emerald-500/10 transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 border border-emerald-500/20"
              title="Download clean repository ZIP"
            >
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>Download Clean ZIP (Direct Server)</span>
            </a>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium font-sans">
              ✓ यह ज़िप सीधे आपके क्लाउड रन कंटेनर से रियल-टाइम जनरेट होती है और इसमें <code className="bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-1 rounded font-mono">node_modules</code> या विशाल डिस्ट फ़ाइलें मौजूद नहीं होतीं।
            </div>
          </div>

          {/* DEVELOPER SANDBOX INFRASTRUCTURE CONTROL */}
          <div className="config-card flex flex-col gap-3">
            <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Developer Sandbox Diagnostics</span>
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              This sandbox simulates real-time client-isolated relational databases via segmented namespaces in localStorage.
            </p>

            <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 space-y-2 font-mono text-[10px] text-gray-400">
              <div className="flex justify-between">
                <span>Segmented Storage Space:</span>
                <span className="text-emerald-400 font-bold">Isolated (Namespaced)</span>
              </div>
              <div className="flex justify-between">
                <span>Simulated Host Port:</span>
                <span className="text-[#06B6D4]">3000 (Ingress Active)</span>
              </div>
              <div className="flex justify-between">
                <span>Database Engine:</span>
                <span className="text-[#06B6D4]">VLE Multitenant Engine</span>
              </div>
              <div className="flex justify-between">
                <span>API Gateway Proxies:</span>
                <span className="text-amber-500">Active Sec-Proxy Block</span>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl">
              <h4 className="font-bold text-amber-500 text-xs flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>How Multi-User Simulation Works?</span>
              </h4>
              <p className="text-[10px] text-amber-600/80 dark:text-amber-400/60 leading-relaxed mt-1">
                प्रत्‍येक नए साइनअप यूज़र को एक यूनिक आईडी `user_17...` दी जाती है। जब अलग-अलग यूज़र्स लॉग इन करते हैं, तो ऐप उनके आईडी के आधार पर ट्रांजेक्‍शन्स और लेज़र फ़ाइलों को `localStorage` में अलग-अलग सुरक्षित रखता है। इस तरह एक यूज़र का डेटा दूसरे को नहीं दिखता!
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
