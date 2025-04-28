import { auditWithLighthouse } from '../services/lighthouseService.js';
import { auditWithGTmetrix } from '../services/gtmetrixService.js';
import { generateRecommendationsWithMistral } from '../services/mistralService.js';
import WebAudit from '../models/Audit.js';

// Créer un audit
const createAudit = async (req, res) => {
  const { url } = req.body;
  try {
    // Appeler les audits avec Lighthouse et GTmetrix
    const lighthouseResult = await auditWithLighthouse(url);
    const gtmetrixResult = await auditWithGTmetrix(url);

    // Fusionner les résultats
    const errors = {
      seo: lighthouseResult.seoErrors,
      performance: gtmetrixResult.performanceScore,
      accessibility: lighthouseResult.accessibilityErrors,
    };

    // Générer les recommandations IA
    const recommendations = await generateRecommendationsWithMistral(errors);

    // Sauvegarder l'audit et les recommandations dans la base de données
    const audit = new Audit({
      url,
      score_seo: lighthouseResult.seoScore,
      score_performance: gtmetrixResult.performanceScore,
      score_uiux: lighthouseResult.accessibilityScore,
      recommandations: recommendations,
      utilisateur_id: req.userId
    });
    await audit.save();

    res.status(201).json({ audit });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir l'historique des audits d'un utilisateur
const getUserAudits = async (req, res) => {
  try {
    const audits = await Audit.find({ utilisateur_id: req.userId });
    res.status(200).json(audits);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export { createAudit, getUserAudits };
