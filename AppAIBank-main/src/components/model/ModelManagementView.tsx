import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  CheckCircle2,
  Sliders,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Cpu,
  Layers,
  Database,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../../services/api';
import { ModelMetadata, FeatureImportance, TreeNode } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const ModelManagementView: React.FC = () => {
  const { isAdmin } = useAuth();
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);
  const [treeRoot, setTreeRoot] = useState<TreeNode | null>(null);
  const [featureImportances, setFeatureImportances] = useState<FeatureImportance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Retrain form (Admin only)
  const [retrainParams, setRetrainParams] = useState({
    criterion: 'gini',
    maxDepth: 6,
    minSamplesSplit: 10,
    minSamplesLeaf: 5,
    classWeight: 'none',
  });
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState<string | null>(null);

  // Tree Visualizer Node inspection
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  const fetchModelData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [infoRes, impRes, treeRes] = await Promise.all([
        api.getModelInfo(),
        api.getFeatureImportance(),
        api.getTreeNodes(),
      ]);
      setMetadata(infoRes.metadata);
      setFeatureImportances(impRes.featureImportances || []);
      setTreeRoot(treeRes.tree);
      setSelectedNode(treeRes.tree);
      if (infoRes.metadata.hyperparameters) {
        setRetrainParams({
          criterion: infoRes.metadata.hyperparameters.criterion || 'gini',
          maxDepth: infoRes.metadata.hyperparameters.maxDepth || 6,
          minSamplesSplit: infoRes.metadata.hyperparameters.minSamplesSplit || 10,
          minSamplesLeaf: infoRes.metadata.hyperparameters.minSamplesLeaf || 5,
          classWeight: infoRes.metadata.hyperparameters.classWeight || 'none',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin mô hình AI.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModelData();
  }, []);

  const handleRetrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsRetraining(true);
    setRetrainSuccess(null);
    setError(null);
    try {
      const res = await api.retrainModel(retrainParams);
      setRetrainSuccess(res.message);
      await fetchModelData();
    } catch (err: any) {
      setError(err.message || 'Lỗi trong quá trình huấn luyện lại mô hình.');
    } finally {
      setIsRetraining(false);
    }
  };

  const metrics = metadata?.metrics;
  const cm = metrics?.confusionMatrix;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-600" />
            <span>Quản lý Mô hình AI – Decision Tree Classifier</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mô hình học máy có giám sát (Supervised Learning) huấn luyện trên tập dữ liệu Bank Marketing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Trạng thái: Hoạt động (Active)</span>
          </span>
          <button
            onClick={fetchModelData}
            disabled={isLoading}
            className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600"
            title="Làm mới"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {retrainSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{retrainSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Model Spec Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-400 font-medium block">Tên mô hình</span>
          <span className="text-xs font-bold text-slate-900 mt-1 block">Decision Tree</span>
          <span className="text-[10px] text-blue-600 font-mono">{metadata?.modelVersion || 'v1.0.0'}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-400 font-medium block">Loại thuật toán</span>
          <span className="text-xs font-bold text-slate-900 mt-1 block">Supervised Learning</span>
          <span className="text-[10px] text-slate-500">Classification</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-400 font-medium block">Tập dữ liệu</span>
          <span className="text-xs font-bold text-slate-900 mt-1 block">Bank Marketing</span>
          <span className="text-[10px] text-slate-500">11.162 bản ghi</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-400 font-medium block">Số lượng đặc trưng</span>
          <span className="text-xs font-bold text-slate-900 mt-1 block">16 Features</span>
          <span className="text-[10px] text-slate-500">7 Num + 9 Cat</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-400 font-medium block">Mẫu Train (80%)</span>
          <span className="text-xs font-bold text-slate-900 mt-1 block tabular-nums">
            {metrics?.trainSamples?.toLocaleString() || '8.929'}
          </span>
          <span className="text-[10px] text-slate-500">Stratified split</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-400 font-medium block">Mẫu Test (20%)</span>
          <span className="text-xs font-bold text-slate-900 mt-1 block tabular-nums">
            {metrics?.testSamples?.toLocaleString() || '2.233'}
          </span>
          <span className="text-[10px] text-slate-500">Tập độc lập</span>
        </div>
      </div>

      {/* Evaluation Metrics on Independent Test Set (Section 9 & 3.4) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Accuracy */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 font-medium block">Độ chính xác (Accuracy)</span>
          <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums font-mono">
            {metrics ? `${metrics.accuracy}%` : '...'}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Tỷ lệ phân loại đúng tổng thể</span>
        </div>

        {/* Precision */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 font-medium block">Precision (Lớp YES)</span>
          <div className="text-2xl font-black text-blue-600 mt-1 tabular-nums font-mono">
            {metrics ? `${metrics.precision}%` : '...'}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Độ chuẩn xác khi dự đoán YES</span>
        </div>

        {/* Recall */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 font-medium block">Recall (Lớp YES)</span>
          <div className="text-2xl font-black text-emerald-600 mt-1 tabular-nums font-mono">
            {metrics ? `${metrics.recall}%` : '...'}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Tỷ lệ bao phủ khách hàng thực tế</span>
        </div>

        {/* F1-Score */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 font-medium block">F1-Score (Lớp YES)</span>
          <div className="text-2xl font-black text-purple-600 mt-1 tabular-nums font-mono">
            {metrics ? `${metrics.f1Score}%` : '...'}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Trung bình điều hòa Precision & Recall</span>
        </div>
      </div>

      {/* Confusion Matrix & Classification Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix Heatmap */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-900">Ma trận Nhầm lẫn (Confusion Matrix)</h3>
            <p className="text-[11px] text-slate-500">Đánh giá trên 2.233 mẫu tập kiểm thử độc lập</p>
          </div>

          {cm && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                {/* True Negative */}
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500">True Negative (TN)</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">{cm.trueNegative}</div>
                  <span className="text-[10px] text-slate-500">Thực tế NO & Dự đoán NO</span>
                </div>

                {/* False Positive */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-700">False Positive (FP)</span>
                  <div className="text-xl font-extrabold text-amber-800 mt-1 font-mono">{cm.falsePositive}</div>
                  <span className="text-[10px] text-amber-600">Thực tế NO nhưng Dự đoán YES</span>
                </div>

                {/* False Negative */}
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-[10px] uppercase font-bold text-rose-700">False Negative (FN)</span>
                  <div className="text-xl font-extrabold text-rose-800 mt-1 font-mono">{cm.falseNegative}</div>
                  <span className="text-[10px] text-rose-600">Thực tế YES nhưng Bỏ sót (Dự đoán NO)</span>
                </div>

                {/* True Positive */}
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700">True Positive (TP)</span>
                  <div className="text-xl font-extrabold text-emerald-800 mt-1 font-mono">{cm.truePositive}</div>
                  <span className="text-[10px] text-emerald-600">Thực tế YES & Dự đoán YES</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 p-2.5 bg-slate-50 rounded-lg">
                Trong bài toán tiếp thị, tối đa hóa <span className="font-semibold text-slate-800">Recall và TP</span> giúp ngân hàng tránh bỏ lỡ các khách hàng sẵn sàng gửi tiết kiệm.
              </div>
            </div>
          )}
        </div>

        {/* Classification Report Table */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-900">Báo cáo Phân loại Chi tiết (Classification Report)</h3>
            <p className="text-[11px] text-slate-500">Chỉ số theo từng lớp nhãn</p>
          </div>

          {metrics?.classificationReport && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Lớp (Class)</th>
                    <th className="py-2 px-3 text-right">Precision</th>
                    <th className="py-2 px-3 text-right">Recall</th>
                    <th className="py-2 px-3 text-right">F1-Score</th>
                    <th className="py-2 px-3 text-right">Support</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-800">NO (Không tham gia)</td>
                    <td className="py-2.5 px-3 text-right">{metrics.classificationReport.no.precision}%</td>
                    <td className="py-2.5 px-3 text-right">{metrics.classificationReport.no.recall}%</td>
                    <td className="py-2.5 px-3 text-right">{metrics.classificationReport.no.f1Score}%</td>
                    <td className="py-2.5 px-3 text-right">{metrics.classificationReport.no.support}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">YES (Đăng ký tiền gửi)</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700">{metrics.classificationReport.yes.precision}%</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700">{metrics.classificationReport.yes.recall}%</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700">{metrics.classificationReport.yes.f1Score}%</td>
                    <td className="py-2.5 px-3 text-right">{metrics.classificationReport.yes.support}</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-600 font-semibold">Macro Avg</td>
                    <td className="py-2.5 px-3 text-right">{metrics.classificationReport.macroAvg.precision}%</td>
                    <td className="py-2.5 px-3 text-right">{metrics.classificationReport.macroAvg.recall}%</td>
                    <td className="py-2.5 px-3 text-right">{metrics.classificationReport.macroAvg.f1Score}%</td>
                    <td className="py-2.5 px-3 text-right">{metrics.classificationReport.macroAvg.support}</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-600 font-semibold">Weighted Avg</td>
                    <td className="py-2.5 px-3 text-right">{metrics.classificationReport.weightedAvg.precision}%</td>
                    <td className="py-2.5 px-3 text-right">{metrics.classificationReport.weightedAvg.recall}%</td>
                    <td className="py-2.5 px-3 text-right">{metrics.classificationReport.weightedAvg.f1Score}%</td>
                    <td className="py-2.5 px-3 text-right">{metrics.classificationReport.weightedAvg.support}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Feature Importance Bar Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-900">
            Tầm quan trọng của các Đặc trưng (Feature Importance Ranking)
          </h3>
          <p className="text-[11px] text-slate-500">
            Mức độ đóng góp giảm độ bất thuần (Gini/Entropy Impurity Reduction) trong cây quyết định
          </p>
        </div>

        <div className="h-72">
          {featureImportances.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={featureImportances.slice(0, 10)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" unit="%" tick={{ fontSize: 10 }} />
                <YAxis dataKey="feature" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Mức độ quan trọng']}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar dataKey="percentage" fill="#2563EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="mt-3 text-[11px] text-slate-500">
          Ghi chú: <span className="font-semibold text-slate-800">duration</span> (thời lượng cuộc gọi) và{' '}
          <span className="font-semibold text-slate-800">poutcome_success</span> (kết quả chiến dịch trước) là hai đặc trưng có sức ảnh hưởng phân loại cao nhất theo thực tế dữ liệu ngân hàng.
        </div>
      </div>

      {/* Interactive Decision Tree Visualizer */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Trực quan hóa Cây Quyết định (Decision Tree Visualizer)
            </h3>
            <p className="text-[11px] text-slate-500">
              Khám phá cấu trúc phân cấp các nút rẽ nhánh, điều kiện phân chia và phân bố mẫu
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Độ sâu tối đa: {metadata?.hyperparameters.maxDepth} tầng
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Tree Node Hierarchy (8 cols) */}
          <div className="lg:col-span-7 border border-slate-200 rounded-xl p-4 max-h-96 overflow-y-auto space-y-2 bg-slate-50/50">
            {treeRoot ? (
              <TreeNodeItem
                node={treeRoot}
                selectedNodeId={selectedNode?.id}
                onSelect={(node) => setSelectedNode(node)}
                depth={0}
              />
            ) : (
              <div className="text-xs text-slate-400 py-6 text-center">Đang tải cấu trúc cây...</div>
            )}
          </div>

          {/* Node Inspector Detail (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Thông tin Nút #{selectedNode?.id || 1}</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  selectedNode?.isLeaf
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {selectedNode?.isLeaf ? 'Nút Lá (Leaf Node)' : 'Nút Rẽ Nhánh (Split)'}
              </span>
            </div>

            {selectedNode ? (
              <div className="space-y-2.5 text-xs">
                {!selectedNode.isLeaf && (
                  <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-blue-600 font-semibold uppercase block">
                      Điều kiện rẽ nhánh (Split Rule)
                    </span>
                    <span className="font-mono font-bold text-blue-900 mt-0.5 block">
                      {selectedNode.splitDescription}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-50 rounded">
                    <span className="text-slate-400 block text-[10px]">Số lượng mẫu</span>
                    <span className="font-mono font-bold text-slate-900">{selectedNode.samples} mẫu</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <span className="text-slate-400 block text-[10px]">Độ bất thuần (Gini/Entropy)</span>
                    <span className="font-mono font-bold text-slate-900">{selectedNode.criterionValue}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                    Phân bố lớp tại nút:
                  </span>
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-rose-700 font-semibold">
                      NO: {selectedNode.classCounts[0]} ({Math.round(selectedNode.probabilities[0] * 100)}%)
                    </span>
                    <span className="text-emerald-700 font-semibold">
                      YES: {selectedNode.classCounts[1]} ({Math.round(selectedNode.probabilities[1] * 100)}%)
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                    Lớp dự đoán (Prediction):
                  </span>
                  <span
                    className={`text-xs font-extrabold uppercase mt-0.5 block ${
                      selectedNode.prediction === 'yes' ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {selectedNode.prediction === 'yes' ? 'YES (Tiềm năng)' : 'NO (Không tiềm năng)'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center">
                Chọn một nút trên cây để xem chi tiết
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Model Hyperparameters & Retraining Panel (Admin only as per Section 9) */}
      {isAdmin && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Hiệu chỉnh Siêu tham số & Huấn luyện lại (Admin Panel)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Chỉ Quản trị viên được phép thay đổi tham số và kích hoạt huấn luyện lại trên tập dữ liệu gốc.
              </p>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              Quyền Quản Trị
            </span>
          </div>

          <form onSubmit={handleRetrain} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs">
            {/* Criterion */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">criterion</label>
              <select
                value={retrainParams.criterion}
                onChange={(e) => setRetrainParams({ ...retrainParams, criterion: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900"
              >
                <option value="gini">gini</option>
                <option value="entropy">entropy</option>
                <option value="log_loss">log_loss</option>
              </select>
            </div>

            {/* max_depth */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">max_depth</label>
              <select
                value={retrainParams.maxDepth}
                onChange={(e) => setRetrainParams({ ...retrainParams, maxDepth: parseInt(e.target.value, 10) })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900"
              >
                <option value={3}>3 tầng</option>
                <option value={5}>5 tầng</option>
                <option value={6}>6 tầng (Mặc định)</option>
                <option value={7}>7 tầng</option>
                <option value={10}>10 tầng</option>
              </select>
            </div>

            {/* min_samples_split */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">min_samples_split</label>
              <select
                value={retrainParams.minSamplesSplit}
                onChange={(e) => setRetrainParams({ ...retrainParams, minSamplesSplit: parseInt(e.target.value, 10) })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900"
              >
                <option value={2}>2 mẫu</option>
                <option value={5}>5 mẫu</option>
                <option value={10}>10 mẫu</option>
                <option value={20}>20 mẫu</option>
              </select>
            </div>

            {/* min_samples_leaf */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">min_samples_leaf</label>
              <select
                value={retrainParams.minSamplesLeaf}
                onChange={(e) => setRetrainParams({ ...retrainParams, minSamplesLeaf: parseInt(e.target.value, 10) })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900"
              >
                <option value={1}>1 mẫu</option>
                <option value={2}>2 mẫu</option>
                <option value={5}>5 mẫu</option>
                <option value={10}>10 mẫu</option>
              </select>
            </div>

            {/* class_weight */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">class_weight</label>
              <select
                value={retrainParams.classWeight}
                onChange={(e) => setRetrainParams({ ...retrainParams, classWeight: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900"
              >
                <option value="none">none</option>
                <option value="balanced">balanced</option>
              </select>
            </div>

            <div className="sm:col-span-2 md:col-span-5 flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={isRetraining}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
                <span>{isRetraining ? 'Đang huấn luyện lại...' : 'Huấn luyện lại mô hình'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// Recursive Tree Node Item component
const TreeNodeItem: React.FC<{
  node: TreeNode;
  selectedNodeId?: number;
  onSelect: (node: TreeNode) => void;
  depth: number;
}> = ({ node, selectedNodeId, onSelect, depth }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const isSelected = selectedNodeId === node.id;

  return (
    <div className="text-xs">
      <div
        onClick={() => onSelect(node)}
        className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? 'bg-blue-600 text-white font-semibold shadow-xs'
            : 'hover:bg-slate-200/60 text-slate-800'
        }`}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
      >
        {!node.isLeaf ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 rounded hover:bg-black/10"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px] font-mono">●</span>
        )}

        <span className="font-mono text-[11px]">Node #{node.id}</span>
        {node.isLeaf ? (
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
              node.prediction === 'yes'
                ? isSelected ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                : isSelected ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'
            }`}
          >
            Leaf: {node.prediction} ({Math.round(node.probabilities[1] * 100)}% YES)
          </span>
        ) : (
          <span className="text-[11px] font-medium opacity-90 truncate max-w-xs">
            {node.splitDescription} ({node.samples} mẫu)
          </span>
        )}
      </div>

      {!node.isLeaf && isExpanded && (
        <div className="space-y-1 mt-1">
          {node.leftChild && (
            <TreeNodeItem
              node={node.leftChild}
              selectedNodeId={selectedNodeId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          )}
          {node.rightChild && (
            <TreeNodeItem
              node={node.rightChild}
              selectedNodeId={selectedNodeId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          )}
        </div>
      )}
    </div>
  );
};
