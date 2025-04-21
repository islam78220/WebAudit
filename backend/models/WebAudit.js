const mongoose = require('mongoose');

const ErrorSchema = new mongoose.Schema({
  type_erreur: String,
  description: String,
  severite: { type: String, enum: ['faible', 'moyenne', 'élevée'], default: 'faible' },
});

const CriteresSchema = new mongoose.Schema({
  nom: String, // e.g. "temps_chargement"
  score: Number,
  erreurs: [ErrorSchema],
});

const SectionSchema = new mongoose.Schema({
  score_total: Number,
  criteres: [CriteresSchema],
  recommandations_ia: [String], // générées selon les erreurs
});

const WebAuditSchema = new mongoose.Schema({
  url: { type: String, required: true },
  performance: SectionSchema,
  seo: SectionSchema,
  ui_ux: SectionSchema,
  rapport_global: { type: String }, // optionnel, pour PDF ou résumé global
  date: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // pour filtrer par utilisateur
});

const WebAudit = mongoose.model('WebAudit', WebAuditSchema);
module.exports = { WebAudit };
