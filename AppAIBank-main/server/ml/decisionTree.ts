import fs from 'fs';
import path from 'path';

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

export interface BankRecord extends CustomerInput {
  id?: string;
  deposit?: 'yes' | 'no';
}

export interface TreeNode {
  id: number;
  isLeaf: boolean;
  featureIndex?: number;
  featureName?: string;
  threshold?: number;
  criterionValue?: number;
  samples: number;
  classCounts: [number, number]; // [count_no, count_yes]
  probabilities: [number, number]; // [P(NO), P(YES)]
  prediction: 'yes' | 'no';
  leftChild?: TreeNode;
  rightChild?: TreeNode;
  splitDescription?: string;
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

export const CATEGORICAL_VALUES: Record<string, string[]> = {
  job: [
    'admin.',
    'blue-collar',
    'entrepreneur',
    'housemaid',
    'management',
    'retired',
    'self-employed',
    'services',
    'student',
    'technician',
    'unemployed',
    'unknown',
  ],
  marital: ['divorced', 'married', 'single'],
  education: ['primary', 'secondary', 'tertiary', 'unknown'],
  default: ['no', 'yes'],
  housing: ['no', 'yes'],
  loan: ['no', 'yes'],
  contact: ['cellular', 'telephone', 'unknown'],
  month: [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ],
  poutcome: ['failure', 'other', 'success', 'unknown'],
};

export const NUMERICAL_FEATURES = [
  'age',
  'balance',
  'day',
  'duration',
  'campaign',
  'pdays',
  'previous',
];

export class DecisionTreePipeline {
  private featureNames: string[] = [];
  private root: TreeNode | null = null;
  private featureImportances: number[] = [];
  private nextNodeId = 0;

  constructor(
    public hyperparameters = {
      criterion: 'gini' as 'gini' | 'entropy' | 'log_loss',
      maxDepth: 6,
      minSamplesSplit: 10,
      minSamplesLeaf: 5,
      classWeight: 'none' as 'none' | 'balanced',
    }
  ) {
    this.buildFeatureSchema();
  }

  private buildFeatureSchema() {
    this.featureNames = [];
    // 1. Numerical
    for (const numFeat of NUMERICAL_FEATURES) {
      this.featureNames.push(numFeat);
    }
    // 2. One-hot categorical
    for (const [catName, vals] of Object.entries(CATEGORICAL_VALUES)) {
      for (const val of vals) {
        this.featureNames.push(`${catName}_${val}`);
      }
    }
  }

  public getFeatureNames(): string[] {
    return this.featureNames;
  }

  public transform(customer: CustomerInput): number[] {
    const vector: number[] = new Array(this.featureNames.length).fill(0);
    // Numerical values
    vector[0] = Number(customer.age) || 0;
    vector[1] = Number(customer.balance) || 0;
    vector[2] = Number(customer.day) || 0;
    vector[3] = Number(customer.duration) || 0;
    vector[4] = Number(customer.campaign) || 0;
    vector[5] = Number(customer.pdays) || -1;
    vector[6] = Number(customer.previous) || 0;

    let offset = NUMERICAL_FEATURES.length;
    for (const [catName, vals] of Object.entries(CATEGORICAL_VALUES)) {
      const userVal = String((customer as any)[catName] || '').toLowerCase().trim();
      for (let i = 0; i < vals.length; i++) {
        if (userVal === vals[i]) {
          vector[offset + i] = 1;
        } else {
          vector[offset + i] = 0;
        }
      }
      offset += vals.length;
    }
    return vector;
  }

  private calculateImpurity(noCount: number, yesCount: number, criterion: string): number {
    const total = noCount + yesCount;
    if (total === 0) return 0;
    const p0 = noCount / total;
    const p1 = yesCount / total;

    if (criterion === 'entropy' || criterion === 'log_loss') {
      let ent = 0;
      if (p0 > 0) ent -= p0 * Math.log2(p0);
      if (p1 > 0) ent -= p1 * Math.log2(p1);
      return ent;
    }
    // Gini default: 1 - sum(p_i^2)
    return 1 - (p0 * p0 + p1 * p1);
  }

  private totalTrainingSamples = 0;

  public train(
    X: number[][],
    y: number[],
    sampleWeights?: number[]
  ): { tree: TreeNode; importances: FeatureImportance[] } {
    this.nextNodeId = 0;
    this.featureImportances = new Array(this.featureNames.length).fill(0);

    const nSamples = X.length;
    this.totalTrainingSamples = nSamples;
    const indices = Array.from({ length: nSamples }, (_, i) => i);

    let weights: number[];
    if (this.hyperparameters.classWeight === 'balanced') {
      const count0 = y.filter((v) => v === 0).length;
      const count1 = y.filter((v) => v === 1).length;
      const w0 = count0 > 0 ? nSamples / (2 * count0) : 1;
      const w1 = count1 > 0 ? nSamples / (2 * count1) : 1;
      weights = y.map((val) => (val === 1 ? w1 : w0));
    } else {
      weights = sampleWeights || new Array(nSamples).fill(1);
    }

    this.root = this.buildNode(X, y, indices, weights, 0);

    // Normalize feature importances to sum to 100%
    const totalImp = this.featureImportances.reduce((acc, v) => acc + v, 0);
    const importances: FeatureImportance[] = this.featureNames.map((name, i) => {
      const raw = this.featureImportances[i];
      const normalized = totalImp > 0 ? raw / totalImp : 0;
      return {
        feature: name,
        importance: Number(normalized.toFixed(4)),
        percentage: Number((normalized * 100).toFixed(2)),
      };
    });
    importances.sort((a, b) => b.importance - a.importance);

    return { tree: this.root, importances };
  }

  private buildNode(
    X: number[][],
    y: number[],
    indices: number[],
    weights: number[],
    depth: number
  ): TreeNode {
    const id = ++this.nextNodeId;
    let countNo = 0;
    let countYes = 0;

    for (const idx of indices) {
      if (y[idx] === 1) countYes++;
      else countNo++;
    }

    const totalSamples = indices.length;
    const probYes = totalSamples > 0 ? countYes / totalSamples : 0;
    const probNo = 1 - probYes;
    const prediction: 'yes' | 'no' = probYes >= 0.5 ? 'yes' : 'no';
    const impurity = this.calculateImpurity(countNo, countYes, this.hyperparameters.criterion);

    // Leaf condition checks
    if (
      depth >= this.hyperparameters.maxDepth ||
      totalSamples < this.hyperparameters.minSamplesSplit ||
      countNo === 0 ||
      countYes === 0
    ) {
      return {
        id,
        isLeaf: true,
        samples: totalSamples,
        classCounts: [countNo, countYes],
        probabilities: [
          Number(probNo.toFixed(4)),
          Number(probYes.toFixed(4)),
        ],
        prediction,
        criterionValue: Number(impurity.toFixed(4)),
      };
    }

    // Find best split
    let bestGain = -Infinity;
    let bestFeature = -1;
    let bestThreshold = 0;
    let bestLeftIndices: number[] = [];
    let bestRightIndices: number[] = [];

    const nFeatures = this.featureNames.length;

    for (let f = 0; f < nFeatures; f++) {
      // Gather values for this feature
      const isOneHot = f >= NUMERICAL_FEATURES.length;
      let thresholds: number[] = [];

      if (isOneHot) {
        thresholds = [0.5];
      } else {
        // Collect unique values or quantiles
        const values = new Float64Array(indices.length);
        for (let i = 0; i < indices.length; i++) {
          values[i] = X[indices[i]][f];
        }
        values.sort();

        // Sample up to 15 quantile thresholds to optimize split search speed & quality
        const step = Math.max(1, Math.floor(values.length / 15));
        const seen = new Set<number>();
        for (let i = step; i < values.length; i += step) {
          const val = (values[i - 1] + values[i]) / 2;
          if (!seen.has(val)) {
            seen.add(val);
            thresholds.push(val);
          }
        }
      }

      for (const th of thresholds) {
        let leftNo = 0;
        let leftYes = 0;
        let rightNo = 0;
        let rightYes = 0;

        for (const idx of indices) {
          const val = X[idx][f];
          if (val <= th) {
            if (y[idx] === 1) leftYes++;
            else leftNo++;
          } else {
            if (y[idx] === 1) rightYes++;
            else rightNo++;
          }
        }

        const leftTotal = leftNo + leftYes;
        const rightTotal = rightNo + rightYes;

        if (
          leftTotal < this.hyperparameters.minSamplesLeaf ||
          rightTotal < this.hyperparameters.minSamplesLeaf
        ) {
          continue;
        }

        const leftImpurity = this.calculateImpurity(leftNo, leftYes, this.hyperparameters.criterion);
        const rightImpurity = this.calculateImpurity(rightNo, rightYes, this.hyperparameters.criterion);

        const weightedImpurity =
          (leftTotal / totalSamples) * leftImpurity +
          (rightTotal / totalSamples) * rightImpurity;
        const gain = impurity - weightedImpurity;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = f;
          bestThreshold = th;
        }
      }
    }

    if (bestGain <= 0 || bestFeature === -1) {
      return {
        id,
        isLeaf: true,
        samples: totalSamples,
        classCounts: [countNo, countYes],
        probabilities: [
          Number(probNo.toFixed(4)),
          Number(probYes.toFixed(4)),
        ],
        prediction,
        criterionValue: Number(impurity.toFixed(4)),
      };
    }

    // Accumulate feature importance
    this.featureImportances[bestFeature] +=
      (totalSamples / (this.totalTrainingSamples || totalSamples)) * bestGain;

    // Split indices
    for (const idx of indices) {
      if (X[idx][bestFeature] <= bestThreshold) {
        bestLeftIndices.push(idx);
      } else {
        bestRightIndices.push(idx);
      }
    }

    const featureName = this.featureNames[bestFeature];
    const splitDesc = bestFeature < NUMERICAL_FEATURES.length
      ? `${featureName} ≤ ${bestThreshold.toFixed(1)}`
      : `${featureName} = 0`;

    const leftNode = this.buildNode(X, y, bestLeftIndices, weights, depth + 1);
    const rightNode = this.buildNode(X, y, bestRightIndices, weights, depth + 1);

    return {
      id,
      isLeaf: false,
      featureIndex: bestFeature,
      featureName,
      threshold: Number(bestThreshold.toFixed(2)),
      criterionValue: Number(impurity.toFixed(4)),
      samples: totalSamples,
      classCounts: [countNo, countYes],
      probabilities: [
        Number(probNo.toFixed(4)),
        Number(probYes.toFixed(4)),
      ],
      prediction,
      leftChild: leftNode,
      rightChild: rightNode,
      splitDescription: splitDesc,
    };
  }

  public predictProba(customer: CustomerInput): {
    prediction: 'yes' | 'no';
    probabilityYes: number;
    probabilityNo: number;
    leafNodeId: number;
    decisionPath: string[];
  } {
    if (!this.root) {
      throw new Error('Mô hình Decision Tree chưa được huấn luyện hoặc tải.');
    }
    const vector = this.transform(customer);
    let curr: TreeNode = this.root;
    const path: string[] = [];

    while (!curr.isLeaf) {
      const featIdx = curr.featureIndex!;
      const val = vector[featIdx];
      const th = curr.threshold!;
      const featName = curr.featureName!;

      if (val <= th) {
        path.push(`${featName} (${val}) ≤ ${th}`);
        curr = curr.leftChild!;
      } else {
        path.push(`${featName} (${val}) > ${th}`);
        curr = curr.rightChild!;
      }
    }

    const pNo = Number((curr.probabilities[0] * 100).toFixed(2));
    const pYes = Number((100 - pNo).toFixed(2)); // ensure exactly 100% sum
    const pred = curr.prediction;

    return {
      prediction: pred,
      probabilityYes: pYes,
      probabilityNo: pNo,
      leafNodeId: curr.id,
      decisionPath: path,
    };
  }

  public getRoot(): TreeNode | null {
    return this.root;
  }

  public setRoot(tree: TreeNode) {
    this.root = tree;
  }
}

export function evaluateModel(
  treePipeline: DecisionTreePipeline,
  testX: CustomerInput[],
  testY: ('yes' | 'no')[]
): ModelMetrics {
  let tn = 0, fp = 0, fn = 0, tp = 0;

  for (let i = 0; i < testX.length; i++) {
    const res = treePipeline.predictProba(testX[i]);
    const actual = testY[i];

    if (actual === 'no') {
      if (res.prediction === 'no') tn++;
      else fp++;
    } else {
      if (res.prediction === 'yes') tp++;
      else fn++;
    }
  }

  const total = testX.length;
  const accuracy = (tp + tn) / total;

  const precYes = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recYes = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1Yes = precYes + recYes > 0 ? (2 * precYes * recYes) / (precYes + recYes) : 0;

  const precNo = tn + fn > 0 ? tn / (tn + fn) : 0;
  const recNo = tn + fp > 0 ? tn / (tn + fp) : 0;
  const f1No = precNo + recNo > 0 ? (2 * precNo * recNo) / (precNo + recNo) : 0;

  const supportNo = tn + fp;
  const supportYes = tp + fn;

  const macroPrec = (precNo + precYes) / 2;
  const macroRec = (recNo + recYes) / 2;
  const macroF1 = (f1No + f1Yes) / 2;

  const weightPrec = (precNo * supportNo + precYes * supportYes) / total;
  const weightRec = (recNo * supportNo + recYes * supportYes) / total;
  const weightF1 = (f1No * supportNo + f1Yes * supportYes) / total;

  return {
    accuracy: Number((accuracy * 100).toFixed(2)),
    precision: Number((precYes * 100).toFixed(2)),
    recall: Number((recYes * 100).toFixed(2)),
    f1Score: Number((f1Yes * 100).toFixed(2)),
    confusionMatrix: {
      trueNegative: tn,
      falsePositive: fp,
      falseNegative: fn,
      truePositive: tp,
    },
    classificationReport: {
      no: {
        precision: Number((precNo * 100).toFixed(2)),
        recall: Number((recNo * 100).toFixed(2)),
        f1Score: Number((f1No * 100).toFixed(2)),
        support: supportNo,
      },
      yes: {
        precision: Number((precYes * 100).toFixed(2)),
        recall: Number((recYes * 100).toFixed(2)),
        f1Score: Number((f1Yes * 100).toFixed(2)),
        support: supportYes,
      },
      macroAvg: {
        precision: Number((macroPrec * 100).toFixed(2)),
        recall: Number((macroRec * 100).toFixed(2)),
        f1Score: Number((macroF1 * 100).toFixed(2)),
        support: total,
      },
      weightedAvg: {
        precision: Number((weightPrec * 100).toFixed(2)),
        recall: Number((weightRec * 100).toFixed(2)),
        f1Score: Number((weightF1 * 100).toFixed(2)),
        support: total,
      },
    },
    trainSamples: 0,
    testSamples: total,
  };
}
