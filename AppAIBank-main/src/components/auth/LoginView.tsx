import React, { useState } from 'react';
import {
  Building2,
  Lock,
  User as UserIcon,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col justify-center items-center px-4 py-8">
      {/* Background Graphic Elements */}
      <div className="w-full max-w-md">
        {/* Brand Card Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#102A43] text-white shadow-lg mb-3">
            <Building2 className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            AI BANK MARKETING
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Customer Classification System · Decision Tree Algorithm
          </p>
        </div>

        {/* Main Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Đăng nhập hệ thống</h2>
              <p className="text-xs text-slate-500 mt-0.5">Cổng phân loại khách hàng ngân hàng số</p>
            </div>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Bảo mật 256-bit
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tên đăng nhập hoặc Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập username (ví dụ: admin)"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Mật khẩu</label>
                <button
                  type="button"
                  onClick={() => alert('Vui lòng liên hệ Quản trị viên để đặt lại mật khẩu.')}
                  className="text-[11px] text-blue-600 hover:underline font-medium"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Ghi nhớ phiên đăng nhập</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <span>Đang xác thực...</span>
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Tài khoản thử nghiệm nhanh (1-Click):</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'Admin@Bank2026')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-colors"
              >
                <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  Admin
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">admin</div>
                <div className="text-[10px] text-slate-400">Toàn quyền hệ thống</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('staff01', 'Staff@Bank2026')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-colors"
              >
                <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                  <UserIcon className="w-3 h-3 text-blue-600" />
                  Staff
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">staff01</div>
                <div className="text-[10px] text-slate-400">Tiếp thị & Dự đoán</div>
              </button>
            </div>
          </div>
        </div>

        {/* System Footer Note */}
        <div className="mt-4 text-center text-[11px] text-slate-400">
          Hệ thống bảo mật dữ liệu ngân hàng số · Tiêu chuẩn bảo mật ISO 27001
        </div>
      </div>
    </div>
  );
};
