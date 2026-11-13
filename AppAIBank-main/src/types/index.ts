export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: 'admin' | 'staff';
  status: 'active' | 'locked';
  createdAt: string;
  lastLogin?: string;
}

export interface CustomerInput {
  age: number;
  job: string;
  marital: string;
  education: string;
  default: string;
  balance: number;
  housing: string;
  loan: string;
  contact: string;
  day: number;
  month: string;
  duration: number;
  campaign: number;
  pdays: number;
  previous: number;
  poutcome: string;
}

export interface Customer extends CustomerInput {
  id: string;
  createdAt: string;
  createdBy: string;
  depositActual?: 'yes' | 'no';
}

export interface PredictionRecord {
  id: string;
  customerId: string;
  customerData: CustomerInput;
  prediction: 'yes' | 'no';
  probabilityYes: number;
  probabilityNo: number;
  modelVersion: string;
  userId: string;
  userName: string;
  leafNodeId: number;
  decisionPath: string[];
  createdAt: string;
}

export interface BusinessInterpretation {
  standardText: string;
  confidenceTier: 'Rất cao' | 'Tương đối cao' | 'Chưa rõ ràng' | 'Thấp';
  badgeColor: 'green' | 'blue' | 'amber' | 'red';
  actionPriority: 'Ưu tiên cao' | 'Ưu tiên trung bình' | 'Cân nhắc tiếp cận' | 'Không ưu tiên';
  businessAdvice: string;
  disclaimer: string;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: {
    trueNegative: number;
    falsePositive: number;
    falseNegative: number;
    truePositive: number;
  };
  classificationReport: {
    no: { precision: number; recall: number; f1Score: number; support: number };
    yes: { precision: number; recall: number; f1Score: number; support: number };
    macroAvg: { precision: number; recall: number; f1Score: number; support: number };
    weightedAvg: { precision: number; recall: number; f1Score: number; support: number };
  };
  trainSamples: number;
  testSamples: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  percentage: number;
}

export interface TreeNode {
  id: number;
  isLeaf: boolean;
  featureIndex?: number;
  featureName?: string;
  threshold?: number;
  criterionValue?: number;
  samples: number;
  classCounts: [number, number];
  probabilities: [number, number];
  prediction: 'yes' | 'no';
  leftChild?: TreeNode;
  rightChild?: TreeNode;
  splitDescription?: string;
}

export interface ModelMetadata {
  modelName: string;
  modelVersion: string;
  modelType: string;
  datasetName: string;
  targetVariable: string;
  hyperparameters: {
    criterion: 'gini' | 'entropy' | 'log_loss';
    maxDepth: number;
    minSamplesSplit: number;
    minSamplesLeaf: number;
    classWeight: 'none' | 'balanced';
  };
  metrics: ModelMetrics;
  featureImportances: FeatureImportance[];
  trainedAt: string;
  featureNames: string[];
}

export interface DashboardSummary {
  kpis: {
    totalCustomers: number;
    totalPredictions: number;
    yesPredictions: number;
    noPredictions: number;
    yesRate: number;
    activeUsersCount: number;
  };
  charts: {
    pieData: { name: string; value: number; color: string }[];
    timeTrends: { date: string; total: number; yes: number; no: number; yesRate: number }[];
    jobDistribution: { job: string; yes: number; no: number; total: number }[];
    ageDistribution: { label: string; min: number; max: number; yes: number; no: number }[];
    loanDistribution: { category: string; yes: number; no: number }[];
    confidenceDistribution: { range: string; min: number; max: number; count: number }[];
  };
  recentPredictions: Array<{
    id: string;
    customerId: string;
    age: number;
    job: string;
    prediction: 'yes' | 'no';
    probabilityYes: number;
    probabilityNo: number;
    userName: string;
    createdAt: string;
  }>;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress: string;
  details?: string;
  createdAt: string;
}

export interface SystemSettings {
  thresholdHigh: number;
  thresholdMedium: number;
  thresholdLow: number;
  sessionTimeoutMinutes: number;
  bankName: string;
}
