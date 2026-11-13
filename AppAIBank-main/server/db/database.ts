import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { CustomerInput, BankRecord } from '../ml/decisionTree.ts';
import { parseCsv } from '../ml/train.ts';

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'staff';
  status: 'active' | 'locked';
  createdAt: string;
  lastLogin?: string;
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

export interface ModelRegistryRecord {
  id: string;
  modelName: string;
  modelVersion: string;
  modelPath: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  parameters: any;
  trainingDate: string;
  status: 'active' | 'archived';
  trainedBy?: string;
}

export interface AuditLogRecord {
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
  thresholdHigh: number; // default 80
  thresholdMedium: number; // default 60
  thresholdLow: number; // default 40
  sessionTimeoutMinutes: number; // default 30
  bankName: string;
}

interface DatabaseSchema {
  users: User[];
  customers: Customer[];
  predictions: PredictionRecord[];
  modelRegistry: ModelRegistryRecord[];
  auditLogs: AuditLogRecord[];
  settings: SystemSettings;
}

export function hashPassword(password: string): string {
  const salt = 'bank_marketing_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
}

export class BankDatabase {
  private dbPath: string;
  private data: DatabaseSchema;

  constructor(filePath?: string) {
    this.dbPath = filePath || path.resolve(process.cwd(), 'data/bank_system_db.json');
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error loading DB file, initializing fresh:', err);
      }
    }

    const initial = this.seedInitialData();
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DatabaseSchema) {
    const d = dataToSave || this.data;
    const tempPath = `${this.dbPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(d, null, 2), 'utf-8');
    fs.renameSync(tempPath, this.dbPath);
  }

  private seedInitialData(): DatabaseSchema {
    const now = new Date();

    // Default users
    const users: User[] = [
      {
        id: 'USR-001',
        fullName: 'Nguyễn Văn Quản Trị (Admin)',
        username: 'admin',
        email: 'admin@digitalbank.vn',
        passwordHash: hashPassword('Admin@Bank2026'),
        role: 'admin',
        status: 'active',
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        lastLogin: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: 'USR-002',
        fullName: 'Trần Thị Tiếp Thị (Staff)',
        username: 'staff01',
        email: 'tranthi@digitalbank.vn',
        passwordHash: hashPassword('Staff@Bank2026'),
        role: 'staff',
        status: 'active',
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        lastLogin: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: 'USR-003',
        fullName: 'Lê Hoàng Nam (Staff)',
        username: 'staff02',
        email: 'namle@digitalbank.vn',
        passwordHash: hashPassword('Staff@Bank2026'),
        role: 'staff',
        status: 'active',
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        lastLogin: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
    ];

    // Seed customers from bank.csv (e.g. first 60 records)
    const customers: Customer[] = [];
    const csvPath = path.resolve(process.cwd(), 'data/bank.csv');
    if (fs.existsSync(csvPath)) {
      try {
        const rawRecords = parseCsv(csvPath);
        const seedCount = Math.min(80, rawRecords.length);
        for (let i = 0; i < seedCount; i++) {
          const r = rawRecords[i];
          const daysAgo = Math.floor(Math.random() * 25);
          customers.push({
            id: `CUST-${String(i + 1).padStart(5, '0')}`,
            age: r.age,
            job: r.job,
            marital: r.marital,
            education: r.education,
            default: r.default,
            balance: r.balance,
            housing: r.housing,
            loan: r.loan,
            contact: r.contact,
            day: r.day,
            month: r.month,
            duration: r.duration,
            campaign: r.campaign,
            pdays: r.pdays,
            previous: r.previous,
            poutcome: r.poutcome,
            depositActual: r.deposit,
            createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
            createdBy: 'system_import',
          });
        }
      } catch (err) {
        console.error('Failed reading bank.csv for seed:', err);
      }
    }

    // Seed predictions for the seeded customers to populate analytics
    const predictions: PredictionRecord[] = [];
    const sampleStaff = [users[0], users[1], users[2]];

    for (let i = 0; i < Math.min(customers.length, 50); i++) {
      const c = customers[i];
      const staff = sampleStaff[i % sampleStaff.length];
      const isYes = c.depositActual === 'yes';
      const probYes = isYes
        ? Number((75 + Math.random() * 23).toFixed(2))
        : Number((5 + Math.random() * 30).toFixed(2));
      const probNo = Number((100 - probYes).toFixed(2));
      const predTime = new Date(Date.now() - Math.floor(Math.random() * 20) * 86400000 - Math.floor(Math.random() * 3600000));

      predictions.push({
        id: `PRED-${String(i + 1).padStart(6, '0')}`,
        customerId: c.id,
        customerData: {
          age: c.age,
          job: c.job,
          marital: c.marital,
          education: c.education,
          default: c.default,
          balance: c.balance,
          housing: c.housing,
          loan: c.loan,
          contact: c.contact,
          day: c.day,
          month: c.month,
          duration: c.duration,
          campaign: c.campaign,
          pdays: c.pdays,
          previous: c.previous,
          poutcome: c.poutcome,
        },
        prediction: probYes >= 50 ? 'yes' : 'no',
        probabilityYes: probYes,
        probabilityNo: probNo,
        modelVersion: 'v1.0.0',
        userId: staff.id,
        userName: staff.fullName,
        leafNodeId: Math.floor(Math.random() * 50) + 1,
        decisionPath: [
          `duration (${c.duration}) ${c.duration > 200 ? '>' : '≤'} 205`,
          `housing_no (${c.housing === 'no' ? 1 : 0}) ${c.housing === 'no' ? '>' : '≤'} 0.5`,
          `poutcome_success (${c.poutcome === 'success' ? 1 : 0}) ${c.poutcome === 'success' ? '>' : '≤'} 0.5`,
        ],
        createdAt: predTime.toISOString(),
      });
    }

    // Model Registry initial
    const modelRegistry: ModelRegistryRecord[] = [
      {
        id: 'MOD-001',
        modelName: 'DecisionTreeClassifier',
        modelVersion: 'v1.0.0',
        modelPath: 'data/decision_tree_bank_model.json',
        accuracy: 80.12,
        precision: 78.37,
        recall: 80.15,
        f1Score: 79.25,
        parameters: {
          criterion: 'gini',
          maxDepth: 6,
          minSamplesSplit: 10,
          minSamplesLeaf: 5,
          classWeight: 'none',
        },
        trainingDate: new Date(Date.now() - 5 * 86400000).toISOString(),
        status: 'active',
        trainedBy: 'admin',
      },
    ];

    // Audit logs
    const auditLogs: AuditLogRecord[] = [
      {
        id: 'LOG-001',
        userId: 'USR-001',
        userName: 'Nguyễn Văn Quản Trị (Admin)',
        action: 'SYSTEM_INITIALIZATION',
        entity: 'SYSTEM',
        entityId: 'SYS',
        ipAddress: '127.0.0.1',
        details: 'Khởi tạo hệ thống AI Bank Marketing và nạp dữ liệu ban đầu.',
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'LOG-002',
        userId: 'USR-001',
        userName: 'Nguyễn Văn Quản Trị (Admin)',
        action: 'MODEL_TRAIN_SUCCESS',
        entity: 'MODEL',
        entityId: 'v1.0.0',
        ipAddress: '127.0.0.1',
        details: 'Huấn luyện thành công Decision Tree v1.0.0 với F1-score 79.25%.',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ];

    const settings: SystemSettings = {
      thresholdHigh: 80,
      thresholdMedium: 60,
      thresholdLow: 40,
      sessionTimeoutMinutes: 30,
      bankName: 'Digital AI Commercial Bank',
    };

    return {
      users,
      customers,
      predictions,
      modelRegistry,
      auditLogs,
      settings,
    };
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.data.users.map((u) => {
      const { passwordHash, ...rest } = u;
      return rest as any;
    });
  }

  public getUserByUsername(username: string): User | undefined {
    return this.data.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()
    );
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const id = `USR-${String(this.data.users.length + 1).padStart(3, '0')}`;
    const newUser: User = {
      ...userData,
      id,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  public deleteUser(id: string): boolean {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    this.data.users.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Customers ---
  public getCustomers(filters?: {
    search?: string;
    job?: string;
    ageGroup?: string;
    deposit?: string;
    limit?: number;
    offset?: number;
  }): { items: Customer[]; total: number } {
    let list = [...this.data.customers];

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      list = list.filter((c) => c.id.toLowerCase().includes(s) || c.job.toLowerCase().includes(s));
    }

    if (filters?.job && filters.job !== 'all') {
      list = list.filter((c) => c.job === filters.job);
    }

    if (filters?.deposit && filters.deposit !== 'all') {
      list = list.filter((c) => c.depositActual === filters.deposit);
    }

    if (filters?.ageGroup && filters.ageGroup !== 'all') {
      list = list.filter((c) => {
        const a = c.age;
        if (filters.ageGroup === '<30') return a < 30;
        if (filters.ageGroup === '30-39') return a >= 30 && a <= 39;
        if (filters.ageGroup === '40-49') return a >= 40 && a <= 49;
        if (filters.ageGroup === '50-59') return a >= 50 && a <= 59;
        if (filters.ageGroup === '60+') return a >= 60;
        return true;
      });
    }

    const total = list.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;
    const items = list.slice(offset, offset + limit);

    return { items, total };
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.data.customers.find((c) => c.id === id);
  }

  public createCustomer(cust: Omit<Customer, 'id' | 'createdAt'>): Customer {
    const id = `CUST-${String(this.data.customers.length + 1).padStart(5, '0')}`;
    const newCust: Customer = {
      ...cust,
      id,
      createdAt: new Date().toISOString(),
    };
    this.data.customers.unshift(newCust);
    this.save();
    return newCust;
  }

  public updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const idx = this.data.customers.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.data.customers[idx] = { ...this.data.customers[idx], ...updates };
    this.save();
    return this.data.customers[idx];
  }

  public deleteCustomer(id: string): boolean {
    const idx = this.data.customers.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.data.customers.splice(idx, 1);
    this.save();
    return true;
  }

  public batchInsertCustomers(customers: Array<Omit<Customer, 'id' | 'createdAt'>>): number {
    let added = 0;
    for (const c of customers) {
      const id = `CUST-${String(this.data.customers.length + 1).padStart(5, '0')}`;
      this.data.customers.unshift({
        ...c,
        id,
        createdAt: new Date().toISOString(),
      });
      added++;
    }
    this.save();
    return added;
  }

  // --- Predictions ---
  public getPredictions(filters?: {
    search?: string;
    prediction?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): { items: PredictionRecord[]; total: number } {
    let list = [...this.data.predictions];

    // sort newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.id.toLowerCase().includes(s) ||
          p.customerId.toLowerCase().includes(s) ||
          p.userName.toLowerCase().includes(s)
      );
    }

    if (filters?.prediction && filters.prediction !== 'all') {
      list = list.filter((p) => p.prediction === filters.prediction);
    }

    if (filters?.userId && filters.userId !== 'all') {
      list = list.filter((p) => p.userId === filters.userId);
    }

    if (filters?.startDate) {
      const start = new Date(filters.startDate).getTime();
      list = list.filter((p) => new Date(p.createdAt).getTime() >= start);
    }

    if (filters?.endDate) {
      const end = new Date(filters.endDate).getTime();
      list = list.filter((p) => new Date(p.createdAt).getTime() <= end);
    }

    const total = list.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;
    const items = list.slice(offset, offset + limit);

    return { items, total };
  }

  public getPredictionById(id: string): PredictionRecord | undefined {
    return this.data.predictions.find((p) => p.id === id);
  }

  public createPrediction(
    pred: Omit<PredictionRecord, 'id' | 'createdAt'>
  ): PredictionRecord {
    const id = `PRED-${String(this.data.predictions.length + 1).padStart(6, '0')}`;
    const newPred: PredictionRecord = {
      ...pred,
      id,
      createdAt: new Date().toISOString(),
    };
    this.data.predictions.unshift(newPred);
    this.save();
    return newPred;
  }

  // --- Model Registry ---
  public getModelRegistry(): ModelRegistryRecord[] {
    return this.data.modelRegistry;
  }

  public getActiveModel(): ModelRegistryRecord | undefined {
    return this.data.modelRegistry.find((m) => m.status === 'active');
  }

  public registerModel(model: Omit<ModelRegistryRecord, 'id'>): ModelRegistryRecord {
    const id = `MOD-${String(this.data.modelRegistry.length + 1).padStart(3, '0')}`;
    if (model.status === 'active') {
      this.data.modelRegistry.forEach((m) => (m.status = 'archived'));
    }
    const record: ModelRegistryRecord = { ...model, id };
    this.data.modelRegistry.unshift(record);
    this.save();
    return record;
  }

  // --- Audit Logs ---
  public getAuditLogs(limit = 100): AuditLogRecord[] {
    return this.data.auditLogs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  public logAction(
    userId: string,
    userName: string,
    action: string,
    entity: string,
    entityId?: string,
    ipAddress = '127.0.0.1',
    details?: string
  ): AuditLogRecord {
    const id = `LOG-${String(this.data.auditLogs.length + 1).padStart(5, '0')}`;
    const log: AuditLogRecord = {
      id,
      userId,
      userName,
      action,
      entity,
      entityId,
      ipAddress,
      details,
      createdAt: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    // Keep max 1000 logs in storage
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs.pop();
    }
    this.save();
    return log;
  }

  // --- Settings ---
  public getSettings(): SystemSettings {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<SystemSettings>): SystemSettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
    return this.data.settings;
  }
}

// Singleton database instance
export const db = new BankDatabase();
