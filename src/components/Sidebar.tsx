import React, { useState } from 'react';
import { 
  LayoutDashboard, User, Crop, FileText, Calendar, 
  Wallet, BarChart3, Briefcase, Users, Settings, 
  Phone, Mail, Sun, Moon, LogOut, ChevronLeft, ChevronRight, Menu 
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: 'Owner' | 'Staff';
  userName: string;
  onLogout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Sidebar({ 
  currentTab, setCurrentTab, userRole, userName, onLogout, darkMode, toggleDarkMode 
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isRestrictedForStaff = (tab: string) => {
    const restricted = ['profile', 'csp', 'reports', 'services', 'staff', 'admin'];
    return userRole === 'Staff' && restricted.includes(tab);
  };

  const handleTabClick = (tab: string) => {
    if (isRestrictedForStaff(tab)) {
      alert("Access Denied: This panel requires 'Owner / Admin' role permissions.");
      return;
    }
    setCurrentTab(tab);
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} id="sidebar">
      
      {/* Sidebar Header & Collapser */}
      <div className="logo-container border-b border-gray-100 dark:border-gray-800/60 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg shrink-0">
            S
          </div>
          {!isCollapsed && (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="logo-text font-black text-lg tracking-tight select-none">SmartSpe</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase truncate block">
                {userRole === 'Owner' ? 'Admin' : 'Staff'}: {userName}
              </span>
            </div>
          )}
        </div>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="sidebar-collapse-btn shrink-0"
          title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Link List */}
      <nav className="nav-links my-4">
        
        {/* CATEGORY 1 */}
        {!isCollapsed && <div className="nav-category-header">Core Dashboard</div>}
        
        <a 
          className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabClick('dashboard')}
          title="Dashboard"
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          <span>Dashboard</span>
        </a>

        {!isRestrictedForStaff('profile') && (
          <a 
            className={`nav-item ${currentTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabClick('profile')}
            title="My Profile"
          >
            <User className="w-5 h-5 shrink-0" />
            <span>My Profile</span>
          </a>
        )}

        {/* CATEGORY 2 */}
        {!isCollapsed && <div className="nav-category-header">Document Tools</div>}
        
        <a 
          className={`nav-item ${currentTab === 'aadhaar' ? 'active' : ''}`}
          onClick={() => handleTabClick('aadhaar')}
          title="Aadhaar ID Printer"
        >
          <Crop className="w-5 h-5 shrink-0" />
          <span>ID Card Crop Layer</span>
        </a>

        <a 
          className={`nav-item ${currentTab === 'biodata' ? 'active' : ''}`}
          onClick={() => handleTabClick('biodata')}
          title="Resume / Marriage Biodata"
        >
          <FileText className="w-5 h-5 shrink-0" />
          <span>Resume & Biodata</span>
        </a>

        {/* CATEGORY 3 */}
        {!isRestrictedForStaff('csp') && !isCollapsed && <div className="nav-category-header">Office & Finance</div>}
        
        {!isRestrictedForStaff('csp') && (
          <a 
            className={`nav-item ${currentTab === 'csp' ? 'active' : ''}`}
            onClick={() => handleTabClick('csp')}
            title="CSP Ledger & Bookkeeping"
          >
            <Wallet className="w-5 h-5 shrink-0" />
            <span>CSP Ledger & Dues</span>
          </a>
        )}

        {!isRestrictedForStaff('reports') && (
          <a 
            className={`nav-item ${currentTab === 'reports' ? 'active' : ''}`}
            onClick={() => handleTabClick('reports')}
            title="Reports & Financial Statements"
          >
            <BarChart3 className="w-5 h-5 shrink-0" />
            <span>Reports & Sheets</span>
          </a>
        )}

        {/* CATEGORY 4 */}
        {!isCollapsed && <div className="nav-category-header">System Tools</div>}
        
        {!isRestrictedForStaff('services') && (
          <a 
            className={`nav-item ${currentTab === 'services' ? 'active' : ''}`}
            onClick={() => handleTabClick('services')}
            title="Services Rates Config"
          >
            <Briefcase className="w-5 h-5 shrink-0" />
            <span>Rates Configuration</span>
          </a>
        )}

        {!isRestrictedForStaff('staff') && (
          <a 
            className={`nav-item ${currentTab === 'staff' ? 'active' : ''}`}
            onClick={() => handleTabClick('staff')}
            title="Staff Directory"
          >
            <Users className="w-5 h-5 shrink-0" />
            <span>Staff Directory</span>
          </a>
        )}

        {!isRestrictedForStaff('admin') && (
          <a 
            className={`nav-item ${currentTab === 'admin' ? 'active' : ''}`}
            onClick={() => handleTabClick('admin')}
            title="Admin System Settings"
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span>System Console</span>
          </a>
        )}

        <a 
          className={`nav-item ${currentTab === 'age' ? 'active' : ''}`}
          onClick={() => handleTabClick('age')}
          title="Detailed Age Engine"
        >
          <Calendar className="w-5 h-5 shrink-0" />
          <span>Age Calculator</span>
        </a>

        {/* CATEGORY 5 */}
        {!isCollapsed && <div className="nav-category-header">Direct Contact</div>}
        <a href="tel:8432163308" className="nav-item focus:outline-none" title="Call Technical Support">
          <Phone className="w-5 h-5 shrink-0 text-emerald-500" />
          <span>+91 84321 63308</span>
        </a>
        <a href="mailto:help@smartspe.in" className="nav-item focus:outline-none" title="Email Inquiries">
          <Mail className="w-5 h-5 shrink-0 text-cyan-500" />
          <span>help@smartspe.in</span>
        </a>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <button 
          onClick={toggleDarkMode} 
          className="theme-toggle-btn text-xs"
          title="Toggle Light/Dark Workspace"
        >
          {darkMode ? <Sun className="w-4 h-4 shrink-0 text-amber-500" /> : <Moon className="w-4 h-4 shrink-0 text-blue-500" />}
          <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
        </button>

        <button 
          onClick={onLogout}
          className="theme-toggle-btn bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-600 border border-transparent hover:border-rose-500/30 text-xs font-semibold py-2"
          title="Logout / Swap Users"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Switch User</span>
        </button>
      </div>

    </aside>
  );
}
