const { Audit } = require('../models/Audit');
const lighthouseService = require('../services/lighthouseService');
const gtmetrixService = require('../services/gtmetrixService');
const mistralService = require('../services/mistralService');
const pdfGenerator = require('../utils/pdfGenerator');
const { isValidUrl } = require('../utils/validators');

// Créer un nouvel audit
exports.createAudit = async (req, res, next) => {
  try {
    const { url } = req.body;
    
    // Validation de l'URL
    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ success: false, message: 'URL invalide' });
    }

    console.log(`Démarrage d'un nouvel audit pour l'URL: ${url} à ${new Date().toISOString()}`);

    // Exécuter l'audit Lighthouse
    let lighthouseData;
    try {
      lighthouseData = await lighthouseService.runAudit(url);
      console.log('Audit Lighthouse terminé avec succès');
    } catch (lighthouseError) {
      console.error('Erreur lors de l\'audit Lighthouse:', lighthouseError);
      lighthouseData = getDefaultLighthouseData();
    }

    // Exécuter l'audit GTmetrix avec récupération des données par défaut en cas d'erreur
    let gtmetrixData;
    try {
      gtmetrixData = await gtmetrixService.runAudit(url);
      
      // Log détaillé des données GTmetrix pour le débogage
      console.log('Données GTmetrix reçues:', JSON.stringify(gtmetrixData, null, 2));
      
      // Vérifier si les données sont complètes
      if (gtmetrixData.isRealData === true) {
        console.log('Audit GTmetrix terminé avec succès (données réelles confirmées)');
      } else {
        console.log('Attention: données GTmetrix fictives utilisées');
      }
    } catch (gtmetrixError) {
      console.error('Erreur lors de l\'audit GTmetrix:', gtmetrixError);
      
      // Informer l'utilisateur du problème spécifique
      if (gtmetrixError.response && gtmetrixError.response.status === 402) {
        return res.status(402).json({
          success: false,
          message: 'Crédits GTmetrix insuffisants. Veuillez recharger votre compte.',
          error: gtmetrixError.message
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Impossible de compléter l\'audit GTmetrix. Veuillez réessayer plus tard.',
          error: gtmetrixError.message
        });
      }
    }
    
    // Préparation des données pour l'analyse IA
    const seoIssues = lighthouseData.seo.issues || [];
    const performanceIssues = lighthouseData.performance.issues || [];
    const uiUxIssues = lighthouseData.accessibility.issues || [];
    
    // Log de débogage pour vérifier l'unicité des problèmes
    console.log(`Problèmes identifiés: SEO(${seoIssues.length}), Performance(${performanceIssues.length}), UI/UX(${uiUxIssues.length})`);
    
    // Génération des recommandations par IA
    let seoRecommendations = [], performanceRecommendations = [], uiUxRecommendations = [];
    
    try {
      if (seoIssues.length > 0) {
        console.log('Génération des recommandations SEO...');
        seoRecommendations = await mistralService.generateRecommendations(seoIssues, 'seo');
      }
      
      if (performanceIssues.length > 0) {
        console.log('Génération des recommandations de performance...');
        performanceRecommendations = await mistralService.generateRecommendations(performanceIssues, 'performance');
      }
      
      if (uiUxIssues.length > 0) {
        console.log('Génération des recommandations UI/UX...');
        uiUxRecommendations = await mistralService.generateRecommendations(uiUxIssues, 'ui-ux');
      }
      
      console.log('Génération des recommandations IA terminée');
    } catch (aiError) {
      console.error('Erreur lors de la génération des recommandations IA:', aiError);
      // Continuer sans recommandations IA
    }
    
    // Préparation des issues avec le format correct pour le schéma Mongoose
    const formattedSeoIssues = seoIssues.map((issue, index) => {
      let recommendation = 'Pas de recommandation disponible';
      
      // Si une recommandation existe, l'extraire correctement
      if (index < seoRecommendations.length) {
        const recItem = seoRecommendations[index];
        recommendation = typeof recItem === 'object' && recItem.recommendation 
          ? (typeof recItem.recommendation === 'object' && recItem.recommendation.recommendation 
              ? recItem.recommendation.recommendation 
              : String(recItem.recommendation))
          : String(recItem);
      }
      
      // Ajouter des informations de débogage
      console.log(`SEO issue ${index}: ${issue.description} -> ${recommendation.substring(0, 50)}...`);
      
      return {
        description: String(issue.description),
        severity: String(issue.severity || 'medium'),
        type: String(issue.type || 'seo'),
        recommendation: recommendation,
        auditId: issue.id || `seo-${index}-${Date.now()}` // Conserver l'ID unique pour le débogage
      };
    });
    
    const formattedPerformanceIssues = performanceIssues.map((issue, index) => {
      let recommendation = 'Pas de recommandation disponible';
      
      if (index < performanceRecommendations.length) {
        const recItem = performanceRecommendations[index];
        recommendation = typeof recItem === 'object' && recItem.recommendation 
          ? (typeof recItem.recommendation === 'object' && recItem.recommendation.recommendation 
              ? recItem.recommendation.recommendation 
              : String(recItem.recommendation))
          : String(recItem);
      }
      
      // Ajouter des informations de débogage
      console.log(`Performance issue ${index}: ${issue.description} -> ${recommendation.substring(0, 50)}...`);
      
      return {
        description: String(issue.description),
        severity: String(issue.severity || 'medium'),
        type: String(issue.type || 'performance'),
        recommendation: recommendation,
        auditId: issue.id || `perf-${index}-${Date.now()}` // Conserver l'ID unique pour le débogage
      };
    });
    
    const formattedUiUxIssues = uiUxIssues.map((issue, index) => {
      let recommendation = 'Pas de recommandation disponible';
      
      if (index < uiUxRecommendations.length) {
        const recItem = uiUxRecommendations[index];
        recommendation = typeof recItem === 'object' && recItem.recommendation 
          ? (typeof recItem.recommendation === 'object' && recItem.recommendation.recommendation 
              ? recItem.recommendation.recommendation 
              : String(recItem.recommendation))
          : String(recItem);
      }
      
      // Ajouter des informations de débogage
      console.log(`UI/UX issue ${index}: ${issue.description} -> ${recommendation.substring(0, 50)}...`);
      
      return {
        description: String(issue.description),
        severity: String(issue.severity || 'medium'),
        type: String(issue.type || 'ui-ux'),
        recommendation: recommendation,
        auditId: issue.id || `uiux-${index}-${Date.now()}` // Conserver l'ID unique pour le débogage
      };
    });
    
    // Création de l'audit dans la base de données
    const auditData = {
      url,
      userId: req.user ? req.user.id : null, // Si l'utilisateur est authentifié
      overview: {
        seoScore: lighthouseData.seo.score,
        performanceScore: lighthouseData.performance.score,
        uiUxScore: lighthouseData.accessibility.score,
        timestamp: new Date()
      },
      seo: {
        score: lighthouseData.seo.score,
        issues: formattedSeoIssues,
        keywords: lighthouseData.seo.keywords || [],
        metaDescription: lighthouseData.seo.metaDescription || '',
        canonicalUrl: lighthouseData.seo.canonicalUrl || ''
      },
      performance: {
        score: lighthouseData.performance.score,
        issues: formattedPerformanceIssues,
        loadTime: gtmetrixData.loadTime || 0,
        pageSize: gtmetrixData.pageSize || 0,
        requests: gtmetrixData.requests || 0,
        mobileOptimization: lighthouseData.performance.mobileOptimization || 0,
        // Ajout des métriques GTmetrix supplémentaires
        gtmetrixGrade: gtmetrixData.gtmetrixGrade || '',
        performanceScore: gtmetrixData.performanceScore || 0,
        structureScore: gtmetrixData.structureScore || 0,
        largestContentfulPaint: gtmetrixData.largestContentfulPaint || 0,
        totalBlockingTime: gtmetrixData.totalBlockingTime || 0,
        cumulativeLayoutShift: gtmetrixData.cumulativeLayoutShift || 0,
        speedIndex: gtmetrixData.speedIndex || 0
      },
      uiUx: {
        score: lighthouseData.accessibility.score,
        issues: formattedUiUxIssues,
        accessibility: lighthouseData.accessibility.score,
        interactiveTime: lighthouseData.performance.interactiveTime || 0,
        responsiveDesign: lighthouseData.accessibility.responsiveDesign || false
      },
      // Ajouter des métadonnées pour savoir quelle version du service a généré cet audit
      metaData: {
        auditVersion: "2.0",
        timestamp: Date.now(),
        uniqueAuditId: `${url.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}`
      }
    };
    
    const audit = await Audit.create(auditData);
    
    // Log de l'audit créé pour confirmation
    console.log(`Audit créé pour ${url} avec ID: ${audit._id}`);
    
    res.status(201).json({
      success: true,
      gtmetrixDataType: gtmetrixData.isRealData ? 'real' : 'mock',
      data: audit
    });
  } catch (error) {
    console.error('Erreur globale dans createAudit:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Données Lighthouse par défaut en cas d'erreur
function getDefaultLighthouseData() {
  return {
    performance: {
      score: 0,
      issues: [],
      interactiveTime: 0,
      mobileOptimization: 0
    },
    accessibility: {
      score: 0,
      issues: [],
      responsiveDesign: false
    },
    seo: {
      score: 0,
      issues: [],
      keywords: [],
      metaDescription: '',
      canonicalUrl: ''
    }
  };
}

// Autres fonctions inchangées
exports.getUserAudits = async (req, res, next) => {
  try {
    const audits = await Audit.find({ userId: req.user.id }).sort({ 'overview.timestamp': -1 });
    
    res.status(200).json({
      success: true,
      count: audits.length,
      data: audits
    });
  } catch (error) {
    next(error);
  }
};

exports.getAudit = async (req, res, next) => {
  try {
    const audit = await Audit.findById(req.params.id);
    
    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit non trouvé'
      });
    }
    
    // Vérifier si l'audit appartient à l'utilisateur connecté ou s'il est anonyme
    if (audit.userId && audit.userId.toString() !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à accéder à cet audit'
      });
    }
    
    res.status(200).json({
      success: true,
      data: audit
    });
  } catch (error) {
    next(error);
  }
};

exports.generatePdf = async (req, res, next) => {
  try {
    const audit = await Audit.findById(req.params.id);
    
    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit non trouvé'
      });
    }
    
    // Vérifier si l'audit appartient à l'utilisateur connecté ou s'il est anonyme
    if (audit.userId && audit.userId.toString() !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à accéder à cet audit'
      });
    }
    
    // Générer le PDF
    const pdfBuffer = await pdfGenerator.generateAuditReport(audit);
    
    // Envoyer le PDF en réponse
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=audit-${audit._id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// Nouvelle fonction pour nettoyer les vieux audits (au besoin)
exports.cleanupOldAudits = async (req, res, next) => {
  try {
    // Ne permettre qu'aux administrateurs
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à effectuer cette opération'
      });
    }
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await Audit.deleteMany({
      'overview.timestamp': { $lt: thirtyDaysAgo },
      userId: null // Uniquement les audits anonymes
    });
    
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} audits anonymes supprimés`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};