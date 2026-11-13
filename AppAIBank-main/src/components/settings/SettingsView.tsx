import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Sliders,
  Shield,
  Download,
  Building,
  CheckCircle2,
  AlertCircle,
  FileCode,
  BookOpen,
} from 'lucide-react';
import { api } from '../../services/api';
import { SystemSettings } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const SettingsView: React.FC = () => {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<SystemSettings>({
    thresholdHigh: 80,
    thresholdMedium: 60,
    thresholdLow: 40,
    sessionTimeoutMinutes: 30,
    bankName: 'Digital AI Commercial Bank',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSettings();
      setSettings(res.settings);
    } catch (err: any) {
      setError(err.message || 'Không thể tải cấu hình hệ thống.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await api.updateSettings(settings);
      setSettings(res.settings);
      setMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu cấu hình.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <span>Cài đặt Hệ thống & Ngưỡng Diễn giải Nghiệp vụ</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tùy chỉnh các tham số phân tầng xác suất hỗ trợ tiếp thị và thông số vận hành ngân hàng số.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Probability Interpretation Thresholds */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Cấu hình Ngưỡng Xác suất Diễn giải (Section 6.5)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Các ngưỡng phục vụ đánh giá mức độ tin cậy và phân bổ độ ưu tiên tiếp cận khách hàng.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* High Threshold */}
            <div>
              <div className="flex items-center justify-between font-medium text-slate-700 mb-1.5">
                <span>Ngưỡng dự đoán YES Rất cao:</span>
                <span className="font-mono font-bold text-emerald-700">{settings.thresholdHigh}% trở lên</span>
              </div>
              <input
                type="range"
                min="70"
                max="95"
                step="1"
                disabled={!isAdmin}
                value={settings.thresholdHigh}
                onChange={(e) => setSettings({ ...settings, thresholdHigh: parseInt(e.target.value, 10) })}
                className="w-full accent-emerald-600"
              />
              <span className="text-[10px] text-slate-400">
                Khách hàng vượt ngưỡng này sẽ được ưu tiên tiếp cận hàng đầu bằng tư vấn viên VIP.
              </span>
            </div>

            {/* Medium Threshold */}
            <div>
              <div className="flex items-center justify-between font-medium text-slate-700 mb-1.5">
                <span>Ngưỡng dự đoán YES Tương đối cao:</span>
                <span className="font-mono font-bold text-blue-700">Từ {settings.thresholdMedium}% đến {settings.thresholdHigh}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="75"
                step="1"
                disabled={!isAdmin}
                value={settings.thresholdMedium}
                onChange={(e) => setSettings({ ...settings, thresholdMedium: parseInt(e.target.value, 10) })}
                className="w-full accent-blue-600"
              />
              <span className="text-[10px] text-slate-400">
                Nhóm khách hàng có triển vọng tốt, tiếp thị đa kênh (SMS, App, Email).
              </span>
            </div>

            {/* Low Threshold */}
            <div>
              <div className="flex items-center justify-between font-medium text-slate-700 mb-1.5">
                <span>Ngưỡng dự đoán Chưa rõ ràng:</span>
                <span className="font-mono font-bold text-amber-700">Từ {settings.thresholdLow}% đến {settings.thresholdMedium}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="55"
                step="1"
                disabled={!isAdmin}
                value={settings.thresholdLow}
                onChange={(e) => setSettings({ ...settings, thresholdLow: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500"
              />
              <span className="text-[10px] text-slate-400">
                Dưới {settings.thresholdLow}% được xếp vào nhóm "Thấp" (Tạm hoãn tiếp cận).
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: General System Settings */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Thông số Đơn vị & Bảo mật Phiên</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Tên Tổ chức / Ngân hàng</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.bankName}
                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Thời gian Timeout Phiên (phút)</label>
              <input
                type="number"
                min="5"
                max="120"
                disabled={!isAdmin}
                value={settings.sessionTimeoutMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value, 10) || 30 })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
              />
              <span className="text-[10px] text-slate-400">Tự động kết thúc phiên khi không hoạt động</span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu cấu hình hệ thống'}</span>
            </button>
          </div>
        )}
      </form>

      {/* Model Artifacts Download & Documentation */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-slate-700" />
          <span>Tài nguyên Mô hình & Hướng dẫn Kỹ thuật</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Mô hình Decision Tree Classifier cùng các tệp kịch bản Scikit-Learn Python và Preprocessing Pipeline được lưu trữ sẵn trong thư mục dự án:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-mono font-bold text-slate-900">data/decision_tree_bank_model.json</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Tệp lưu toàn bộ cấu trúc nút cây và metadata.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-mono font-bold text-slate-900">python_ml/train_decision_tree.py</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Kịch bản huấn luyện Scikit-learn chuẩn Joblib.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
