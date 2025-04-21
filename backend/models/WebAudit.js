const mongoose = require('mongoose');
const validator = require('validator'); // Assure-toi d'installer le module 'validator'

// Schéma des erreurs
const ErrorSchema = new mongoose.Schema({
  type_erreur: String,
  description: String,
  severite: { type: String, enum: ['faible', 'moyenne', 'élevée'], default: 'faible' },
});

// Schéma des critères
const CriteresSchema = new mongoose.Schema({
  nom: String, // par exemple "temps_chargement"
  score: Number,
  erreurs: [ErrorSchema],
});

// Schéma des sections d'audit (performance, SEO, UX/UI)
const SectionSchema = new mongoose.Schema({
  score_total: Number,
  criteres: [CriteresSchema],
  recommandations_ia: [String], // générées selon les erreurs
});

// Schéma de l'audit Web
const WebAuditSchema = new mongoose.Schema({
  url: { 
    type: String, 
    required: true,
    validate: {
      validator: (value) => validator.isURL(value), // Validation de l'URL
      message: 'URL invalide',
    },
  },
  performance: SectionSchema,
  seo: SectionSchema,
  ui_ux: SectionSchema,
  rapport_global: { type: String }, // optionnel, pour PDF ou résumé global
  date: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Référence à l'utilisateur
});

// Création du modèle WebAudit
const WebAudit = mongoose.model('WebAudit', WebAuditSchema);

module.exports = { WebAudit };
