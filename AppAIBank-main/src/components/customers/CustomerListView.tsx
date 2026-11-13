import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Save,
} from 'lucide-react';
import { api } from '../../services/api';
import { Customer, CustomerInput } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface CustomerListViewProps {
  onPredictCustomer: (customer: CustomerInput & { customerId?: string }) => void;
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({ onPredictCustomer }) => {
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('all');
  const [ageGroupFilter, setAgeGroupFilter] = useState('all');
  const [depositFilter, setDepositFilter] = useState('all');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form states for Add/Edit
  const [customerForm, setCustomerForm] = useState<CustomerInput>({
    age: 35,
    job: 'management',
    marital: 'married',
    education: 'tertiary',
    default: 'no',
    balance: 2000,
    housing: 'no',
    loan: 'no',
    contact: 'cellular',
    day: 15,
    month: 'aug',
    duration: 300,
    campaign: 1,
    pdays: -1,
    previous: 0,
    poutcome: 'unknown',
  });

  const [importCsvText, setImportCsvText] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getCustomers({
        search,
        job: jobFilter,
        ageGroup: ageGroupFilter,
        deposit: depositFilter,
        limit: pageSize,
        offset: page * pageSize,
      });
      setCustomers(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách khách hàng.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, jobFilter, ageGroupFilter, depositFilter, page]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCustomer(customerForm);
      setShowAddModal(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo khách hàng.');
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      await api.updateCustomer(selectedCustomer.id, customerForm);
      setShowEditModal(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật khách hàng.');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ khách hàng ${id}? Hành động này không thể hoàn tác.`)) {
      return;
    }
    try {
      await api.deleteCustomer(id);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa khách hàng.');
    }
  };

  const handleImportCsv = async () => {
    if (!importCsvText.trim()) return;
    try {
      const lines = importCsvText.trim().split('\n');
      if (lines.length < 2) {
        alert('Tệp CSV cần có dòng tiêu đề và ít nhất 1 dòng dữ liệu.');
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const rows: CustomerInput[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        if (cols.length < headers.length) continue;
        const obj: any = {};
        headers.forEach((h, idx) => {
          obj[h] = cols[idx];
        });
        rows.push({
          age: parseInt(obj.age, 10) || 30,
          job: obj.job || 'management',
          marital: obj.marital || 'married',
          education: obj.education || 'secondary',
          default: obj.default || 'no',
          balance: parseInt(obj.balance, 10) || 0,
          housing: obj.housing || 'no',
          loan: obj.loan || 'no',
          contact: obj.contact || 'cellular',
          day: parseInt(obj.day, 10) || 1,
          month: obj.month || 'may',
          duration: parseInt(obj.duration, 10) || 180,
          campaign: parseInt(obj.campaign, 10) || 1,
          pdays: parseInt(obj.pdays, 10) ?? -1,
          previous: parseInt(obj.previous, 10) || 0,
          poutcome: obj.poutcome || 'unknown',
        });
      }

      const res = await api.importCustomers(rows);
      setImportMessage(`Thành công: ${res.message}`);
      fetchCustomers();
      setTimeout(() => setShowImportModal(false), 1500);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi nhập dữ liệu CSV.');
    }
  };

  const openEdit = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerForm({ ...c });
    setShowEditModal(true);
  };

  const openDetail = (c: Customer) => {
    setSelectedCustomer(c);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Fast Actions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Quản lý Danh sách Hồ sơ Khách hàng</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng cộng {total.toLocaleString()} hồ sơ khách hàng trong hệ thống ngân hàng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm khách hàng</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <a
            href="/api/customers/export"
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Customer ID hoặc Nghề nghiệp..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
          />
        </div>

        <select
          value={jobFilter}
          onChange={(e) => {
            setJobFilter(e.target.value);
            setPage(0);
          }}
          className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50/50"
        >
          <option value="all">Tất cả nghề nghiệp</option>
          <option value="management">Management</option>
          <option value="technician">Technician</option>
          <option value="blue-collar">Blue-collar</option>
          <option value="admin.">Admin</option>
          <option value="retired">Retired</option>
          <option value="services">Services</option>
          <option value="student">Student</option>
        </select>

        <select
          value={ageGroupFilter}
          onChange={(e) => {
            setAgeGroupFilter(e.target.value);
            setPage(0);
          }}
          className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50/50"
        >
          <option value="all">Tất cả nhóm tuổi</option>
          <option value="<30">Dưới 30 tuổi</option>
          <option value="30-39">30 - 39 tuổi</option>
          <option value="40-49">40 - 49 tuổi</option>
          <option value="50-59">50 - 59 tuổi</option>
          <option value="60+">60+ tuổi</option>
        </select>

        <select
          value={depositFilter}
          onChange={(e) => {
            setDepositFilter(e.target.value);
            setPage(0);
          }}
          className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50/50"
        >
          <option value="all">Tất cả nhãn thực tế</option>
          <option value="yes">Thực tế YES</option>
          <option value="no">Thực tế NO</option>
        </select>
      </div>

      {/* Customer Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Customer ID</th>
                <th className="py-2.5 px-4">Tuổi</th>
                <th className="py-2.5 px-4">Nghề nghiệp</th>
                <th className="py-2.5 px-4">Hôn nhân</th>
                <th className="py-2.5 px-4">Học vấn</th>
                <th className="py-2.5 px-4 text-right">Số dư ($)</th>
                <th className="py-2.5 px-4">Vay nhà / Cá nhân</th>
                <th className="py-2.5 px-4">Cuộc gọi gần nhất</th>
                <th className="py-2.5 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Đang nạp danh sách khách hàng...
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{c.id}</td>
                    <td className="py-2.5 px-4 text-slate-700 tabular-nums">{c.age}</td>
                    <td className="py-2.5 px-4 text-slate-700 capitalize">{c.job}</td>
                    <td className="py-2.5 px-4 text-slate-600 capitalize">{c.marital}</td>
                    <td className="py-2.5 px-4 text-slate-600 capitalize">{c.education}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-900 tabular-nums">
                      ${c.balance.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 text-[11px]">
                      {c.housing === 'yes' ? 'Vay nhà' : 'Ko vay nhà'} ·{' '}
                      {c.loan === 'yes' ? 'Vay CN' : 'Ko vay CN'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 text-[11px] tabular-nums">
                      {c.duration}s ({c.month.toUpperCase()})
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Quick Predict button */}
                        <button
                          onClick={() => onPredictCustomer(c)}
                          className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-[11px] flex items-center gap-1"
                          title="Đưa vào mô hình dự đoán"
                        >
                          <BrainCircuit className="w-3 h-3" />
                          <span>Dự đoán</span>
                        </button>

                        <button
                          onClick={() => openDetail(c)}
                          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openEdit(c)}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteCustomer(c.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Xóa hồ sơ (Chỉ Admin)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Không tìm thấy khách hàng phù hợp với điều kiện tìm kiếm.
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
            {total.toLocaleString()} khách hàng
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

      {/* Add / Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {showAddModal ? 'Thêm mới Hồ sơ Khách hàng' : `Chỉnh sửa Khách hàng ${selectedCustomer?.id}`}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleCreateCustomer : handleUpdateCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tuổi</label>
                  <input
                    type="number"
                    min="18"
                    max="110"
                    value={customerForm.age}
                    onChange={(e) => setCustomerForm({ ...customerForm, age: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Nghề nghiệp</label>
                  <select
                    value={customerForm.job}
                    onChange={(e) => setCustomerForm({ ...customerForm, job: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 capitalize"
                  >
                    <option value="management">management</option>
                    <option value="technician">technician</option>
                    <option value="blue-collar">blue-collar</option>
                    <option value="admin.">admin.</option>
                    <option value="retired">retired</option>
                    <option value="services">services</option>
                    <option value="student">student</option>
                    <option value="self-employed">self-employed</option>
                    <option value="unemployed">unemployed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Hôn nhân</label>
                  <select
                    value={customerForm.marital}
                    onChange={(e) => setCustomerForm({ ...customerForm, marital: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="married">married</option>
                    <option value="single">single</option>
                    <option value="divorced">divorced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Học vấn</label>
                  <select
                    value={customerForm.education}
                    onChange={(e) => setCustomerForm({ ...customerForm, education: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="tertiary">tertiary</option>
                    <option value="secondary">secondary</option>
                    <option value="primary">primary</option>
                    <option value="unknown">unknown</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Số dư tài khoản ($)</label>
                  <input
                    type="number"
                    value={customerForm.balance}
                    onChange={(e) => setCustomerForm({ ...customerForm, balance: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Vay mua nhà (housing)</label>
                  <select
                    value={customerForm.housing}
                    onChange={(e) => setCustomerForm({ ...customerForm, housing: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="no">no</option>
                    <option value="yes">yes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Vay cá nhân (loan)</label>
                  <select
                    value={customerForm.loan}
                    onChange={(e) => setCustomerForm({ ...customerForm, loan: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="no">no</option>
                    <option value="yes">yes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Thời lượng cuộc gọi (giây)</label>
                  <input
                    type="number"
                    min="0"
                    value={customerForm.duration}
                    onChange={(e) => setCustomerForm({ ...customerForm, duration: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tháng liên hệ</label>
                  <select
                    value={customerForm.month}
                    onChange={(e) => setCustomerForm({ ...customerForm, month: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 uppercase"
                  >
                    {['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].map((m) => (
                      <option key={m} value={m}>{m.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Kết quả chiến dịch trước (poutcome)</label>
                  <select
                    value={customerForm.poutcome}
                    onChange={(e) => setCustomerForm({ ...customerForm, poutcome: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="unknown">unknown</option>
                    <option value="success">success</option>
                    <option value="failure">failure</option>
                    <option value="other">other</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                >
                  {showAddModal ? 'Lưu khách hàng' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Nhập danh sách Khách hàng từ CSV</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Dán nội dung CSV với đầy đủ các cột: age,job,marital,education,default,balance,housing,loan,contact,day,month,duration,campaign,pdays,previous,poutcome
            </p>

            <textarea
              rows={8}
              value={importCsvText}
              onChange={(e) => setImportCsvText(e.target.value)}
              placeholder="age,job,marital,education,default,balance,housing,loan,contact,day,month,duration,campaign,pdays,previous,poutcome&#10;35,management,married,tertiary,no,2500,no,no,cellular,15,aug,450,1,-1,0,unknown"
              className="w-full p-2.5 font-mono text-[11px] border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            {importMessage && (
              <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                {importMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                onClick={handleImportCsv}
                className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
              >
                Tiến hành Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Chi tiết Hồ sơ Khách hàng</h3>
                <span className="text-xs text-slate-500 font-mono">{selectedCustomer.id}</span>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-slate-50">
                <span className="text-slate-400 block text-[10px]">Tuổi & Nghề nghiệp</span>
                <span className="font-semibold text-slate-900">{selectedCustomer.age} tuổi · {selectedCustomer.job}</span>
              </div>
              <div className="p-2 rounded bg-slate-50">
                <span className="text-slate-400 block text-[10px]">Hôn nhân & Học vấn</span>
                <span className="font-semibold text-slate-900">{selectedCustomer.marital} · {selectedCustomer.education}</span>
              </div>
              <div className="p-2 rounded bg-slate-50">
                <span className="text-slate-400 block text-[10px]">Số dư bình quân</span>
                <span className="font-semibold text-slate-900">${selectedCustomer.balance.toLocaleString()}</span>
              </div>
              <div className="p-2 rounded bg-slate-50">
                <span className="text-slate-400 block text-[10px]">Nợ & Khoản vay</span>
                <span className="font-semibold text-slate-900">
                  Vay nhà: {selectedCustomer.housing} | Vay CN: {selectedCustomer.loan}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-50">
                <span className="text-slate-400 block text-[10px]">Thời lượng liên hệ gần nhất</span>
                <span className="font-semibold text-slate-900">{selectedCustomer.duration} giây ({selectedCustomer.month.toUpperCase()})</span>
              </div>
              <div className="p-2 rounded bg-slate-50">
                <span className="text-slate-400 block text-[10px]">Chiến dịch & Kết quả trước</span>
                <span className="font-semibold text-slate-900">
                  {selectedCustomer.campaign} lần · {selectedCustomer.poutcome}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  onPredictCustomer(selectedCustomer);
                }}
                className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-1.5"
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>Thực hiện Dự đoán ngay</span>
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
