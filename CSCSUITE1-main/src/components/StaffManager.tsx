import React, { useState } from 'react';
import { Users, UserPlus, Trash2, Key, Info } from 'lucide-react';
import { User } from '../types';
import { getStoredData, setStoredData } from '../utils';

interface StaffManagerProps {
  onStaffUpdated: () => void;
}

export default function StaffManager({ onStaffUpdated }: StaffManagerProps) {
  const [fullname, setFullname] = useState('');
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<'Staff' | 'Owner'>('Staff');

  const getStaffUsers = (): User[] => {
    return getStoredData<User[]>('csc_users', []);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullname || !mobile || !pin) {
      alert('All credentials: Name, Mobile, and PIN are required.');
      return;
    }

    if (pin.length < 4 || isNaN(Number(pin))) {
      alert('Security PIN must be a 4-digit number.');
      return;
    }

    const currentUsers = getStaffUsers();
    
    // Check if the pin or email is already registered
    const existing = currentUsers.find(u => u.pin === pin && u.role === role);
    if (existing) {
      alert('This security PIN code is already claimed by another user of this role. Choose a different dynamic password.');
      return;
    }

    const newStaff: User = {
      id: "user_" + Date.now(),
      name: fullname,
      role: role,
      pin: pin,
      mobile: mobile,
      email: `${fullname.toLowerCase().replace(/\s+/g, '')}@csc.com`,
      status: 'active',
      registeredAt: new Date().toISOString()
    };

    currentUsers.push(newStaff);
    setStoredData('csc_users', currentUsers);
    
    setFullname('');
    setMobile('');
    setPin('');
    onStaffUpdated();
    alert(`Account created successfully for ${fullname}!`);
  };

  const handleDeleteStaff = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete staff account: "${name}"?`)) {
      let currentUsers = getStaffUsers();
      currentUsers = currentUsers.filter(u => u.id !== id);
      setStoredData('csc_users', currentUsers);
      onStaffUpdated();
      alert('Staff accounts registry updated.');
    }
  };

  const staffList = getStaffUsers();

  return (
    <div className="flex flex-col gap-5">
      
      <div className="panel-header">
        <h2 className="panel-title">
          <Users className="w-5 h-5 shrink-0" />
          Staff Directory & Access Control
        </h2>
      </div>

      <div className="tool-layout">
        
        {/* ADD STAFF FORM COLUMN */}
        <div className="config-card">
          <h3 className="font-bold text-gray-950 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
            Create Access Account
          </h3>
          <p className="text-xs text-gray-400">Onboard cyber partner operators and define access roles.</p>

          <form onSubmit={handleCreateStaff} className="flex flex-col gap-4 mt-2">
            <div className="form-group">
              <label>Full Operator Name</label>
              <input type="text" placeholder="e.g. Ramesh Kumar" value={fullname} onChange={(e) => setFullname(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Contact Mobile No</label>
              <input type="text" placeholder="9876543210" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label>Security 4-digit PIN</label>
                <input type="password" maxLength={4} placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>System Role permissions</label>
                <select value={role} onChange={(e) => setRole(e.target.value as any)}>
                  <option value="Staff">Staff (Restricted menu checks)</option>
                  <option value="Owner">Owner / Admin (Heuristic view)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary mt-2 flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" /> Create staff login
            </button>
          </form>
        </div>

        {/* STAFF LIST COLUMN */}
        <div className="config-card overflow-x-auto justify-start select-none">
          <h3 className="font-bold border-b border-gray-100 dark:border-gray-800 pb-2">
            Cyber center operators roster
          </h3>

          <table className="w-full text-left text-xs border-collapse mt-2">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400">
                <th className="py-2.5">Staff Details</th>
                <th className="py-2.5">Access Role Badge</th>
                <th className="py-2.5">Mobile Contact</th>
                <th className="py-2.5 text-center">Identity PIN code</th>
                <th className="py-2.5 text-center">Manage</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map(st => (
                <tr key={st.id} className="border-b border-gray-50 dark:border-gray-850 hover:bg-gray-100/5">
                  <td className="py-2.5">
                    <div className="font-extrabold text-gray-900 dark:text-slate-100">{st.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{st.email}</div>
                  </td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${st.role === 'Owner' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {st.role}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono">{st.mobile}</td>
                  <td className="py-2.5 text-center font-bold tracking-widest text-[#06B6D4] font-mono">{st.pin}</td>
                  <td className="py-2.5 text-center">
                    {(st.id === 'user_owner' || st.id === 'user_staff') ? (
                      <span className="text-gray-400 text-[10px] uppercase font-bold">Protected</span>
                    ) : (
                      <button onClick={() => handleDeleteStaff(st.id, st.name)} className="text-rose-500 hover:text-rose-600 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
