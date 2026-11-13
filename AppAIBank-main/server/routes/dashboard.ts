import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { AuthRequest, authMiddleware } from '../middleware/auth.ts';

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);

dashboardRouter.get('/summary', (req: AuthRequest, res: Response) => {
  const { timeRange, userId, label, ageGroup, job } = req.query;

  // Retrieve base data from database
  const allCustomers = db.getCustomers({ limit: 10000 }).items;
  const allPredictions = db.getPredictions({ limit: 10000 }).items;
  const activeUsersCount = db.getUsers().filter((u) => u.status === 'active').length;

  // Apply filters to predictions
  let filtered = [...allPredictions];

  if (userId && userId !== 'all') {
    filtered = filtered.filter((p) => p.userId === userId);
  }

  if (label && label !== 'all') {
    filtered = filtered.filter((p) => p.prediction === label);
  }

  if (job && job !== 'all') {
    filtered = filtered.filter((p) => p.customerData?.job === job);
  }

  if (ageGroup && ageGroup !== 'all') {
    filtered = filtered.filter((p) => {
      const a = p.customerData?.age || 0;
      if (ageGroup === '<30') return a < 30;
      if (ageGroup === '30-39') return a >= 30 && a <= 39;
      if (ageGroup === '40-49') return a >= 40 && a <= 49;
      if (ageGroup === '50-59') return a >= 50 && a <= 59;
      if (ageGroup === '60+') return a >= 60;
      return true;
    });
  }

  if (timeRange && timeRange !== 'all') {
    const now = Date.now();
    const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    const cutoff = now - days * 86400000;
    filtered = filtered.filter((p) => new Date(p.createdAt).getTime() >= cutoff);
  }

  // 1. KPIs
  const totalCustomers = allCustomers.length;
  const totalPredictions = filtered.length;
  const yesPredictions = filtered.filter((p) => p.prediction === 'yes').length;
  const noPredictions = filtered.filter((p) => p.prediction === 'no').length;
  const yesRate = totalPredictions > 0 ? Number(((yesPredictions / totalPredictions) * 100).toFixed(2)) : 0;

  // 2. Pie Chart: YES vs NO
  const pieData = [
    { name: 'YES (Tiềm năng)', value: yesPredictions, color: '#16A34A' },
    { name: 'NO (Không tiềm năng)', value: noPredictions, color: '#DC2626' },
  ];

  // 3. Trends over time (group by day or week)
  const dateMap: Record<string, { total: number; yes: number; no: number }> = {};
  filtered.forEach((p) => {
    const d = new Date(p.createdAt).toISOString().split('T')[0];
    if (!dateMap[d]) dateMap[d] = { total: 0, yes: 0, no: 0 };
    dateMap[d].total++;
    if (p.prediction === 'yes') dateMap[d].yes++;
    else dateMap[d].no++;
  });

  const datesSorted = Object.keys(dateMap).sort();
  const timeTrends = datesSorted.map((d) => ({
    date: d.slice(5), // MM-DD
    total: dateMap[d].total,
    yes: dateMap[d].yes,
    no: dateMap[d].no,
    yesRate: dateMap[d].total > 0 ? Number(((dateMap[d].yes / dateMap[d].total) * 100).toFixed(1)) : 0,
  }));

  // 4. Distribution by Job
  const jobMap: Record<string, { yes: number; no: number }> = {};
  filtered.forEach((p) => {
    const j = p.customerData?.job || 'unknown';
    if (!jobMap[j]) jobMap[j] = { yes: 0, no: 0 };
    if (p.prediction === 'yes') jobMap[j].yes++;
    else jobMap[j].no++;
  });

  const jobDistribution = Object.keys(jobMap).map((j) => ({
    job: j,
    yes: jobMap[j].yes,
    no: jobMap[j].no,
    total: jobMap[j].yes + jobMap[j].no,
  })).sort((a, b) => b.total - a.total).slice(0, 8); // Top 8 jobs

  // 5. Distribution by Age Groups
  const ageBuckets = [
    { label: '<30', min: 0, max: 29, yes: 0, no: 0 },
    { label: '30-39', min: 30, max: 39, yes: 0, no: 0 },
    { label: '40-49', min: 40, max: 49, yes: 0, no: 0 },
    { label: '50-59', min: 50, max: 59, yes: 0, no: 0 },
    { label: '60+', min: 60, max: 150, yes: 0, no: 0 },
  ];

  filtered.forEach((p) => {
    const a = p.customerData?.age || 0;
    const bucket = ageBuckets.find((b) => a >= b.min && a <= b.max);
    if (bucket) {
      if (p.prediction === 'yes') bucket.yes++;
      else bucket.no++;
    }
  });

  // 6. Stacked Bar Chart: Housing & Personal Loans
  const loanCategories: Record<string, { yes: number; no: number }> = {
    'Không vay': { yes: 0, no: 0 },
    'Vay mua nhà': { yes: 0, no: 0 },
    'Vay cá nhân': { yes: 0, no: 0 },
    'Cả hai khoản vay': { yes: 0, no: 0 },
  };

  filtered.forEach((p) => {
    const housing = p.customerData?.housing === 'yes';
    const loan = p.customerData?.loan === 'yes';
    let cat = 'Không vay';
    if (housing && loan) cat = 'Cả hai khoản vay';
    else if (housing) cat = 'Vay mua nhà';
    else if (loan) cat = 'Vay cá nhân';

    if (p.prediction === 'yes') loanCategories[cat].yes++;
    else loanCategories[cat].no++;
  });

  const loanDistribution = Object.keys(loanCategories).map((k) => ({
    category: k,
    yes: loanCategories[k].yes,
    no: loanCategories[k].no,
  }));

  // 7. Confidence Distribution (probability YES in 5 bins)
  const confidenceBins = [
    { range: '0-20%', min: 0, max: 20, count: 0 },
    { range: '20-40%', min: 20, max: 40, count: 0 },
    { range: '40-60%', min: 40, max: 60, count: 0 },
    { range: '60-80%', min: 60, max: 80, count: 0 },
    { range: '80-100%', min: 80, max: 100, count: 0 },
  ];

  filtered.forEach((p) => {
    const prob = p.probabilityYes;
    const bin = confidenceBins.find((b) => prob >= b.min && prob <= b.max);
    if (bin) bin.count++;
  });

  // Recent predictions (top 8)
  const recentPredictions = filtered.slice(0, 8).map((p) => ({
    id: p.id,
    customerId: p.customerId,
    age: p.customerData?.age,
    job: p.customerData?.job,
    prediction: p.prediction,
    probabilityYes: p.probabilityYes,
    probabilityNo: p.probabilityNo,
    userName: p.userName,
    createdAt: p.createdAt,
  }));

  res.json({
    kpis: {
      totalCustomers,
      totalPredictions,
      yesPredictions,
      noPredictions,
      yesRate,
      activeUsersCount,
    },
    charts: {
      pieData,
      timeTrends,
      jobDistribution,
      ageDistribution: ageBuckets,
      loanDistribution,
      confidenceDistribution: confidenceBins,
    },
    recentPredictions,
  });
});
