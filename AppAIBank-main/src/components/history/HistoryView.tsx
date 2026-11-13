import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Calendar,
  X,
  GitCommit,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { PredictionRecord, BusinessInterpretation } from '../../types';
import { generateBusinessInterpretation } from '../../../server/routes/predict';

interface HistoryViewProps {
  initialSelectedId?: string | null;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ initialSelectedId }) => {
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [labelFilter, setLabelFilter] = useState('all');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Selected Detail Modal
  const [selectedRecord, setSelectedRecord] = useState<PredictionRecord | null>(null);

  const fetchPredictions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getPredictions({
        search,
        prediction: labelFilter,
        limit: pageSize,
        offset: page * pageSize,
      });
      setPredictions(res.items);
      setTotal(res.total);

      if (initialSelectedId) {
        const found = res.items.find((p) => p.id === initialSelectedId);
        if (found) setSelectedRecord(found);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải lịch sử dự đoán.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [search, labelFilter, page]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>Lịch sử Phân loại & Dự đoán Khách hàng</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lưu trữ {total.toLocaleString()} lượt dự đoán cùng thông số đầu vào và đường rẽ nhánh Decision Tree.
          </p>
        </div>

        <a
          href="/api/predict/export/csv"
          className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Xuất lịch sử CSV</span>
        </a>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Prediction ID, Customer ID hoặc Cán bộ..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
          />
        </div>

        <select
          value={labelFilter}
          onChange={(e) => {
            setLabelFilter(e.target.value);
            setPage(0);
          }}
          className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50/50"
        >
          <option value="all">Tất cả nhãn (YES & NO)</option>
          <option value="yes">Chỉ nhãn YES (Tiềm năng)</option>
          <option value="no">Chỉ nhãn NO (Không tiềm năng)</option>
        </select>
      </div>

      {/* Prediction History Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Prediction ID</th>
                <th className="py-2.5 px-4">Customer ID</th>
                <th className="py-2.5 px-4">Kết quả</th>
                <th className="py-2.5 px-4">Xác suất YES / NO</th>
                <th className="py-2.5 px-4">Tuổi & Nghề</th>
                <th className="py-2.5 px-4">Số dư / Cuộc gọi</th>
                <th className="py-2.5 px-4">Phiên bản Model</th>
                <th className="py-2.5 px-4">Cán bộ thực hiện</th>
                <th className="py-2.5 px-4">Thời gian</th>
                <th className="py-2.5 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Đang nạp lịch sử dự đoán...
                  </td>
                </tr>
              ) : predictions.length > 0 ? (
                predictions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{p.id}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">{p.customerId}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1 ${
                          p.prediction === 'yes'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {p.prediction === 'yes' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {p.prediction.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] tabular-nums">
                      <span className="text-emerald-700 font-semibold">{p.probabilityYes}%</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-rose-700">{p.probabilityNo}%</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      {p.customerData?.age} tuổi · <span className="capitalize">{p.customerData?.job}</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 tabular-nums">
                      ${p.customerData?.balance?.toLocaleString()} · {p.customerData?.duration}s
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">{p.modelVersion}</td>
                    <td className="py-2.5 px-4 text-slate-600">{p.userName}</td>
                    <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                      {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(p)}
                        className="p-1 rounded text-blue-600 hover:bg-blue-50"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Chưa có kết quả dự đoán nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Hiển thị {page * pageSize + 1} - {Math.min((page + 1) * pageSize, total)} trong tổng số{' '}
            {total.toLocaleString()} lượt dự đoán
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-40"
            >
              Trước
            </button>
            <span className="px-2 font-mono">{page + 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * pageSize >= total}
              className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Chi tiết Kết quả Dự đoán</h3>
                <div className="text-xs text-slate-500 font-mono">
                  {selectedRecord.id} · Customer: {selectedRecord.customerId}
                </div>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prediction Outcome Header */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                selectedRecord.prediction === 'yes'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Kết quả phân loại</span>
                <div className="text-xl font-extrabold mt-0.5">
                  {selectedRecord.prediction === 'yes' ? 'YES (ĐĂNG KÝ TIỀN GỬI)' : 'NO (KHÔNG ĐĂNG KÝ)'}
                </div>
                <div className="text-xs font-mono mt-1">
                  Xác suất YES: {selectedRecord.probabilityYes}% | Xác suất NO: {selectedRecord.probabilityNo}%
                </div>
              </div>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                  selectedRecord.prediction === 'yes' ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {selectedRecord.prediction === 'yes' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
              </div>
            </div>

            {/* Input Snapshot */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="font-semibold text-slate-900 block">Thông tin hồ sơ tại thời điểm dự đoán:</span>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>Tuổi: <span className="font-semibold">{selectedRecord.customerData?.age}</span></div>
                <div>Nghề nghiệp: <span className="font-semibold capitalize">{selectedRecord.customerData?.job}</span></div>
                <div>Học vấn: <span className="font-semibold capitalize">{selectedRecord.customerData?.education}</span></div>
                <div>Hôn nhân: <span className="font-semibold capitalize">{selectedRecord.customerData?.marital}</span></div>
                <div>Số dư tài khoản: <span className="font-semibold">${selectedRecord.customerData?.balance?.toLocaleString()}</span></div>
                <div>Vay mua nhà: <span className="font-semibold">{selectedRecord.customerData?.housing}</span></div>
                <div>Vay cá nhân: <span className="font-semibold">{selectedRecord.customerData?.loan}</span></div>
                <div>Thời lượng cuộc gọi: <span className="font-semibold">{selectedRecord.customerData?.duration}s</span></div>
              </div>
            </div>

            {/* Decision Tree Split Path */}
            {selectedRecord.decisionPath && selectedRecord.decisionPath.length > 0 && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <GitCommit className="w-3.5 h-3.5 text-blue-600" />
                  <span>Vết đường dẫn rẽ nhánh cây quyết định (Node #{selectedRecord.leafNodeId}):</span>
                </div>
                <div className="font-mono text-[11px] text-slate-600 space-y-1">
                  {selectedRecord.decisionPath.map((step, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-1.5">
                      <span className="text-slate-400">├─</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
              <div>Cán bộ: {selectedRecord.userName}</div>
              <div>Thời gian: {new Date(selectedRecord.createdAt).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
