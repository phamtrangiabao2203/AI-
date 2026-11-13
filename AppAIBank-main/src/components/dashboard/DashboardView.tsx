import React, { useState, useEffect } from 'react';
import {
  Users,
  Target,
  CheckCircle2,
  XCircle,
  TrendingUp,
  UserCheck,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  Briefcase,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { api } from '../../services/api';
import { DashboardSummary, PredictionRecord } from '../../types';

interface DashboardViewProps {
  onNavigateToPredict: () => void;
  onViewPredictionDetail: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToPredict,
  onViewPredictionDetail,
}) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [timeRange, setTimeRange] = useState('30days');
  const [labelFilter, setLabelFilter] = useState('all');
  const [ageGroupFilter, setAgeGroupFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getDashboardSummary({
        timeRange,
        label: labelFilter,
        ageGroup: ageGroupFilter,
        job: jobFilter,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu Dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [timeRange, labelFilter, ageGroupFilter, jobFilter]);

  const kpis = data?.kpis;
  const charts = data?.charts;

  return (
    <div className="space-y-6">
      {/* Top Banner & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Tổng quan Hoạt động Tiếp thị & Phân loại Khách hàng
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân tích số liệu thực tế được suy luận bởi mô hình Decision Tree Classifier.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboard}
            disabled={isLoading}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <button
            onClick={onNavigateToPredict}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dự đoán khách hàng mới</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold mr-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Bộ lọc Dashboard:</span>
        </div>

        {/* Time Range */}
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="7days">7 ngày gần nhất</option>
          <option value="30days">30 ngày gần nhất</option>
          <option value="all">Toàn bộ thời gian</option>
        </select>

        {/* Label Filter */}
        <select
          value={labelFilter}
          onChange={(e) => setLabelFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">Tất cả kết quả (YES & NO)</option>
          <option value="yes">Chỉ nhóm YES (Tiềm năng)</option>
          <option value="no">Chỉ nhóm NO (Không tiềm năng)</option>
        </select>

        {/* Age Filter */}
        <select
          value={ageGroupFilter}
          onChange={(e) => setAgeGroupFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">Tất cả nhóm tuổi</option>
          <option value="<30">Dưới 30 tuổi</option>
          <option value="30-39">Từ 30 đến 39 tuổi</option>
          <option value="40-49">Từ 40 đến 49 tuổi</option>
          <option value="50-59">Từ 50 đến 59 tuổi</option>
          <option value="60+">Từ 60 tuổi trở lên</option>
        </select>

        {/* Job Filter */}
        <select
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">Tất cả nghề nghiệp</option>
          <option value="management">Management (Quản lý)</option>
          <option value="technician">Technician (Kỹ thuật)</option>
          <option value="blue-collar">Blue-collar (Công nhân)</option>
          <option value="retired">Retired (Hưu trí)</option>
          <option value="services">Services (Dịch vụ)</option>
          <option value="admin.">Admin (Hành chính)</option>
          <option value="student">Student (Sinh viên)</option>
        </select>

        {(timeRange !== '30days' || labelFilter !== 'all' || ageGroupFilter !== 'all' || jobFilter !== 'all') && (
          <button
            onClick={() => {
              setTimeRange('30days');
              setLabelFilter('all');
              setAgeGroupFilter('all');
              setJobFilter('all');
            }}
            className="text-xs text-blue-600 hover:underline font-medium ml-auto"
          >
            Đặt lại bộ lọc
          </button>
        )}
      </div>

      {/* 5.1 KPI Cards (6 cards as specified in Section 5.1) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Customers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium">Tổng khách hàng</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">
            {kpis ? kpis.totalCustomers.toLocaleString() : '...'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Cơ sở dữ liệu ngân hàng</div>
        </div>

        {/* Total Predictions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium">Lượt dự đoán</span>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">
            {kpis ? kpis.totalPredictions.toLocaleString() : '...'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Thực hiện bởi Decision Tree</div>
        </div>

        {/* YES Predictions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium">Khách hàng YES</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-600 tabular-nums">
            {kpis ? kpis.yesPredictions.toLocaleString() : '...'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Khả năng đăng ký cao</div>
        </div>

        {/* NO Predictions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium">Khách hàng NO</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-600 tabular-nums">
            {kpis ? kpis.noPredictions.toLocaleString() : '...'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Chưa sẵn sàng đăng ký</div>
        </div>

        {/* YES Conversion Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium">Tỷ lệ YES (%)</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-600 tabular-nums">
            {kpis ? `${kpis.yesRate}%` : '...'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Tỷ lệ chuyển đổi tiềm năng</div>
        </div>

        {/* Active Users */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium">Người dùng active</span>
            <UserCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">
            {kpis ? kpis.activeUsersCount : '...'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Tài khoản cán bộ tiếp thị</div>
        </div>
      </div>

      {/* 5.2 Biểu đồ phân tích (Section 1: Pie Chart & Time Trends) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Pie Chart: Tỷ lệ khách hàng YES/NO */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900">1. Tỷ lệ Khách hàng YES / NO</h3>
              <p className="text-[11px] text-slate-500">Phân bố nhãn dự đoán của toàn bộ mẫu</p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            {charts?.pieData && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} lượt`, name]}
                    contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 2 & 3. Bar & Line Chart: Xu hướng dự đoán theo thời gian */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                2 & 3. Khối lượng Dự đoán & Tỷ lệ YES (%) theo Thời gian
              </h3>
              <p className="text-[11px] text-slate-500">
                Theo dõi biến động số lượng khách hàng tiếp cận và tỷ lệ chuyển đổi
              </p>
            </div>
          </div>
          <div className="h-64">
            {charts?.timeTrends && charts.timeTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.timeTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Số lượt', angle: -90, position: 'insideLeft', fontSize: 10 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10 }}
                    domain={[0, 100]}
                    unit="%"
                  />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar yAxisId="left" dataKey="total" name="Tổng dự đoán" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="yesRate"
                    name="Tỷ lệ YES (%)"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Chưa có đủ dữ liệu theo chu kỳ thời gian đã chọn
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5.2 Biểu đồ phân tích (Section 2: Job Distribution & Age Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4. Bar Chart: Phân bố khách hàng YES/NO theo nghề nghiệp */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900">4. Phân bố YES / NO theo Nghề nghiệp</h3>
              <p className="text-[11px] text-slate-500">So sánh khả năng chuyển đổi giữa các ngành nghề</p>
            </div>
          </div>
          <div className="h-64">
            {charts?.jobDistribution && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.jobDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="job" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="yes" name="YES (Tiềm năng)" fill="#16A34A" stackId="a" />
                  <Bar dataKey="no" name="NO (Không tiềm năng)" fill="#DC2626" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 5. Bar Chart: Phân bố khách hàng theo nhóm tuổi */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900">5. Phân bố Khách hàng theo Nhóm Tuổi</h3>
              <p className="text-[11px] text-slate-500">Đánh giá độ nhạy sản phẩm tiết kiệm theo độ tuổi</p>
            </div>
          </div>
          <div className="h-64">
            {charts?.ageDistribution && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="yes" name="YES" fill="#2563EB" />
                  <Bar dataKey="no" name="NO" fill="#94A3B8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 5.2 Biểu đồ phân tích (Section 3: Stacked Bar Chart Loans & Confidence Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 6. Stacked Bar Chart: Tình trạng Vay mua nhà & Vay cá nhân */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                6. Phân loại theo Tình trạng Vay mua nhà & Vay cá nhân
              </h3>
              <p className="text-[11px] text-slate-500">
                Khách hàng không có khoản nợ vay thường có tỷ lệ gửi tiết kiệm cao hơn
              </p>
            </div>
          </div>
          <div className="h-64">
            {charts?.loanDistribution && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.loanDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="yes" name="YES" fill="#16A34A" stackId="l" />
                  <Bar dataKey="no" name="NO" fill="#DC2626" stackId="l" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 7. Confidence Distribution (Phân phối xác suất dự đoán của mô hình) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                7. Phân phối Xác suất Dự đoán (Confidence Distribution)
              </h3>
              <p className="text-[11px] text-slate-500">
                Mức độ phân bố xác suất YES từ nút lá của Decision Tree
              </p>
            </div>
          </div>
          <div className="h-64">
            {charts?.confidenceDistribution && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.confidenceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Số lượng dự đoán" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 5.3 Recent Predictions Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">Các Lượt Dự đoán Gần Nhất</h3>
            <p className="text-[11px] text-slate-500">Lịch sử suy luận thời gian thực</p>
          </div>
          <button
            onClick={onNavigateToPredict}
            className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
          >
            <span>Dự đoán mới</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Customer ID</th>
                <th className="py-2.5 px-4">Độ tuổi</th>
                <th className="py-2.5 px-4">Nghề nghiệp</th>
                <th className="py-2.5 px-4">Kết quả</th>
                <th className="py-2.5 px-4">Xác suất (YES / NO)</th>
                <th className="py-2.5 px-4">Cán bộ</th>
                <th className="py-2.5 px-4">Thời gian</th>
                <th className="py-2.5 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.recentPredictions && data.recentPredictions.length > 0 ? (
                data.recentPredictions.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{row.customerId}</td>
                    <td className="py-2.5 px-4 text-slate-700 tabular-nums">{row.age} tuổi</td>
                    <td className="py-2.5 px-4 text-slate-700 capitalize">{row.job}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1 ${
                          row.prediction === 'yes'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {row.prediction === 'yes' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {row.prediction.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] tabular-nums">
                      <span className="text-emerald-700 font-semibold">{row.probabilityYes}%</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-rose-700">{row.probabilityNo}%</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{row.userName}</td>
                    <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                      {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                      · {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => onViewPredictionDetail(row.id)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Chưa có lượt dự đoán nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
