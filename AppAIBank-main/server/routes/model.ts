import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { AuthRequest, authMiddleware, requireAdmin } from '../middleware/auth.ts';
import { modelService } from '../ml/modelService.ts';

export const modelRouter = Router();

modelRouter.use(authMiddleware);

// GET /api/model/info
modelRouter.get('/info', (req: AuthRequest, res: Response) => {
  const metadata = modelService.getMetadata();
  const activeRegistry = db.getActiveModel();

  res.json({
    metadata,
    activeRegistry,
    registryHistory: db.getModelRegistry(),
  });
});

// GET /api/model/metrics
modelRouter.get('/metrics', (req: AuthRequest, res: Response) => {
  const metadata = modelService.getMetadata();
  res.json({
    metrics: metadata.metrics,
    hyperparameters: metadata.hyperparameters,
  });
});

// GET /api/model/feature-importance
modelRouter.get('/feature-importance', (req: AuthRequest, res: Response) => {
  const importances = modelService.getFeatureImportances();
  res.json({
    featureImportances: importances,
  });
});

// GET /api/model/tree-nodes
modelRouter.get('/tree-nodes', (req: AuthRequest, res: Response) => {
  const tree = modelService.getTreeRoot();
  res.json({
    tree,
  });
});

// POST /api/model/retrain (Admin only)
modelRouter.post('/retrain', requireAdmin, (req: AuthRequest, res: Response) => {
  const { criterion, maxDepth, minSamplesSplit, minSamplesLeaf, classWeight } = req.body;

  try {
    const parsedParams = {
      criterion: ['gini', 'entropy', 'log_loss'].includes(criterion) ? criterion : 'gini',
      maxDepth: maxDepth ? Math.min(12, Math.max(2, parseInt(maxDepth, 10))) : 6,
      minSamplesSplit: minSamplesSplit ? Math.max(2, parseInt(minSamplesSplit, 10)) : 10,
      minSamplesLeaf: minSamplesLeaf ? Math.max(1, parseInt(minSamplesLeaf, 10)) : 5,
      classWeight: classWeight === 'balanced' ? 'balanced' : 'none',
    };

    const { metadata, tree } = modelService.retrain(parsedParams as any, req.user!.username);

    res.json({
      message: `Đã huấn luyện lại mô hình thành công (${metadata.modelVersion}).`,
      metadata,
    });
  } catch (err: any) {
    console.error('Error retraining model:', err);
    res.status(500).json({ error: err.message || 'Lỗi trong quá trình huấn luyện lại mô hình.' });
  }
});
