const path = require('path');

const { WebAudit } = require('../models/WebAudit');
const { analyzeWebsite } = require('../utils/auditUtils');
const { getAIRecommendations } = require('../utils/aiUtils');
const { generatePDFReport } = require('../utils/pdfUtils');

// Vue d'ensemble des audits de l'utilisateur
exports.getAuditOverview = async (req, res) => {
  try {
    const audits = await WebAudit.find({ user: req.user.id }).select('url performance seo ui_ux date');
    if (!audits || audits.length === 0) {
      return res.status(404).json({ message: 'Aucun audit trouvé pour cet utilisateur.' });
    }

    const overview = audits.map(audit => ({
      id: audit._id,
      url: audit.url,
      performanceScore: audit.performance?.score_total,
      seoScore: audit.seo?.score_total,
      uxUiScore: audit.ui_ux?.score_total,
      date: audit.date,
    }));

    res.json({ overview });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des audits.' });
  }
};

// Détails d'un audit par ID
exports.getAuditDetails = async (req, res) => {
  try {
    const audit = await WebAudit.findById(req.params.auditId);
    if (!audit || audit.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Audit non trouvé ou accès interdit.' });
    }

    res.json({ audit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des détails de l\'audit.' });
  }
};

// Télécharger le rapport généré pour un audit
exports.downloadAuditReport = async (req, res) => {
  try {
    const audit = await WebAudit.findById(req.params.auditId);
    if (!audit || audit.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Audit non trouvé ou accès interdit.' });
    }

    const filename = await generatePDFReport(audit);
    const filePath = path.join(__dirname, '../reports', filename);
    
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Erreur lors du téléchargement du rapport :', err);
        res.status(500).json({ message: 'Erreur lors du téléchargement du rapport.' });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la génération du rapport.' });
  }
};

// Récupérer les recommandations de l'IA pour un audit
exports.getAIRecommendationsForAudit = async (req, res) => {
  try {
    const audit = await WebAudit.findById(req.params.auditId);
    if (!audit || audit.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Audit non trouvé ou accès interdit.' });
    }

    const recommendations = await getAIRecommendations(audit);
    res.json({ recommendations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des recommandations AI.' });
  }
};
