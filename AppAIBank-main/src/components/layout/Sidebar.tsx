import React from 'react';
import {
  LayoutDashboard,
  BrainCircuit,
  Users,
  History,
  GitBranch,
  UserCheck,
  ShieldAlert,
  Settings,
  LogOut,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavTab =
  | 'dashboard'
  | 'prediction'
  | 'customers'
  | 'history'
  | 'model'
  | 'users'
  | 'audit'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, isAdmin, logout } = useAuth();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'prediction' as NavTab, label: 'Dự đoán khách hàng', icon: BrainCircuit },
    { id: 'customers' as NavTab, label: 'Danh sách khách hàng', icon: Users },
    { id: 'history' as NavTab, label: 'Lịch sử dự đoán', icon: History },
    { id: 'model' as NavTab, label: 'Mô hình AI', icon: GitBranch },
    ...(isAdmin
      ? [
          { id: 'users' as NavTab, label: 'Quản lý người dùng', icon: UserCheck },
          { id: 'audit' as NavTab, label: 'Nhật ký hoạt động', icon: ShieldAlert },
        ]
      : []),
    { id: 'settings' as NavTab, label: 'Cài đặt hệ thống', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#102A43] text-slate-200 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand & Bank Title */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/40">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
              AI BANK MARKETING
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Decision Tree System</p>
          </div>
        </div>
      </div>

      {/* User Mini Profile Card */}
      <div className="px-4 py-3 mx-3 my-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <div className="text-xs font-semibold text-white truncate">{user?.fullName}</div>
            <div className="text-[11px] text-slate-400 truncate font-mono">@{user?.username}</div>
          </div>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
              isAdmin
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
            }`}
          >
            {user?.role}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
        <div className="mt-2 text-center text-[10px] text-slate-500">
          Phiên bản AI Model: Decision Tree v1.0
        </div>
      </div>
    </aside>
  );
};
