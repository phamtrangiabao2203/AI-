import {
  User,
  Customer,
  CustomerInput,
  PredictionRecord,
  BusinessInterpretation,
  ModelMetadata,
  FeatureImportance,
  TreeNode,
  DashboardSummary,
  AuditLog,
  SystemSettings,
} from '../types';

function getToken(): string | null {
  return localStorage.getItem('bank_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('bank_token');
      localStorage.removeItem('bank_user');
      window.dispatchEvent(new Event('bank_auth_expired'));
    }
    throw new Error(data.error || `Lỗi yêu cầu máy chủ: ${res.statusText}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ token: string; user: User; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  quickSwitch: (role: 'admin' | 'staff') =>
    request<{ token: string; user: User; message: string }>('/api/auth/quick-switch', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  logout: () =>
    request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  changePassword: (oldPassword: string, newPassword: string) =>
    request<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  // Users
  getUsers: () => request<{ users: User[] }>('/api/users'),

  createUser: (data: any) =>
    request<{ user: User; message: string }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id: string, data: any) =>
    request<{ user: User; message: string }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleUserStatus: (id: string) =>
    request<{ user: User; message: string }>(`/api/users/${id}/toggle-status`, {
      method: 'POST',
    }),

  deleteUser: (id: string) =>
    request<{ message: string }>(`/api/users/${id}`, {
      method: 'DELETE',
    }),

  // Customers
  getCustomers: (params?: {
    search?: string;
    job?: string;
    ageGroup?: string;
    deposit?: string;
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.job) query.set('job', params.job);
    if (params?.ageGroup) query.set('ageGroup', params.ageGroup);
    if (params?.deposit) query.set('deposit', params.deposit);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    return request<{ items: Customer[]; total: number }>(`/api/customers?${query.toString()}`);
  },

  getCustomerById: (id: string) =>
    request<{ customer: Customer }>(`/api/customers/${id}`),

  createCustomer: (data: CustomerInput) =>
    request<{ customer: Customer; message: string }>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCustomer: (id: string, data: Partial<CustomerInput>) =>
    request<{ customer: Customer; message: string }>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCustomer: (id: string) =>
    request<{ message: string }>(`/api/customers/${id}`, {
      method: 'DELETE',
    }),

  importCustomers: (rows: CustomerInput[]) =>
    request<{ message: string; inserted: number; errors: string[] }>('/api/customers/import', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    }),

  // Prediction
  predict: (data: CustomerInput & { customerId?: string }) =>
    request<{
      predictionRecord: PredictionRecord;
      result: {
        prediction: 'yes' | 'no';
        probabilityYes: number;
        probabilityNo: number;
        leafNodeId: number;
        decisionPath: string[];
        modelVersion: string;
        timestamp: string;
        customerId: string;
      };
      interpretation: BusinessInterpretation;
    }>('/api/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPredictions: (params?: {
    search?: string;
    prediction?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.prediction) query.set('prediction', params.prediction);
    if (params?.userId) query.set('userId', params.userId);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    return request<{ items: PredictionRecord[]; total: number }>(
      `/api/predict?${query.toString()}`
    );
  },

  getPredictionById: (id: string) =>
    request<{ prediction: PredictionRecord; interpretation: BusinessInterpretation }>(
      `/api/predict/${id}`
    ),

  // Dashboard
  getDashboardSummary: (params?: {
    timeRange?: string;
    userId?: string;
    label?: string;
    ageGroup?: string;
    job?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.timeRange) query.set('timeRange', params.timeRange);
    if (params?.userId) query.set('userId', params.userId);
    if (params?.label) query.set('label', params.label);
    if (params?.ageGroup) query.set('ageGroup', params.ageGroup);
    if (params?.job) query.set('job', params.job);
    return request<DashboardSummary>(`/api/dashboard/summary?${query.toString()}`);
  },

  // Model
  getModelInfo: () =>
    request<{
      metadata: ModelMetadata;
      activeRegistry?: any;
      registryHistory: any[];
    }>('/api/model/info'),

  getFeatureImportance: () =>
    request<{ featureImportances: FeatureImportance[] }>('/api/model/feature-importance'),

  getTreeNodes: () =>
    request<{ tree: TreeNode }>('/api/model/tree-nodes'),

  retrainModel: (hyperparameters: {
    criterion: string;
    maxDepth: number;
    minSamplesSplit: number;
    minSamplesLeaf: number;
    classWeight: string;
  }) =>
    request<{ message: string; metadata: ModelMetadata }>('/api/model/retrain', {
      method: 'POST',
      body: JSON.stringify(hyperparameters),
    }),

  // Audit Logs
  getAuditLogs: (limit = 100) =>
    request<{ logs: AuditLog[] }>(`/api/audit-logs?limit=${limit}`),

  // Settings
  getSettings: () => request<{ settings: SystemSettings }>('/api/settings'),

  updateSettings: (settings: Partial<SystemSettings>) =>
    request<{ settings: SystemSettings; message: string }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};
