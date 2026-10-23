const express = require('express');
const healthRoutes = require('./health.routes');

const router = express.Router();

// Mount health routes under /api/v1
router.use('/', healthRoutes);

router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'TrustLens-AI API v1 Foundation Active',
    phases: {
      phase1_scaffolding: 'Completed',
      phase2_claim_verification: 'Pending',
      phase3_evidence_retrieval: 'Pending',
      phase4_orchestration: 'Pending',
      phase5_dashboard_ui: 'Pending',
    },
  });
});

module.exports = router;
