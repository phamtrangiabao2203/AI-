import fs from 'fs';
import path from 'path';
import {
  DecisionTreePipeline,
  CustomerInput,
  BankRecord,
  evaluateModel,
  ModelMetadata,
  TreeNode,
} from './decisionTree.ts';

export function parseCsv(csvPath: string): BankRecord[] {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const records: BankRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCols = lines[i].split(',');
    if (rawCols.length < headers.length) continue;

    const rowObj: any = {};
    for (let h = 0; h < headers.length; h++) {
      rowObj[headers[h]] = rawCols[h].trim();
    }

    records.push({
      id: `CUST-${String(i).padStart(5, '0')}`,
      age: parseInt(rowObj.age, 10) || 0,
      job: rowObj.job || 'unknown',
      marital: rowObj.marital || 'unknown',
      education: rowObj.education || 'unknown',
      default: rowObj.default || 'no',
      balance: parseInt(rowObj.balance, 10) || 0,
      housing: rowObj.housing || 'no',
      loan: rowObj.loan || 'no',
      contact: rowObj.contact || 'unknown',
      day: parseInt(rowObj.day, 10) || 1,
      month: rowObj.month || 'may',
      duration: parseInt(rowObj.duration, 10) || 0,
      campaign: parseInt(rowObj.campaign, 10) || 1,
      pdays: parseInt(rowObj.pdays, 10) ?? -1,
      previous: parseInt(rowObj.previous, 10) || 0,
      poutcome: rowObj.poutcome || 'unknown',
      deposit: rowObj.deposit === 'yes' ? 'yes' : 'no',
    });
  }

  return records;
}

// Simple seeded pseudo-random number generator for reproducible 80/20 train/test split
function pseudoRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function trainAndSaveModel(options?: {
  criterion?: 'gini' | 'entropy' | 'log_loss';
  maxDepth?: number;
  minSamplesSplit?: number;
  minSamplesLeaf?: number;
  classWeight?: 'none' | 'balanced';
}) {
  const csvPath = path.resolve(process.cwd(), 'data/bank.csv');
  console.log(`Loading dataset from ${csvPath}...`);
  const records = parseCsv(csvPath);
  console.log(`Loaded ${records.length} records.`);

  if (records.length === 0) {
    throw new Error('Dataset is empty!');
  }

  // Stratified split 80% train / 20% test (random_state = 42)
  const yesRecords = records.filter((r) => r.deposit === 'yes');
  const noRecords = records.filter((r) => r.deposit === 'no');

  const rng = pseudoRandom(42);

  // Shuffle arrays with deterministic rng
  function shuffle<T>(arr: T[]) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const shuffledYes = shuffle(yesRecords);
  const shuffledNo = shuffle(noRecords);

  const trainYesCount = Math.floor(shuffledYes.length * 0.8);
  const trainNoCount = Math.floor(shuffledNo.length * 0.8);

  const trainRecords: BankRecord[] = [
    ...shuffledYes.slice(0, trainYesCount),
    ...shuffledNo.slice(0, trainNoCount),
  ];

  const testRecords: BankRecord[] = [
    ...shuffledYes.slice(trainYesCount),
    ...shuffledNo.slice(trainNoCount),
  ];

  console.log(`Train set: ${trainRecords.length} samples, Test set: ${testRecords.length} samples.`);

  const pipeline = new DecisionTreePipeline({
    criterion: options?.criterion || 'gini',
    maxDepth: options?.maxDepth || 6,
    minSamplesSplit: options?.minSamplesSplit || 10,
    minSamplesLeaf: options?.minSamplesLeaf || 5,
    classWeight: options?.classWeight || 'none',
  });

  const X_train = trainRecords.map((r) => pipeline.transform(r));
  const y_train = trainRecords.map((r) => (r.deposit === 'yes' ? 1 : 0));

  console.log('Training Decision Tree classifier...');
  const t0 = Date.now();
  const { tree, importances } = pipeline.train(X_train, y_train);
  const elapsed = Date.now() - t0;
  console.log(`Model trained in ${elapsed}ms.`);

  const testX = testRecords.map((r) => r as CustomerInput);
  const testY = testRecords.map((r) => r.deposit!);

  const metrics = evaluateModel(pipeline, testX, testY);
  metrics.trainSamples = trainRecords.length;
  metrics.testSamples = testRecords.length;

  console.log('Evaluation Metrics:');
  console.log(`  Accuracy:  ${metrics.accuracy}%`);
  console.log(`  Precision: ${metrics.precision}%`);
  console.log(`  Recall:    ${metrics.recall}%`);
  console.log(`  F1-Score:  ${metrics.f1Score}%`);
  console.log(`  Confusion Matrix: TN=${metrics.confusionMatrix.trueNegative}, FP=${metrics.confusionMatrix.falsePositive}, FN=${metrics.confusionMatrix.falseNegative}, TP=${metrics.confusionMatrix.truePositive}`);

  const metadata: ModelMetadata = {
    modelName: 'DecisionTreeClassifier',
    modelVersion: 'v1.0.0',
    modelType: 'Supervised Learning - Decision Tree',
    datasetName: 'Bank Marketing (11,162 records)',
    targetVariable: 'deposit (yes/no)',
    hyperparameters: pipeline.hyperparameters,
    metrics,
    featureImportances: importances,
    trainedAt: new Date().toISOString(),
    featureNames: pipeline.getFeatureNames(),
  };

  const outputModelFile = path.resolve(process.cwd(), 'data/decision_tree_bank_model.json');
  fs.writeFileSync(
    outputModelFile,
    JSON.stringify(
      {
        metadata,
        tree,
      },
      null,
      2
    ),
    'utf-8'
  );
  console.log(`Model saved to ${outputModelFile}`);

  return { metadata, tree, pipeline };
}

// Run directly if called as a script
if (process.argv[1]?.endsWith('train.ts')) {
  trainAndSaveModel();
}
