import { Router, Response } from 'express';
import { db, Customer } from '../db/database.ts';
import { AuthRequest, authMiddleware } from '../middleware/auth.ts';
import { CATEGORICAL_VALUES } from '../ml/decisionTree.ts';

export const customersRouter = Router();

customersRouter.use(authMiddleware);

// Validation helper
function validateCustomerInput(data: any): { valid: boolean; error?: string; cleanData?: any } {
  const age = Number(data.age);
  if (isNaN(age) || age < 18 || age > 110) {
    return { valid: false, error: 'Độ tuổi không hợp lệ (phải từ 18 đến 110).' };
  }

  const balance = Number(data.balance);
  if (isNaN(balance)) {
    return { valid: false, error: 'Số dư tài khoản phải là một số nguyên.' };
  }

  const day = Number(data.day);
  if (isNaN(day) || day < 1 || day > 31) {
    return { valid: false, error: 'Ngày liên hệ không hợp lệ (từ 1 đến 31).' };
  }

  const duration = Number(data.duration);
  if (isNaN(duration) || duration < 0) {
    return { valid: false, error: 'Thời lượng cuộc gọi phải là số nguyên không âm.' };
  }

  const campaign = Number(data.campaign);
  if (isNaN(campaign) || campaign < 1) {
    return { valid: false, error: 'Số lần liên hệ trong chiến dịch phải là số nguyên dương (≥ 1).' };
  }

  const pdays = Number(data.pdays);
  if (isNaN(pdays) || pdays < -1) {
    return { valid: false, error: 'Số ngày từ lần liên hệ trước không hợp lệ (≥ -1).' };
  }

  const previous = Number(data.previous);
  if (isNaN(previous) || previous < 0) {
    return { valid: false, error: 'Số lần liên hệ trước chiến dịch phải là số không âm (≥ 0).' };
  }

  // Validate categorical fields
  const job = String(data.job || '').toLowerCase().trim();
  if (!CATEGORICAL_VALUES.job.includes(job)) {
    return { valid: false, error: `Nghề nghiệp không hợp lệ (${job}).` };
  }

  const marital = String(data.marital || '').toLowerCase().trim();
  if (!CATEGORICAL_VALUES.marital.includes(marital)) {
    return { valid: false, error: `Tình trạng hôn nhân không hợp lệ (${marital}).` };
  }

  const education = String(data.education || '').toLowerCase().trim();
  if (!CATEGORICAL_VALUES.education.includes(education)) {
    return { valid: false, error: `Trình độ học vấn không hợp lệ (${education}).` };
  }

  const defaultVal = String(data.default || '').toLowerCase().trim();
  if (!['no', 'yes'].includes(defaultVal)) {
    return { valid: false, error: 'Trường nợ xấu (default) chỉ nhận giá trị yes hoặc no.' };
  }

  const housing = String(data.housing || '').toLowerCase().trim();
  if (!['no', 'yes'].includes(housing)) {
    return { valid: false, error: 'Trường vay mua nhà (housing) chỉ nhận giá trị yes hoặc no.' };
  }

  const loan = String(data.loan || '').toLowerCase().trim();
  if (!['no', 'yes'].includes(loan)) {
    return { valid: false, error: 'Trường vay cá nhân (loan) chỉ nhận giá trị yes hoặc no.' };
  }

  const contact = String(data.contact || '').toLowerCase().trim();
  if (!CATEGORICAL_VALUES.contact.includes(contact)) {
    return { valid: false, error: `Hình thức liên hệ không hợp lệ (${contact}).` };
  }

  const month = String(data.month || '').toLowerCase().trim();
  if (!CATEGORICAL_VALUES.month.includes(month)) {
    return { valid: false, error: `Tháng liên hệ không hợp lệ (${month}).` };
  }

  const poutcome = String(data.poutcome || '').toLowerCase().trim();
  if (!CATEGORICAL_VALUES.poutcome.includes(poutcome)) {
    return { valid: false, error: `Kết quả chiến dịch trước không hợp lệ (${poutcome}).` };
  }

  return {
    valid: true,
    cleanData: {
      age: Math.round(age),
      job,
      marital,
      education,
      default: defaultVal,
      balance: Math.round(balance),
      housing,
      loan,
      contact,
      day: Math.round(day),
      month,
      duration: Math.round(duration),
      campaign: Math.round(campaign),
      pdays: Math.round(pdays),
      previous: Math.round(previous),
      poutcome,
      depositActual: data.depositActual === 'yes' ? 'yes' : data.depositActual === 'no' ? 'no' : undefined,
    },
  };
}

// GET /api/customers
customersRouter.get('/', (req: AuthRequest, res: Response) => {
  const { search, job, ageGroup, deposit, limit, offset } = req.query;

  const result = db.getCustomers({
    search: search as string,
    job: job as string,
    ageGroup: ageGroup as string,
    deposit: deposit as string,
    limit: limit ? parseInt(limit as string, 10) : 50,
    offset: offset ? parseInt(offset as string, 10) : 0,
  });

  res.json(result);
});

// GET /api/customers/:id
customersRouter.get('/:id', (req: AuthRequest, res: Response) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Không tìm thấy thông tin khách hàng.' });
  }
  res.json({ customer });
});

// POST /api/customers
customersRouter.post('/', (req: AuthRequest, res: Response) => {
  const check = validateCustomerInput(req.body);
  if (!check.valid) {
    return res.status(400).json({ error: check.error });
  }

  const customer = db.createCustomer({
    ...check.cleanData,
    createdBy: req.user!.username,
  });

  db.logAction(
    req.user!.id,
    req.user!.fullName,
    'CUSTOMER_CREATED',
    'CUSTOMER',
    customer.id,
    req.ip || '127.0.0.1',
    `Thêm mới hồ sơ khách hàng ${customer.id}`
  );

  res.status(201).json({ customer, message: 'Thêm khách hàng thành công.' });
});

// PUT /api/customers/:id
customersRouter.put('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.getCustomerById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Không tìm thấy khách hàng để cập nhật.' });
  }

  const check = validateCustomerInput({ ...existing, ...req.body });
  if (!check.valid) {
    return res.status(400).json({ error: check.error });
  }

  const updated = db.updateCustomer(id, check.cleanData);
  db.logAction(
    req.user!.id,
    req.user!.fullName,
    'CUSTOMER_UPDATED',
    'CUSTOMER',
    id,
    req.ip || '127.0.0.1',
    `Cập nhật thông tin khách hàng ${id}`
  );

  res.json({ customer: updated, message: 'Cập nhật thông tin thành công.' });
});

// DELETE /api/customers/:id
customersRouter.delete('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  // Role check: Only admin can delete customer profiles
  if (req.user!.role !== 'admin') {
    return res.status(403).json({
      error: 'Chỉ Quản trị viên (Admin) mới có quyền xóa dữ liệu khách hàng.',
    });
  }

  const deleted = db.deleteCustomer(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Không tìm thấy khách hàng.' });
  }

  db.logAction(
    req.user!.id,
    req.user!.fullName,
    'CUSTOMER_DELETED',
    'CUSTOMER',
    id,
    req.ip || '127.0.0.1',
    `Xóa hồ sơ khách hàng ${id}`
  );

  res.json({ message: 'Xóa hồ sơ khách hàng thành công.' });
});

// POST /api/customers/import
customersRouter.post('/import', (req: AuthRequest, res: Response) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Dữ liệu tải lên trống hoặc không đúng định dạng danh sách.' });
  }

  const validItems: any[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const check = validateCustomerInput(rows[i]);
    if (check.valid) {
      validItems.push({
        ...check.cleanData,
        createdBy: req.user!.username,
      });
    } else {
      errors.push(`Dòng ${i + 1}: ${check.error}`);
    }
  }

  if (validItems.length > 0) {
    const insertedCount = db.batchInsertCustomers(validItems);
    db.logAction(
      req.user!.id,
      req.user!.fullName,
      'CUSTOMERS_IMPORTED',
      'CUSTOMER',
      `COUNT_${insertedCount}`,
      req.ip || '127.0.0.1',
      `Nhập thành công ${insertedCount} khách hàng từ tệp CSV.`
    );
    res.json({
      message: `Đã nhập thành công ${insertedCount} bản ghi khách hàng.`,
      inserted: insertedCount,
      errors: errors.slice(0, 10), // return up to 10 sample errors if any
    });
  } else {
    res.status(400).json({
      error: 'Không có bản ghi nào hợp lệ để nhập.',
      errors: errors.slice(0, 10),
    });
  }
});

// GET /api/customers/export
customersRouter.get('/export', (req: AuthRequest, res: Response) => {
  const { items } = db.getCustomers({ limit: 5000 });
  const headers = [
    'id',
    'age',
    'job',
    'marital',
    'education',
    'default',
    'balance',
    'housing',
    'loan',
    'contact',
    'day',
    'month',
    'duration',
    'campaign',
    'pdays',
    'previous',
    'poutcome',
    'depositActual',
    'createdAt',
  ];

  let csvContent = headers.join(',') + '\n';
  for (const item of items) {
    const row = [
      item.id,
      item.age,
      item.job,
      item.marital,
      item.education,
      item.default,
      item.balance,
      item.housing,
      item.loan,
      item.contact,
      item.day,
      item.month,
      item.duration,
      item.campaign,
      item.pdays,
      item.previous,
      item.poutcome,
      item.depositActual || '',
      item.createdAt,
    ];
    csvContent += row.join(',') + '\n';
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=customers_export.csv');
  res.send(csvContent);
});
