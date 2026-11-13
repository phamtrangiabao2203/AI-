import React, { useState } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  XCircle,
  Sparkles,
  RotateCcw,
  User,
  DollarSign,
  PhoneCall,
  GitCommit,
  ShieldAlert,
  Printer,
  Save,
  Check,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { CustomerInput, BusinessInterpretation } from '../../types';

interface PredictionViewProps {
  initialData?: CustomerInput | null;
  onSavedToHistory?: () => void;
}

export const PRESET_PROFILES: { label: string; desc: string; data: CustomerInput }[] = [
  {
    label: 'Hồ sơ 1: Khách hàng tiềm năng',
    desc: '35 tuổi, Quản lý, Số dư $2500, Cuộc gọi 450s, Không vay nợ',
    data: {
      age: 35,
      job: 'management',
      marital: 'married',
      education: 'tertiary',
      default: 'no',
      balance: 2500,
      housing: 'no',
      loan: 'no',
      contact: 'cellular',
      day: 15,
      month: 'aug',
      duration: 450,
      campaign: 1,
      pdays: -1,
      previous: 0,
      poutcome: 'unknown',
    },
  },
  {
    label: 'Hồ sơ 2: Cần đánh giá thêm',
    desc: '45 tuổi, Kỹ thuật, Số dư $500, Có vay nhà, Cuộc gọi 180s',
    data: {
      age: 45,
      job: 'technician',
      marital: 'married',
      education: 'secondary',
      default: 'no',
      balance: 500,
      housing: 'yes',
      loan: 'no',
      contact: 'cellular',
      day: 20,
      month: 'jun',
      duration: 180,
      campaign: 3,
      pdays: -1,
      previous: 0,
      poutcome: 'unknown',
    },
  },
  {
    label: 'Hồ sơ 3: Tiếp thị trước thành công',
    desc: '58 tuổi, Hưu trí, Số dư $4200, Cuộc gọi 600s, Poutcome success',
    data: {
      age: 58,
      job: 'retired',
      marital: 'divorced',
      education: 'secondary',
      default: 'no',
      balance: 4200,
      housing: 'no',
      loan: 'no',
      contact: 'telephone',
      day: 10,
      month: 'mar',
      duration: 600,
      campaign: 1,
      pdays: 120,
      previous: 2,
      poutcome: 'success',
    },
  },
];

const DEFAULT_FORM: CustomerInput = {
  age: 35,
  job: 'management',
  marital: 'married',
  education: 'tertiary',
  default: 'no',
  balance: 2500,
  housing: 'no',
  loan: 'no',
  contact: 'cellular',
  day: 15,
  month: 'aug',
  duration: 450,
  campaign: 1,
  pdays: -1,
  previous: 0,
  poutcome: 'unknown',
};

export const PredictionView: React.FC<PredictionViewProps> = ({
  initialData,
  onSavedToHistory,
}) => {
  const [formData, setFormData] = useState<CustomerInput>(initialData || DEFAULT_FORM);
  const [activePreset, setActivePreset] = useState<number | null>(0);
  const [isPredicting, setIsPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Prediction Result
  const [result, setResult] = useState<{
    prediction: 'yes' | 'no';
    probabilityYes: number;
    probabilityNo: number;
    leafNodeId: number;
    decisionPath: string[];
    modelVersion: string;
    timestamp: string;
    customerId: string;
  } | null>(null);

  const [interpretation, setInterpretation] = useState<BusinessInterpretation | null>(null);

  const handleChange = (field: keyof CustomerInput, value: any) => {
    setActivePreset(null);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyPreset = (index: number) => {
    setActivePreset(index);
    setFormData({ ...PRESET_PROFILES[index].data });
    setError(null);
  };

  const resetForm = () => {
    setActivePreset(null);
    setFormData({
      age: 30,
      job: 'technician',
      marital: 'single',
      education: 'secondary',
      default: 'no',
      balance: 1000,
      housing: 'no',
      loan: 'no',
      contact: 'cellular',
      day: 1,
      month: 'may',
      duration: 200,
      campaign: 1,
      pdays: -1,
      previous: 0,
      poutcome: 'unknown',
    });
    setResult(null);
    setInterpretation(null);
    setError(null);
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const res = await api.predict(formData);
      setResult(res.result);
      setInterpretation(res.interpretation);
      setSavedSuccess(true);
      if (onSavedToHistory) onSavedToHistory();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi thực hiện phân loại khách hàng.');
    } finally {
      setIsPredicting(false);
    }
  };

  const printConsultationReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-blue-600" />
            <span>Phân loại & Dự đoán Khả năng Đăng ký Tiền gửi có Kỳ hạn</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ứng dụng thuật toán Decision Tree đã huấn luyện trên tập dữ liệu 11.162 bản ghi Bank Marketing.
          </p>
        </div>

        {/* 3 Preset Profile Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_PROFILES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left border ${
                activePreset === idx
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title={preset.desc}
            >
              Mẫu {idx + 1}
            </button>
          ))}
          <button
            type="button"
            onClick={resetForm}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            title="Xóa biểu mẫu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Left Form (60%) & Right Result (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Input Form: 7 cols */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <form onSubmit={handlePredict}>
            {/* Nhóm 1: Thông tin cá nhân */}
            <div className="pb-5 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded bg-blue-50 text-blue-600">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Nhóm 1 – Thông tin cá nhân
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Age */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Độ tuổi (Age) *
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="110"
                    value={formData.age}
                    onChange={(e) => handleChange('age', parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Từ 18 đến 110</span>
                </div>

                {/* Job */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nghề nghiệp (Job) *
                  </label>
                  <select
                    value={formData.job}
                    onChange={(e) => handleChange('job', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize"
                    required
                  >
                    <option value="management">Management (Quản lý)</option>
                    <option value="technician">Technician (Kỹ thuật)</option>
                    <option value="blue-collar">Blue-collar (Công nhân)</option>
                    <option value="admin.">Admin (Hành chính)</option>
                    <option value="services">Services (Dịch vụ)</option>
                    <option value="retired">Retired (Hưu trí)</option>
                    <option value="self-employed">Self-employed (Tự doanh)</option>
                    <option value="entrepreneur">Entrepreneur (Doanh nhân)</option>
                    <option value="unemployed">Unemployed (Thất nghiệp)</option>
                    <option value="housemaid">Housemaid (Nội trợ)</option>
                    <option value="student">Student (Sinh viên)</option>
                    <option value="unknown">Unknown (Chưa rõ)</option>
                  </select>
                </div>

                {/* Marital */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tình trạng hôn nhân (Marital) *
                  </label>
                  <select
                    value={formData.marital}
                    onChange={(e) => handleChange('marital', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize"
                    required
                  >
                    <option value="married">Married (Đã kết hôn)</option>
                    <option value="single">Single (Độc thân)</option>
                    <option value="divorced">Divorced (Ly hôn / Góa)</option>
                  </select>
                </div>

                {/* Education */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Trình độ học vấn (Education) *
                  </label>
                  <select
                    value={formData.education}
                    onChange={(e) => handleChange('education', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize"
                    required
                  >
                    <option value="tertiary">Tertiary (Đại học / Sau ĐH)</option>
                    <option value="secondary">Secondary (Trung học phổ thông)</option>
                    <option value="primary">Primary (Tiểu học)</option>
                    <option value="unknown">Unknown (Chưa xác định)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Nhóm 2: Thông tin tài chính */}
            <div className="py-5 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Nhóm 2 – Thông tin tài chính
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Default */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Lịch sử nợ quá hạn (Default) *
                  </label>
                  <select
                    value={formData.default}
                    onChange={(e) => handleChange('default', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="no">No (Không có nợ quá hạn)</option>
                    <option value="yes">Yes (Có nợ quá hạn)</option>
                  </select>
                </div>

                {/* Balance */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Số dư tài khoản bình quân (Balance $) *
                  </label>
                  <input
                    type="number"
                    value={formData.balance}
                    onChange={(e) => handleChange('balance', parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Số dư bình quân (USD/EUR)</span>
                </div>

                {/* Housing Loan */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Khoản vay mua nhà (Housing Loan) *
                  </label>
                  <select
                    value={formData.housing}
                    onChange={(e) => handleChange('housing', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="no">No (Không vay mua nhà)</option>
                    <option value="yes">Yes (Đang vay mua nhà)</option>
                  </select>
                </div>

                {/* Personal Loan */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Khoản vay cá nhân (Personal Loan) *
                  </label>
                  <select
                    value={formData.loan}
                    onChange={(e) => handleChange('loan', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="no">No (Không có khoản vay cá nhân)</option>
                    <option value="yes">Yes (Đang có khoản vay cá nhân)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Nhóm 3: Thông tin tiếp thị */}
            <div className="pt-5 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded bg-amber-50 text-amber-600">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Nhóm 3 – Thông tin chiến dịch tiếp thị
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Contact */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Hình thức liên hệ (Contact) *
                  </label>
                  <select
                    value={formData.contact}
                    onChange={(e) => handleChange('contact', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize"
                    required
                  >
                    <option value="cellular">Cellular (Điện thoại di động)</option>
                    <option value="telephone">Telephone (Điện thoại bàn cố định)</option>
                    <option value="unknown">Unknown (Chưa rõ)</option>
                  </select>
                </div>

                {/* Day */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Ngày liên hệ (Day) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.day}
                    onChange={(e) => handleChange('day', parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums"
                    required
                  />
                  <span className="text-[10px] text-slate-400">1 đến 31</span>
                </div>

                {/* Month */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tháng (Month) *
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) => handleChange('month', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                    required
                  >
                    {['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].map(
                      (m) => (
                        <option key={m} value={m}>
                          {m.toUpperCase()}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Duration */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Thời lượng cuộc gọi (Duration - giây) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.duration}
                    onChange={(e) => handleChange('duration', parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums"
                    required
                  />
                  <span className="text-[10px] text-blue-600 font-medium">
                    {Math.floor(formData.duration / 60)} phút {formData.duration % 60} giây (Đặc trưng quan trọng nhất)
                  </span>
                </div>

                {/* Campaign */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Số lần liên hệ (Campaign) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.campaign}
                    onChange={(e) => handleChange('campaign', parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums"
                    required
                  />
                  <span className="text-[10px] text-slate-400">≥ 1 cuộc</span>
                </div>

                {/* Poutcome */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Kết quả trước (Poutcome) *
                  </label>
                  <select
                    value={formData.poutcome}
                    onChange={(e) => handleChange('poutcome', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize"
                    required
                  >
                    <option value="unknown">Unknown (Chưa có)</option>
                    <option value="success">Success (Thành công)</option>
                    <option value="failure">Failure (Thất bại)</option>
                    <option value="other">Other (Khác)</option>
                  </select>
                </div>

                {/* Pdays */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Số ngày từ lần liên hệ trước (Pdays) *
                  </label>
                  <input
                    type="number"
                    min="-1"
                    value={formData.pdays}
                    onChange={(e) => handleChange('pdays', parseInt(e.target.value, 10) ?? -1)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums"
                    required
                  />
                  <span className="text-[10px] text-slate-400">-1 nếu chưa từng liên hệ</span>
                </div>

                {/* Previous */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Số lần liên hệ trước chiến dịch (Previous) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.previous}
                    onChange={(e) => handleChange('previous', parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums"
                    required
                  />
                  <span className="text-[10px] text-slate-400">≥ 0</span>
                </div>
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Xóa biểu mẫu
              </button>

              <button
                type="submit"
                disabled={isPredicting}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isPredicting ? (
                  <span>Đang tính toán trên Decision Tree...</span>
                ) : (
                  <>
                    <BrainCircuit className="w-4 h-4" />
                    <span>Dự đoán khách hàng (Predict)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Result Card: 5 cols */}
        <div className="lg:col-span-5 space-y-4">
          {result && interpretation ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-xs">
              {/* Header result */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    KẾT QUẢ DỰ ĐOÁN KHÁCH HÀNG
                  </span>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">
                    ID: {result.customerId} · Model: {result.modelVersion}
                  </div>
                </div>
                <button
                  onClick={printConsultationReport}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  title="In báo cáo tư vấn"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>

              {/* Prediction Class Badge */}
              <div
                className={`p-5 rounded-xl border flex items-center justify-between ${
                  result.prediction === 'yes'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50/70 border-rose-200 text-rose-900'
                }`}
              >
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
                    Phân loại mô hình:
                  </div>
                  <div className="text-2xl font-extrabold tracking-tight mt-0.5">
                    {result.prediction === 'yes'
                      ? 'YES – TIỀM NĂNG'
                      : 'NO – KHÔNG TIỀM NĂNG'}
                  </div>
                  <div className="text-xs mt-1 font-medium">
                    {result.prediction === 'yes'
                      ? 'Khách hàng có xu hướng đăng ký tiền gửi có kỳ hạn'
                      : 'Khách hàng ít có khả năng đăng ký tiền gửi kỳ hạn'}
                  </div>
                </div>

                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${
                    result.prediction === 'yes' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  {result.prediction === 'yes' ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : (
                    <XCircle className="w-8 h-8" />
                  )}
                </div>
              </div>

              {/* Probability Visualizer Progress Bars (Section 6.4) */}
              <div className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>Xác suất dự đoán từ nút lá (predict_proba)</span>
                  <span className="text-[11px] text-slate-400 font-mono">Tổng: 100%</span>
                </div>

                {/* Probability YES */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-emerald-700">Xác suất YES (Đăng ký):</span>
                    <span className="font-mono text-emerald-800 tabular-nums">
                      {result.probabilityYes}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${result.probabilityYes}%` }}
                    />
                  </div>
                </div>

                {/* Probability NO */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-rose-700">Xác suất NO (Từ chối):</span>
                    <span className="font-mono text-rose-800 tabular-nums">
                      {result.probabilityNo}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${result.probabilityNo}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Confidence Tier & Action Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">
                    Độ tin cậy dự đoán
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-1">
                    {interpretation.confidenceTier}
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">
                    Mức ưu tiên tiếp cận
                  </div>
                  <div className="text-xs font-bold text-blue-700 mt-1">
                    {interpretation.actionPriority}
                  </div>
                </div>
              </div>

              {/* 6.5 Diễn giải nghiệp vụ ngân hàng */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Diễn giải nghiệp vụ ngân hàng</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {interpretation.standardText}
                </p>
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-900 mb-1">
                    Khuyến nghị hành động cụ thể:
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {interpretation.businessAdvice}
                  </p>
                </div>
              </div>

              {/* Decision Path Trace */}
              {result.decisionPath && result.decisionPath.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <GitCommit className="w-3.5 h-3.5 text-blue-600" />
                    <span>Đường dẫn rẽ nhánh Decision Tree (Node #{result.leafNodeId}):</span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-slate-700">
                    {result.decisionPath.map((step, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2">
                        <span className="text-slate-400">└─</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="text-[10px] text-slate-400 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>{interpretation.disclaimer}</span>
              </div>
            </div>
          ) : (
            /* Empty State / Initial Guidance */
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Sẵn sàng phân loại khách hàng
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Nhập thông tin 16 trường hoặc chọn 1 trong 3 hồ sơ mẫu bên trên để kiểm tra kết quả phân loại từ mô hình Decision Tree.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-left text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-900">Quy trình xử lý thực tế:</div>
                <div>1. OneHotEncoder & Preprocessing đồng bộ với tập huấn luyện</div>
                <div>2. Đánh giá điều kiện rẽ nhánh qua các nút trong cây quyết định</div>
                <div>3. Tính toán tỷ lệ phân bố lớp tại nút lá tương ứng (predict_proba)</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
