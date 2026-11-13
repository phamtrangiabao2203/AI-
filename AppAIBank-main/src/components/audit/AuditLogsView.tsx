import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Download,
  Filter,
  RefreshCw,
  Clock,
  Terminal,
} from 'lucide-react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getAuditLogs(150);
      setLogs(res.logs);
    } catch (err: any) {
      setError(err.message || 'Không thể tải nhật ký hoạt động.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.entity.toLowerCase().includes(search.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            <span>Nhật ký Hoạt động & Kiểm toán Hệ thống (Audit Logs)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi vết bất biến các thao tác đăng nhập, phân quyền, dự đoán và quản trị mô hình.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600"
            title="Làm mới nhật ký"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <a
            href="/api/audit-logs/export/csv"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất file CSV</span>
          </a>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo hành động (Action), Cán bộ, Thực thể hoặc Nội dung chi tiết..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Log ID</th>
                <th className="py-2.5 px-4">Thời gian</th>
                <th className="py-2.5 px-4">Cán bộ (User)</th>
                <th className="py-2.5 px-4">Hành động (Action)</th>
                <th className="py-2.5 px-4">Thực thể (Entity)</th>
                <th className="py-2.5 px-4">IP</th>
                <th className="py-2.5 px-4">Chi tiết ghi nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Đang nạp nhật ký kiểm toán...
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 text-slate-500">{log.id}</td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">
                      {log.userName}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-blue-700 font-semibold">{log.entity}</td>
                    <td className="py-2.5 px-4 text-slate-400">{log.ipAddress}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-700 text-xs">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Không tìm thấy bản ghi nhật ký phù hợp.
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
