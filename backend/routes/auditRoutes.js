const express = require('express');
const { WebAudit } = require('../models/WebAudit');
const { analyzeWebsite } = require('../utils/auditUtils');
const { getAIRecommendations } = require('../utils/aiUtils');
const { generatePDFReport } = require('../utils/pdfUtils');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Lancer un nouvel audit
router.post('/run', authMiddleware, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: 'URL requise pour lancer un audit.' });

  try {
    // 1. Analyse du site
    const auditResults = await analyzeWebsite(url);

    // 2. Génération des recommandations IA
    const recommandationsIA = await getAIRecommendations(auditResults);

    // 3. Injection des recommandations dans les sections
    ['performance', 'seo', 'ux_ui'].forEach(section => {
      if (auditResults[section]) {
        auditResults[section].recommandations_ia = recommandationsIA[section] || [];
      }
    });

    // 4. Sauvegarde en BDD
    const newAudit = new WebAudit({
      user: req.user.id,
      url,
      performance: auditResults.performance,
      seo: auditResults.seo,
      ui_ux: auditResults.ux_ui,
      date: new Date(),
    });

    const savedAudit = await newAudit.save();
    res.status(201).json({ message: 'Audit terminé et enregistré.', auditId: savedAudit._id });

  } catch (error) {
    console.error('Erreur durant l\'audit :', error);
    res.status(500).json({ message: 'Erreur lors de l’audit du site.' });
  }
});

// Rapport PDF à la volée
router.get('/report-pdf/:auditId', authMiddleware, async (req, res) => {
  try {
    const audit = await WebAudit.findById(req.params.auditId);
    if (!audit || audit.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé ou audit introuvable.' });
    }

    const pdfBuffer = await generatePDFReport(audit);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=audit_${audit._id}.pdf`,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Erreur PDF :', error);
    res.status(500).json({ message: 'Erreur lors de la génération du PDF.' });
  }
});

// Routes précédentes (overview, performance, seo, ux-ui, report, history)
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    const audits = await WebAudit.find({ user: req.user.id }).select('url performance seo ui_ux date');
    if (!audits.length) {
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
});

router.get('/performance/:auditId', authMiddleware, async (req, res) => {
  try {
    const audit = await WebAudit.findById(req.params.auditId);
    if (!audit || audit.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Audit non trouvé ou accès interdit.' });
    }

    res.json({ performance: audit.performance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des détails de performance.' });
  }
});

router.get('/seo/:auditId', authMiddleware, async (req, res) => {
  try {
    const audit = await WebAudit.findById(req.params.auditId);
    if (!audit || audit.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Audit non trouvé ou accès interdit.' });
    }

    res.json({ seo: audit.seo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des détails SEO.' });
  }
});

router.get('/ux-ui/:auditId', authMiddleware, async (req, res) => {
  try {
    const audit = await WebAudit.findById(req.params.auditId);
    if (!audit || audit.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Audit non trouvé ou accès interdit.' });
    }

    res.json({ ux_ui: audit.ui_ux });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des détails UX/UI.' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const audits = await WebAudit.find({ user: req.user.id }).select('url performance seo ui_ux date');
    if (!audits.length) {
      return res.status(404).json({ message: 'Aucun audit trouvé dans l\'historique.' });
    }

    res.json({ audits });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique des audits.' });
  }
});

module.exports = router;
