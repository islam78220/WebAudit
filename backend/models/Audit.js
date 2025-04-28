import mongoose from 'mongoose';
import validator from 'validator';

// Schéma des erreurs
const ErrorSchema = new mongoose.Schema({
  type_erreur: String,
  description: String,
  severite: { type: String, enum: ['faible', 'moyenne', 'élevée'], default: 'faible' },
});

// Schéma des critères
const CriteresSchema = new mongoose.Schema({
  nom: String,
  score: Number,
  erreurs: [ErrorSchema],
});

// Schéma des sections d'audit
const SectionSchema = new mongoose.Schema({
  score_total: Number,
  criteres: [CriteresSchema],
  recommandations_ia: [String],
});

// Schéma principal WebAudit
const WebAuditSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    validate: {
      validator: (value) => validator.isURL(value),
      message: 'URL invalide',
    },
  },
  performance: SectionSchema,
  seo: SectionSchema,
  ui_ux: SectionSchema,
  rapport_global: { type: String },
  date: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

// Modèle WebAudit
const WebAudit = mongoose.model('WebAudit', WebAuditSchema);

export default WebAudit;
