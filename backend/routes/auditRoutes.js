const express = require('express');
const { WebAudit } = require('../models/WebAudit');
const { generateAuditReport } = require('../utils/reportUtils');
const { authenticate } = require('../middleware/authenticate');
const router = express.Router();

// 1. Vue d'ensemble des audits
router.get('/overview', authenticate, async (req, res) => {
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
});

// 2. Détails de l'audit de performance
router.get('/performance/:auditId', authenticate, async (req, res) => {
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

// 3. Détails de l'audit SEO
router.get('/seo/:auditId', authenticate, async (req, res) => {
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

// 4. Détails de l'audit UX/UI
router.get('/ux-ui/:auditId', authenticate, async (req, res) => {
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

// 5. Générer un rapport complet
router.get('/report/:auditId', authenticate, async (req, res) => {
  try {
    const audit = await WebAudit.findById(req.params.auditId);
    if (!audit || audit.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Audit non trouvé ou accès interdit.' });
    }

    const filename = await generateAuditReport(audit); // ex : retourne 'rapport_123.pdf'
    res.download(`./reports/${filename}`, filename, (err) => {
      if (err) {
        console.error('Erreur lors du téléchargement du rapport :', err);
        res.status(500).json({ message: 'Erreur lors du téléchargement du rapport.' });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la génération du rapport.' });
  }
});

// 6. Historique des audits pour l'utilisateur authentifié
router.get('/history', authenticate, async (req, res) => {
  try {
    const audits = await WebAudit.find({ user: req.user.id }).select('url performance seo ui_ux date');
    if (!audits || audits.length === 0) {
      return res.status(404).json({ message: 'Aucun audit trouvé dans l\'historique.' });
    }

    res.json({ audits });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique des audits.' });
  }
});

module.exports = router;
