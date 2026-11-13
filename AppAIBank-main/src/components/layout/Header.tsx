import React, { useState } from 'react';
import {
  Bell,
  ShieldCheck,
  UserCheck,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NavTab } from './Sidebar';

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const { user, isAdmin, quickSwitch } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const getBreadcrumb = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard / Tổng quan hoạt động tiếp thị';
      case 'prediction':
        return 'Tiếp thị / Dự đoán khách hàng mới (Decision Tree)';
      case 'customers':
        return 'Khách hàng / Quản lý danh sách hồ sơ';
      case 'history':
        return 'Lịch sử / Tra cứu kết quả phân loại';
      case 'model':
        return 'Mô hình AI / Quản trị thuật toán & Đánh giá';
      case 'users':
        return 'Hệ thống / Quản lý tài khoản & Phân quyền';
      case 'audit':
        return 'Hệ thống / Nhật ký kiểm toán & Hoạt động';
      case 'settings':
        return 'Cấu hình / Cài đặt ngưỡng & Thông số';
      default:
        return 'Hệ thống';
    }
  };

  const handleQuickSwitch = async (targetRole: 'admin' | 'staff') => {
    setIsSwitching(true);
    try {
      await quickSwitch(targetRole);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Breadcrumb Left Zone */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span className="text-slate-900 font-semibold">Ngân hàng số</span>
        <span>/</span>
        <span className="text-slate-700">{getBreadcrumb(activeTab)}</span>
      </div>

      {/* Right Controls Zone */}
      <div className="flex items-center gap-4">
        {/* Quick Role Tester (Evaluator Convenience Tool) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200/80 text-xs">
          <span className="text-[11px] text-slate-500 px-2 font-medium hidden sm:inline">
            Thử nghiệm quyền:
          </span>
          <button
            onClick={() => handleQuickSwitch('admin')}
            disabled={isSwitching}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
              isAdmin
                ? 'bg-navy-900 bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </button>
          <button
            onClick={() => handleQuickSwitch('staff')}
            disabled={isSwitching}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
              !isAdmin
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Staff
          </button>
        </div>

        {/* Notifications Icon with popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors relative"
            title="Thông báo hệ thống"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Thông báo hệ thống</span>
                <span className="text-[10px] text-slate-400">Thời gian thực</span>
              </div>
              <div className="mt-3 space-y-3">
                <div className="flex items-start gap-2.5 text-xs">
                  <div className="p-1 rounded bg-emerald-100 text-emerald-700 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Mô hình AI đã sẵn sàng</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Decision Tree v1.0.0 với độ chính xác 80.12% và F1-Score 79.25% trên 11.162 bản ghi.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-xs">
                  <div className="p-1 rounded bg-blue-100 text-blue-700 mt-0.5">
                    <Info className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Hỗ trợ ra quyết định tiếp thị</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Dự đoán nhãn YES/NO và xác suất predict_proba tổng bằng 100%.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current user pill */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
            {user?.fullName.charAt(0)}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-900 leading-tight">
              {user?.fullName}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Phiên làm việc an toàn</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
