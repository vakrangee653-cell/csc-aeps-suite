import React, { useState, useRef } from 'react';
import { 
  Settings, Download, Upload, Trash2, ArrowRightLeft, Users, Key, 
  AlertTriangle, CheckCircle2, Sliders, ShieldAlert, Sparkles, 
  Eye, EyeOff, Search 
} from 'lucide-react';
import { User, Transaction, Customer, ServiceItem } from '../types';
import { getStoredData, setStoredData, getGlobalInactiveServiceIds } from '../utils';

interface AdminPanelProps {
  activeUser: User;
  transactions: Transaction[];
  customers: Customer[];
  services: ServiceItem[];
  onDatabaseWipe: () => void;
  onToggleServiceStatus?: () => void;
}

export default function AdminPanel({ activeUser, transactions, customers, services, onDatabaseWipe, onToggleServiceStatus }: AdminPanelProps) {
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'services' | 'backups'>('users');
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>('all');
  const [inactiveServiceIds, setInactiveServiceIds] = useState<string[]>(() => {
    return getGlobalInactiveServiceIds();
  });

  const handleToggleService = (srvId: string) => {
    let nextInactive: string[];
    if (inactiveServiceIds.includes(srvId)) {
      nextInactive = inactiveServiceIds.filter(id => id !== srvId);
    } else {
      nextInactive = [...inactiveServiceIds, srvId];
    }
    setInactiveServiceIds(nextInactive);
    setStoredData('csc_global_inactive_services', nextInactive);
    
    if (onToggleServiceStatus) {
      onToggleServiceStatus();
    }
  };
  const [importedFileName, setImportedFileName] = useState('');
  const [importedJson, setImportedJson] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getUsers = (): User[] => {
    return getStoredData<User[]>('csc_users', []);
  };

  const handleExportBackup = () => {
    const keys = [
      'csc_users', 'csc_csp_transactions', 'csc_csp_customers', 
      'csc_csp_rates', 'csc_wallet_transactions', 'csc_processed_count', 
      'csc_theme', 'csc_sidebar_collapsed', 'csc_profile_name', 
      'csc_profile_retailer_id', 'csc_profile_shop_name', 'csc_profile_phone', 
      'csc_profile_email', 'csc_profile_address', 'csc_profile_photo'
    ];
    
    const backup: { [key: string]: string | null } = {};
    keys.forEach(k => {
      backup[k] = localStorage.getItem(k);
    });

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `smartspe_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    alert('System backup generated and downloaded!');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImportedJson(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImportBackup = () => {
    if (!importedJson) return;
    if (confirm('CRITICAL WARNING: Restoring from file will completely overwrite all local transations, customer sheets, and user profiles database registry variables. Proceed?')) {
      try {
        const parsed = JSON.parse(importedJson);
        for (const [key, value] of Object.entries(parsed)) {
          if (key.startsWith('csc_') && value !== null) {
            localStorage.setItem(key, value as string);
          }
        }
        alert('Database restored successfully! Reloading software suite...');
        window.location.reload();
      } catch (err) {
        alert('Failed to import backup: Invalid JSON syntax template.');
      }
    }
  };

  const handleFactoryReset = () => {
    if (confirm('CRITICAL WARNING: Are you sure you want to FACTORY RESET the systems? All registered staff, profile details, wallet loaded money passbooks, and ledger transactions will be permanently deleted. This cannot be undone.')) {
      onDatabaseWipe();
      alert('System reset complete. Refreshing workspace...');
      window.location.reload();
    }
  };

  const handleEditUserPin = (userId: string, currentPin: string) => {
    const nextPin = prompt(`Enter new security PIN (4-6 digits):`, currentPin);
    if (nextPin === null) return;
    const trimmed = nextPin.trim();

    if (trimmed.length < 4 || trimmed.length > 6 || isNaN(Number(trimmed))) {
      alert('Error PIN: PIN must containing between 4 and 6 numeric digits.');
      return;
    }

    const currentUsers = getUsers();
    const idx = currentUsers.findIndex(u => u.id === userId);
    if (idx !== -1) {
      const targetUser = currentUsers[idx];
      // Defensive Security Barrier
      if (activeUser.role === 'Owner' && targetUser.role !== 'Staff') {
        alert('Access Denied: VLE Center Owners are only authorized to manage PIN identifiers for Staff Operator sessions.');
        return;
      }
      currentUsers[idx].pin = trimmed;
      setStoredData('csc_users', currentUsers);
      alert('PIN saved.');
      window.location.reload();
    }
  };

  // KPIs & filtered user list
  // Super Admin (Admin) has global visibility of all users
  // CSC Center Owner (Owner) has view restricted exclusively to Operator Staff
  const rawUsers = getUsers();
  const listUsers = activeUser.role === 'Admin' 
    ? rawUsers 
    : rawUsers.filter(u => u.role === 'Staff');

  const totalStaff = rawUsers.filter(u => u.role === 'Staff').length;
  const totalCustomersCount = customers.length;
  const netIncomeTotal = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) -
                         transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="flex flex-col gap-5">
      
      <div className="panel-header">
        <h2 className="panel-title">
          <Settings className="w-5 h-5 shrink-0" />
          Systems Administration Console
        </h2>
      </div>

      {/* ADMIN STATS SUMMARY ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
        
        <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-xl text-left flex flex-col gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Users count</span>
          <span className="text-2xl font-black text-blue-500">{listUsers.length} Users</span>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-xl text-left flex flex-col gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Operator Staff</span>
          <span className="text-2xl font-black text-emerald-500">{totalStaff} Accounts</span>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-xl text-left flex flex-col gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Registered Clients</span>
          <span className="text-2xl font-black text-amber-500">{totalCustomersCount} Logs</span>
        </div>

        <div className="bg-cyan-500/5 border border-cyan-500/10 p-5 rounded-xl text-left flex flex-col gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Net Cash Book Flow</span>
          <span className={`text-2xl font-black ${netIncomeTotal >= 0 ? 'text-cyan-500' : 'text-rose-500'}`}>
            ₹{netIncomeTotal.toFixed(2)}
          </span>
        </div>

      </div>

      {/* TABS */}
      <div className="form-tabs text-xs select-none">
        <button 
          className={`form-tab ${activeAdminTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('users')}
        >
          👥 User Database Manager
        </button>
        <button 
          className={`form-tab ${activeAdminTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('services')}
        >
          🛠️ Service Control Hub
        </button>
        <button 
          className={`form-tab ${activeAdminTab === 'backups' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('backups')}
        >
          🔧 Backup / Restore & Factory Wiper
        </button>
      </div>

      {activeAdminTab === 'users' && (
        <div className="config-card overflow-x-auto select-none justify-start">
          <h3 className="font-bold border-b border-gray-100 dark:border-gray-800 pb-2">Global System Users Directory</h3>
          
          <table className="w-full text-xs text-left border-collapse mt-2">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400">
                <th className="py-2.5">User details</th>
                <th className="py-2.5">System Role</th>
                <th className="py-2.5">Gmail Link</th>
                <th className="py-2.5">Mobile contact</th>
                <th className="py-2.5 text-center">PIN password</th>
                <th className="py-2.5 text-center font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listUsers.map(usr => (
                <tr key={usr.id} className="border-b border-gray-50 dark:border-gray-850 hover:bg-gray-100/5">
                  <td className="py-2.5 font-bold text-gray-900 dark:text-white">{usr.name}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${usr.role === 'Owner' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {usr.role}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono text-gray-400">{usr.email || 'None'}</td>
                  <td className="py-2.5 font-mono">{usr.mobile}</td>
                  <td className="py-2.5 text-center font-mono font-black text-blue-500 tracking-wider">
                    {usr.pin}
                  </td>
                  <td className="py-2.5 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button 
                        onClick={() => handleEditUserPin(usr.id, usr.pin)}
                        className="py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[10px] shadow"
                      >
                        Reset PIN
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeAdminTab === 'services' && (
        <div className="flex flex-col gap-4 font-sans select-none">
          
          <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-2xl flex items-start gap-3.5 text-left">
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
              <Sliders className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-gray-800 dark:text-gray-100">
                Super Admin Access: Global CSC Services Operations Manager (सेवा निष्पादन एवं नियंत्रण)
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-1">
                यहाँ से आप सिस्टम में मौजूद सभी सरकारी, बैंकिंग, बीमा तथा रिचार्ज सेवाओं को वैश्विक रूप से <strong>सक्रिय (Active)</strong> या <strong>निष्क्रिय (Deactive / Suspended)</strong> कर सकते हैं। निष्क्रिय की गई सेवाएं ऑपरेटरों (VLE Operators) के बुकिंग डैशबोर्ड में प्रदर्शित नहीं होंगी जिससे कोई भी गलत बुकिंग या असुविधा न हो।
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/60 p-4 border border-gray-150 dark:border-gray-800/85 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                placeholder="खोजें: सेवा का नाम..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-gray-50/50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scroller-hidden">
              {['all', 'Government', 'Banking', 'Insurance', 'Recharge', 'Other'].map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setServiceCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    serviceCategoryFilter === cat 
                      ? 'bg-blue-600 text-white shadow shadow-blue-500/10' 
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'सभी श्रेणियां' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-1">
            {services
              .filter(s => {
                const matchesSearch = s.name.toLowerCase().includes(serviceSearch.toLowerCase());
                const matchesCategory = serviceCategoryFilter === 'all' || s.category === serviceCategoryFilter;
                return matchesSearch && matchesCategory;
              })
              .map(srv => {
                const isInactive = inactiveServiceIds.includes(srv.id);
                return (
                  <div 
                    key={srv.id} 
                    className={`p-5 rounded-2xl bg-white dark:bg-slate-900/40 border transition-all flex flex-col justify-between overflow-hidden relative ${
                      isInactive 
                        ? 'border-red-500/20 bg-red-50/10 opacity-80 grayscale-[15%]' 
                        : 'border-gray-100 dark:border-gray-800 hover:shadow-md'
                    }`}
                  >
                    <div className={`absolute top-0 right-0 h-1 w-16 rounded-bl-lg ${isInactive ? 'bg-red-500' : 'bg-emerald-500'}`}></div>

                    <div className="space-y-3 text-left">
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider ${
                          srv.category === 'Government' ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600' :
                          srv.category === 'Banking' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600' :
                          srv.category === 'Insurance' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' :
                          'bg-gray-50 dark:bg-gray-950/20 text-gray-600'
                        }`}>
                          {srv.category}
                        </span>

                        <span className={`flex items-center gap-1 text-[10px] font-black ${isInactive ? 'text-rose-500' : 'text-emerald-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isInactive ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                          {isInactive ? 'Disabled (निष्क्रिय)' : 'Active (सक्रिय)'}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm text-gray-800 dark:text-white line-clamp-1">{srv.name}</h4>

                      <div className="grid grid-cols-2 gap-2 bg-gray-50/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-gray-100/30 font-mono text-[11px] text-gray-400">
                        <div>
                          <span className="block text-[9px] text-gray-400 font-sans uppercase font-bold">Government charge</span>
                          <span className="font-black text-gray-700 dark:text-gray-300">₹{srv.govtFee}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-gray-400 font-sans uppercase font-bold">Customer Fee</span>
                          <span className="font-black text-gray-700 dark:text-gray-300">₹{srv.custFee}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-50 dark:border-gray-800/80 mt-4 pt-3 gap-2">
                      <div className="flex flex-col text-left">
                        <span className="text-[9px] text-gray-400 uppercase font-black font-sans">Commission Yield</span>
                        <span className="text-xs font-black text-emerald-500">₹{srv.commission || (srv.custFee - srv.govtFee).toFixed(2)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleService(srv.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide transition-all shadow-sm cursor-pointer border ${
                          isInactive 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-500/10 border-transparent' 
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-100 hover:border-transparent'
                        }`}
                      >
                        {isInactive ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Activate (चालू करें)</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Suspend (बंद करें)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {services.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(serviceSearch.toLowerCase());
            const matchesCategory = serviceCategoryFilter === 'all' || s.category === serviceCategoryFilter;
            return matchesSearch && matchesCategory;
          }).length === 0 && (
            <div className="text-center p-12 bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-400 font-sans max-w-md mx-auto mt-6">
              <ShieldAlert className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold">कोई भी सेवा नहीं मिली!</p>
              <p className="text-[10px] text-gray-400 mt-1">कृपया अपने सर्च कीवर्ड बदल कर देखें अथवा अन्य श्रेणी का चयन करें।</p>
            </div>
          )}

        </div>
      )}

      {activeAdminTab === 'backups' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* BACKUP EXPORT */}
            <div className="config-card">
              <h3 className="font-bold border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-500" /> Export System Backup (.json)
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Generate an encrypted local backup file containing all user registers, credit cards configurations, portal rates, cashbook transactions, wallet accounts, and profile photos. Keeping this file safe will allow you to quickly restore your entire workstation onto other cloud run containers easily.
              </p>
              
              <button 
                onClick={handleExportBackup}
                className="btn-primary mt-2 py-3 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Backup File
              </button>
            </div>

            {/* NEW CONTAINER SOURCE CODE ZIP EXPORT */}
            <div className="config-card">
              <h3 className="font-bold border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" /> Source Code Zip Backup (.zip)
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Download the complete active source code workspace (Express server, authentication controllers, database schemas, and Vite frontend assets) packed securely in a clean ZIP directory format for local hosting or backups.
              </p>
              
              <a 
                href="/api/download-zip" 
                download="smartspe_source_code.zip"
                className="btn-primary mt-auto py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 text-xs rounded-xl shadow-lg shadow-indigo-600/10 border-transparent cursor-pointer transition-all text-center block"
              >
                <Download className="w-4 h-4 inline-block" /> Download Source Code (.zip)
              </a>
            </div>

            {/* RESTORE IMPORT */}
            <div className="config-card">
              <h3 className="font-bold border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-500" /> Import / Restore Backup File
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Select a previously compiled `.json` backup file from desktop memory and click the confirm button to immediately load. Note: This will wipe and replace all dynamic parameters currently active!
              </p>

              <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden" 
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary w-full py-3 text-xs flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Select Backup file
              </button>
              {importedFileName && <span className="text-center font-mono font-bold text-xs text-emerald-500">{importedFileName}</span>}

              <button 
                onClick={handleImportBackup} 
                disabled={!importedJson}
                className="btn-primary w-full py-3 text-xs bg-gradient-to-r from-emerald-600 to-teal-500 border-none shadow-md mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirm & Process Restore
              </button>
            </div>

          </div>

          {/* RESET SYSTEM */}
          <div className="config-card border border-red-500/10 bg-red-500/5 p-6 rounded-2xl flex flex-col gap-3">
            <h3 className="font-bold text-rose-500 flex items-center gap-2 border-b border-red-500/15 pb-2">
              <AlertTriangle className="w-5 h-5 shrink-0" /> Extreme Danger Zone: Factory Reset Wiper
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Conducting a factory reset will completely and irrevocably purge all local ledger bookings, wallet transfer registries, custom rate tables, and user sessions. SmartSpe will immediately return to original blank states. There is no reclamation fallback.
            </p>
            
            <button 
              onClick={handleFactoryReset}
              className="btn-primary max-w-xs py-3 bg-rose-600 hover:bg-rose-700 text-white mt-1 uppercase font-bold text-xs shadow-lg shadow-rose-600/20"
            >
              Exterminate Database & Reset
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
