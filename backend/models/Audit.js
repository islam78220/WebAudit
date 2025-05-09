const mongoose = require('mongoose');

// Schéma pour représenter un problème identifié
const IssueSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  type: {
    type: String,
    required: true
  },
  recommendation: {
    type: String,
    required: true
  }
});
const Issue = mongoose.model('Issue', IssueSchema);
const AuditSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'Veuillez ajouter une URL'],
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%.\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%\+.~#?&//=]*)/,
      'Veuillez utiliser une URL valide avec HTTP ou HTTPS'
    ]
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  overview: {
    seoScore: Number,
    performanceScore: Number,
    uiUxScore: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  seo: {
    score: Number,
    issues: [IssueSchema],
    keywords: [String],
    metaDescription: String,
    canonicalUrl: String
  },
  performance: {
    score: Number,
    issues: [IssueSchema],
    loadTime: Number,
    pageSize: Number,
    requests: Number,
    mobileOptimization: Number
  },
  uiUx: {
    score: Number,
    issues: [IssueSchema],
    accessibility: Number,
    interactiveTime: Number,
    responsiveDesign: Boolean
  }
}, {
  timestamps: true
});
AuditSchema.methods.getIssues = async function() {
  return await Issue.find({ auditId: this._id });
};

module.exports = {
  Audit: mongoose.model('Audit', AuditSchema),
  Issue: Issue
};