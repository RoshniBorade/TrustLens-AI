const mongoose = require('mongoose');
const { Schema } = mongoose;

// Evidence sub‑document schema
const EvidenceSchema = new Schema({
  sourceUrl: { type: String, required: true },
  sourceTitle: { type: String, required: true },
  snippet: { type: String, required: true },
  retrievedAt: { type: Date, default: Date.now },
});

// Claim sub‑document schema
const ClaimSchema = new Schema({
  claimId: { type: String, required: true },
  text: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'supported', 'contradicted', 'unverified'],
    default: 'pending',
  },
  confidence: { type: Number, min: 0, max: 1 },
  explanation: { type: String },
  evidence: { type: EvidenceSchema, default: null },
});

// Top‑level evaluation schema
const EvaluationSchema = new Schema({
  evaluationId: { type: String, required: true, unique: true },
  question: { type: String, required: true, maxlength: 2000 },
  aiResponse: { type: String, required: true, maxlength: 8000 },
  status: { type: String, enum: ['pending','processing','completed','failed'], default: 'pending' },
  reliabilityIndex: { type: Number },
  claimCount: { type: Number, default: 0 },
  supportedCount: { type: Number, default: 0 },
  contradictedCount: { type: Number, default: 0 },
  unverifiedCount: { type: Number, default: 0 },
  supportedProportion: { type: Number, default: 0 },
  contradictedProportion: { type: Number, default: 0 },
  unverifiedProportion: { type: Number, default: 0 },
  hallucinationRate: { type: Number, default: 0 },
  unverifiedRate: { type: Number, default: 0 },
  strictAccuracy: { type: Number, default: 0 },
  formulaDefinition: { type: Map, of: String },
  limitationsDisclaimer: { type: String },
  processingTimeMs: { type: Number },
  modelUsed: { type: String },
  claims: { type: [ClaimSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Evaluation', EvaluationSchema);
