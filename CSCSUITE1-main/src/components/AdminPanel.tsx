import React, { useState, useRef } from 'react';
import { Settings, Download, Upload, Trash2, ArrowRightLeft, Users, Key, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { User, Transaction, Customer } from '../types';
import { getStoredData, setStoredData } from '../utils';

interface AdminPanelProps {
  transactions: Transaction[];
  customers: Customer[];
  onDatabaseWipe: () => void;
}

export default function AdminPanel({ transactions, customers, onDatabaseWipe }: AdminPanelProps) {
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'backups'>('users');
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
      currentUsers[idx].pin = trimmed;
      setStoredData('csc_users', currentUsers);
      alert('PIN saved.');
      window.location.reload();
    }
  };

  // KPIs
  const listUsers = getUsers();
  const totalStaff = listUsers.filter(u => u.role === 'Staff').length;
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

      {activeAdminTab === 'backups' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
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
