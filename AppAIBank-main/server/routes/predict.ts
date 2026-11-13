import { Router, Response } from 'express';
import { db, PredictionRecord } from '../db/database.ts';
import { AuthRequest, authMiddleware } from '../middleware/auth.ts';
import { modelService } from '../ml/modelService.ts';
import { CustomerInput, CATEGORICAL_VALUES } from '../ml/decisionTree.ts';

export const predictRouter = Router();

predictRouter.use(authMiddleware);

// Validation helper
function validateInput(data: any): { valid: boolean; error?: string; cleanData?: CustomerInput } {
  const age = Number(data.age);
  if (isNaN(age) || age < 18 || age > 110) {
    return { valid: false, error: 'Độ tuổi không hợp lệ (phải từ 18 đến 110).' };
  }

  const balance = Number(data.balance);
  if (isNaN(balance)) {
    return { valid: false, error: 'Số dư tài khoản phải là số hợp lệ.' };
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
    return { valid: false, error: 'Số lần liên hệ chiến dịch phải là số nguyên dương (≥ 1).' };
  }

  const pdays = Number(data.pdays);
  if (isNaN(pdays) || pdays < -1) {
    return { valid: false, error: 'Số ngày từ lần liên hệ trước không hợp lệ (≥ -1).' };
  }

  const previous = Number(data.previous);
  if (isNaN(previous) || previous < 0) {
    return { valid: false, error: 'Số lần liên hệ trước chiến dịch phải là số không âm (≥ 0).' };
  }

  const job = String(data.job || '').toLowerCase().trim();
  if (!CATEGORICAL_VALUES.job.includes(job)) {
    return { valid: false, error: `Nghề nghiệp không hợp lệ: ${job}` };
  }

  const marital = String(data.marital || '').toLowerCase().trim();
  if (!CATEGORICAL_VALUES.marital.includes(marital)) {
    return { valid: false, error: `Tình trạng hôn nhân không hợp lệ: ${marital}` };
  }

  const education = String(data.education || '').toLowerCase().trim();
  if (!CATEGORICAL_VALUES.education.includes(education)) {
    return { valid: false, error: `Trình độ học vấn không hợp lệ: ${education}` };
  }

  const defaultVal = String(data.default || '').toLowerCase().trim();
  const housing = String(data.housing || '').toLowerCase().trim();
  const loan = String(data.loan || '').toLowerCase().trim();
  const contact = String(data.contact || '').toLowerCase().trim();
  const month = String(data.month || '').toLowerCase().trim();
  const poutcome = String(data.poutcome || '').toLowerCase().trim();

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
    },
  };
}

// Generate banking business interpretation based on probability and settings
export function generateBusinessInterpretation(
  prediction: 'yes' | 'no',
  probYes: number,
  settings = db.getSettings()
) {
  let confidenceTier: 'Rất cao' | 'Tương đối cao' | 'Chưa rõ ràng' | 'Thấp';
  let badgeColor: 'green' | 'blue' | 'amber' | 'red';
  let businessAdvice: string;
  let actionPriority: 'Ưu tiên cao' | 'Ưu tiên trung bình' | 'Cân nhắc tiếp cận' | 'Không ưu tiên';

  if (probYes >= settings.thresholdHigh) {
    confidenceTier = 'Rất cao';
    badgeColor = 'green';
    actionPriority = 'Ưu tiên cao';
    businessAdvice =
      'Khách hàng thuộc nhóm mục tiêu tiềm năng hàng đầu với khả năng chuyển đổi rất cao. Khuyến nghị cán bộ tín dụng / tiếp thị ưu tiên gọi điện trực tiếp hoặc gửi thư mời VIP, giới thiệu các gói chứng chỉ tiền gửi lãi suất ưu đãi, kỳ hạn 6-12 tháng, nhấn mạnh tính an toàn và tiện ích quản lý vốn.';
  } else if (probYes >= settings.thresholdMedium) {
    confidenceTier = 'Tương đối cao';
    badgeColor = 'blue';
    actionPriority = 'Ưu tiên trung bình';
    businessAdvice =
      'Khách hàng có triển vọng tốt để tham gia sản phẩm tiền gửi có kỳ hạn. Nên tiếp cận bằng thông điệp tiếp thị đa kênh (SMS, Email, ứng dụng ngân hàng số), phân tích thêm mục tiêu tài chính và tư vấn kỳ hạn linh hoạt phù hợp với chu kỳ dòng tiền.';
  } else if (probYes >= settings.thresholdLow) {
    confidenceTier = 'Chưa rõ ràng';
    badgeColor = 'amber';
    actionPriority = 'Cân nhắc tiếp cận';
    businessAdvice =
      'Tỷ lệ chuyển đổi ở mức trung bình, tín hiệu quan tâm chưa rõ rệt. Khuyến nghị không gọi điện dồn dập tránh gây phiền hà; thay vào đó, gửi bản tin tài chính hoặc khảo sát nhu cầu ngắn hạn để kích hoạt sự quan tâm.';
  } else {
    confidenceTier = 'Thấp';
    badgeColor = 'red';
    actionPriority = 'Không ưu tiên';
    businessAdvice =
      'Mô hình dự đoán khách hàng khó có khả năng đăng ký tiền gửi có kỳ hạn trong đợt tiếp thị này. Nên tạm hoãn liên hệ trực tiếp để tiết kiệm chi phí chiến dịch, chuyển sang nuôi dưỡng khách hàng bằng các dịch vụ thanh toán hoặc tài khoản thông thường.';
  }

  const standardText =
    prediction === 'yes'
      ? 'Mô hình dự đoán khách hàng có khả năng đăng ký tiền gửi có kỳ hạn. Nhân viên ngân hàng có thể ưu tiên đưa khách hàng vào danh sách tiếp cận, tư vấn sản phẩm tiết kiệm phù hợp và cung cấp thông tin về lãi suất, kỳ hạn và lợi ích của tiền gửi.'
      : 'Mô hình dự đoán khách hàng có khả năng chưa đăng ký tiền gửi có kỳ hạn. Ngân hàng có thể xem xét chiến lược tiếp thị phù hợp hơn, tìm hiểu nhu cầu tài chính và lựa chọn thời điểm tiếp cận khác.';

  return {
    standardText,
    confidenceTier,
    badgeColor,
    actionPriority,
    businessAdvice,
    disclaimer:
      'Lưu ý: Kết quả trên là dự đoán hỗ trợ ra quyết định tiếp thị từ thuật toán Decision Tree, không bảo đảm chắc chắn khách hàng sẽ đăng ký sản phẩm.',
  };
}

// POST /api/predict
predictRouter.post('/', (req: AuthRequest, res: Response) => {
  const check = validateInput(req.body);
  if (!check.valid) {
    return res.status(400).json({ error: check.error });
  }

  const customerData = check.cleanData!;
  const metadata = modelService.getMetadata();

  try {
    const result = modelService.predict(customerData);
    const interpretation = generateBusinessInterpretation(result.prediction, result.probabilityYes);

    // If customerId is provided, link to customer; otherwise generate or find
    let customerId = req.body.customerId;
    if (!customerId) {
      // Check if we should create a record in customers table
      const newCust = db.createCustomer({
        ...customerData,
        createdBy: req.user!.username,
      });
      customerId = newCust.id;
    }

    // Save prediction record into database
    const saved = db.createPrediction({
      customerId,
      customerData,
      prediction: result.prediction,
      probabilityYes: result.probabilityYes,
      probabilityNo: result.probabilityNo,
      modelVersion: metadata.modelVersion,
      userId: req.user!.id,
      userName: req.user!.fullName,
      leafNodeId: result.leafNodeId,
      decisionPath: result.decisionPath,
    });

    db.logAction(
      req.user!.id,
      req.user!.fullName,
      'PREDICTION_PERFORMED',
      'PREDICTION',
      saved.id,
      req.ip || '127.0.0.1',
      `Dự đoán khách hàng ${customerId}: Kết quả ${result.prediction.toUpperCase()} (Xác suất YES: ${result.probabilityYes}%)`
    );

    res.json({
      predictionRecord: saved,
      result: {
        prediction: result.prediction,
        probabilityYes: result.probabilityYes,
        probabilityNo: result.probabilityNo,
        leafNodeId: result.leafNodeId,
        decisionPath: result.decisionPath,
        modelVersion: metadata.modelVersion,
        timestamp: saved.createdAt,
        customerId,
      },
      interpretation,
    });
  } catch (err: any) {
    console.error('Prediction error:', err);
    res.status(500).json({ error: err.message || 'Lỗi khi thực hiện dự đoán.' });
  }
});

// POST /api/predict/batch
predictRouter.post('/batch', (req: AuthRequest, res: Response) => {
  const { customers } = req.body;
  if (!Array.isArray(customers) || customers.length === 0) {
    return res.status(400).json({ error: 'Danh sách hồ sơ khách hàng không hợp lệ.' });
  }

  const metadata = modelService.getMetadata();
  const results: any[] = [];

  for (let i = 0; i < customers.length; i++) {
    const check = validateInput(customers[i]);
    if (check.valid) {
      const pred = modelService.predict(check.cleanData!);
      const custId = customers[i].customerId || `CUST-BATCH-${i + 1}`;
      const saved = db.createPrediction({
        customerId: custId,
        customerData: check.cleanData!,
        prediction: pred.prediction,
        probabilityYes: pred.probabilityYes,
        probabilityNo: pred.probabilityNo,
        modelVersion: metadata.modelVersion,
        userId: req.user!.id,
        userName: req.user!.fullName,
        leafNodeId: pred.leafNodeId,
        decisionPath: pred.decisionPath,
      });
      results.push(saved);
    }
  }

  db.logAction(
    req.user!.id,
    req.user!.fullName,
    'BATCH_PREDICTION_PERFORMED',
    'PREDICTION',
    `BATCH_${results.length}`,
    req.ip || '127.0.0.1',
    `Thực hiện dự đoán theo lô cho ${results.length} khách hàng.`
  );

  res.json({
    totalProcessed: results.length,
    predictions: results,
  });
});

// GET /api/predictions
predictRouter.get('/', (req: AuthRequest, res: Response) => {
  const { search, prediction, userId, startDate, endDate, limit, offset } = req.query;

  // Staff can only view their own predictions unless role is admin
  let queryUserId = userId as string;
  if (req.user!.role === 'staff' && !queryUserId) {
    queryUserId = req.user!.id;
  }

  const result = db.getPredictions({
    search: search as string,
    prediction: prediction as string,
    userId: queryUserId,
    startDate: startDate as string,
    endDate: endDate as string,
    limit: limit ? parseInt(limit as string, 10) : 50,
    offset: offset ? parseInt(offset as string, 10) : 0,
  });

  res.json(result);
});

// GET /api/predictions/:id
predictRouter.get('/:id', (req: AuthRequest, res: Response) => {
  const prediction = db.getPredictionById(req.params.id);
  if (!prediction) {
    return res.status(404).json({ error: 'Không tìm thấy kết quả dự đoán.' });
  }

  const interpretation = generateBusinessInterpretation(
    prediction.prediction,
    prediction.probabilityYes
  );

  res.json({ prediction, interpretation });
});

// GET /api/predictions/export
predictRouter.get('/export/csv', (req: AuthRequest, res: Response) => {
  const { items } = db.getPredictions({ limit: 5000 });
  const headers = [
    'predictionId',
    'customerId',
    'prediction',
    'probabilityYes',
    'probabilityNo',
    'age',
    'job',
    'balance',
    'duration',
    'campaign',
    'poutcome',
    'modelVersion',
    'staffName',
    'createdAt',
  ];

  let csvContent = headers.join(',') + '\n';
  for (const p of items) {
    const row = [
      p.id,
      p.customerId,
      p.prediction,
      p.probabilityYes,
      p.probabilityNo,
      p.customerData?.age || '',
      p.customerData?.job || '',
      p.customerData?.balance || '',
      p.customerData?.duration || '',
      p.customerData?.campaign || '',
      p.customerData?.poutcome || '',
      p.modelVersion,
      `"${p.userName}"`,
      p.createdAt,
    ];
    csvContent += row.join(',') + '\n';
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=prediction_history.csv');
  res.send(csvContent);
});
