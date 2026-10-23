const express = require('express');
const healthRoutes = require('./health.routes');
const evaluationRoutes = require('./evaluation.routes');

const router = express.Router();

// Mount health routes under /api/v1
router.use('/', healthRoutes);

// Mount evaluation routes under /api/v1/evaluations
router.use('/evaluations', evaluationRoutes);

router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'TrustLens-AI API v1 Complete & Active',
    phases: {
      phase1_scaffolding: 'Completed',
      phase2_claim_verification: 'Completed',
      phase3_evidence_retrieval: 'Completed',
      phase4_orchestration: 'Completed',
      phase5_dashboard_ui: 'Completed',
    },
  });
});

module.exports = router;
