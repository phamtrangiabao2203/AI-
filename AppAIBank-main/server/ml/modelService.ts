import fs from 'fs';
import path from 'path';
import {
  DecisionTreePipeline,
  CustomerInput,
  TreeNode,
  ModelMetadata,
  FeatureImportance,
  ModelMetrics,
} from './decisionTree.ts';
import { trainAndSaveModel } from './train.ts';
import { db } from '../db/database.ts';

class ModelService {
  private pipeline: DecisionTreePipeline | null = null;
  private metadata: ModelMetadata | null = null;
  private modelFilePath: string;

  constructor() {
    this.modelFilePath = path.resolve(process.cwd(), 'data/decision_tree_bank_model.json');
    this.init();
  }

  public init() {
    try {
      if (!fs.existsSync(this.modelFilePath)) {
        console.log('Model file does not exist, training initial model...');
        const { metadata, tree, pipeline } = trainAndSaveModel();
        this.metadata = metadata;
        this.pipeline = pipeline;
      } else {
        const raw = fs.readFileSync(this.modelFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.metadata = parsed.metadata;
        this.pipeline = new DecisionTreePipeline(this.metadata!.hyperparameters);
        this.pipeline.setRoot(parsed.tree);
        console.log(`Loaded Decision Tree model ${this.metadata?.modelVersion} from disk.`);
      }
    } catch (err) {
      console.error('Error initializing ModelService:', err);
    }
  }

  public predict(customer: CustomerInput) {
    if (!this.pipeline) {
      this.init();
    }
    if (!this.pipeline) {
      throw new Error('Không thể khởi tạo mô hình Decision Tree.');
    }
    return this.pipeline.predictProba(customer);
  }

  public getMetadata(): ModelMetadata {
    if (!this.metadata) {
      this.init();
    }
    return this.metadata!;
  }

  public getFeatureImportances(): FeatureImportance[] {
    if (!this.metadata) {
      this.init();
    }
    return this.metadata?.featureImportances || [];
  }

  public getTreeRoot(): TreeNode | null {
    if (!this.pipeline) {
      this.init();
    }
    return this.pipeline?.getRoot() || null;
  }

  public retrain(
    params: {
      criterion?: 'gini' | 'entropy' | 'log_loss';
      maxDepth?: number;
      minSamplesSplit?: number;
      minSamplesLeaf?: number;
      classWeight?: 'none' | 'balanced';
    },
    trainedBy = 'admin'
  ) {
    console.log('Retraining Decision Tree with parameters:', params);
    const { metadata, tree, pipeline } = trainAndSaveModel(params);
    this.metadata = metadata;
    this.pipeline = pipeline;

    // Register into database model registry
    const versionNum = (db.getModelRegistry().length + 1).toString();
    const versionStr = `v1.${versionNum}.0`;
    this.metadata.modelVersion = versionStr;

    db.registerModel({
      modelName: metadata.modelName,
      modelVersion: versionStr,
      modelPath: this.modelFilePath,
      accuracy: metadata.metrics.accuracy,
      precision: metadata.metrics.precision,
      recall: metadata.metrics.recall,
      f1Score: metadata.metrics.f1Score,
      parameters: params,
      trainingDate: new Date().toISOString(),
      status: 'active',
      trainedBy,
    });

    db.logAction(
      trainedBy,
      trainedBy,
      'MODEL_RETRAINED',
      'MODEL',
      versionStr,
      '127.0.0.1',
      `Tái huấn luyện mô hình ${versionStr}: Accuracy=${metadata.metrics.accuracy}%, F1=${metadata.metrics.f1Score}%`
    );

    return { metadata, tree };
  }
}

export const modelService = new ModelService();
