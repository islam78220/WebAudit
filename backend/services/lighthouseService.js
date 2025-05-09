
exports.runAudit = async (url) => {
  try {
    // Garantir que l'URL est unique pour éviter les problèmes de cache
    const uniqueUrl = `${url}${url.includes('?') ? '&' : '?'}cache=${Date.now()}`;
    
    console.log(`Lancement d'un nouvel audit Lighthouse pour: ${url} (URL unique: ${uniqueUrl})`);
    
    // Corriger l'importation dynamique pour extraire correctement les modules
    const lighthouse = await import('lighthouse');
    const chromeLauncher = await import('chrome-launcher');
    
    // Utiliser les modules importés correctement
    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
    });

    // Options pour Lighthouse
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port
    };

    // Exécuter Lighthouse avec l'URL unique
    const runnerResult = await lighthouse.default(uniqueUrl, options);

    // Fermer Chrome
    await chrome.kill();

    // Extraire les résultats
    const { lhr } = runnerResult;
    
    console.log('Categories disponibles:', Object.keys(lhr.categories));
    
    // Vérifier si les catégories nécessaires existent
    if (!lhr.categories.performance || !lhr.categories.accessibility || !lhr.categories.seo) {
      console.error('Catégories manquantes dans les résultats Lighthouse:', lhr.categories);
      throw new Error('Résultats Lighthouse incomplets');
    }
    
    // Formater les résultats avec vérification des propriétés
    const result = {
      performance: {
        score: (lhr.categories.performance && lhr.categories.performance.score) ? lhr.categories.performance.score * 100 : 0,
        issues: extractIssues(lhr.audits, 'performance', url),
        interactiveTime: lhr.audits['interactive'] ? lhr.audits['interactive'].numericValue : 0,
        mobileOptimization: lhr.audits['viewport'] ? (lhr.audits['viewport'].score || 0) * 100 : 0
      },
      accessibility: {
        score: (lhr.categories.accessibility && lhr.categories.accessibility.score) ? lhr.categories.accessibility.score * 100 : 0,
        issues: extractIssues(lhr.audits, 'accessibility', url),
        responsiveDesign: lhr.audits['content-width'] ? lhr.audits['content-width'].score === 1 : false
      },
      seo: {
        score: (lhr.categories.seo && lhr.categories.seo.score) ? lhr.categories.seo.score * 100 : 0,
        issues: extractIssues(lhr.audits, 'seo', url),
        keywords: extractKeywords(lhr),
        metaDescription: lhr.audits['meta-description']?.details?.items?.[0]?.content || '',
        canonicalUrl: lhr.audits['canonical']?.details?.items?.[0]?.url || url
      }
    };

    // Log détaillé des résultats pour débogage
    console.log(`Résultats Lighthouse pour ${url}:`, JSON.stringify({
      performance: result.performance.score,
      accessibility: result.accessibility.score,
      seo: result.seo.score,
      issueCount: {
        performance: result.performance.issues.length,
        accessibility: result.accessibility.issues.length,
        seo: result.seo.issues.length
      }
    }));

    return result;
  } catch (error) {
    console.error('Erreur lors de l\'audit Lighthouse:', error);
    throw new Error('Impossible d\'effectuer l\'audit Lighthouse');
  }
};

// Fonction améliorée pour extraire les problèmes des audits
const extractIssues = (audits, category, url) => {
  const issues = [];
  
  if (!audits) {
    console.warn('Aucun audit disponible pour l\'extraction des problèmes');
    return issues;
  }

  // Mapping direct des catégories Lighthouse
  const categoryMapping = {
    'performance': ['first-contentful-paint', 'speed-index', 'largest-contentful-paint', 'interactive', 'total-blocking-time', 'cumulative-layout-shift', 'server-response-time', 'render-blocking-resources', 'unminified-css', 'unminified-javascript', 'unused-css-rules', 'unused-javascript', 'efficient-animated-content', 'duplicated-javascript'],
    'accessibility': ['accesskeys', 'aria-allowed-attr', 'aria-required-attr', 'aria-roles', 'button-name', 'color-contrast', 'form-field-multiple-labels', 'html-has-lang', 'image-alt', 'input-image-alt', 'label', 'tabindex', 'td-headers-attr', 'valid-lang'],
    'seo': ['meta-description', 'http-status-code', 'font-size', 'crawlable-anchors', 'link-text', 'is-crawlable', 'robots-txt', 'canonical', 'hreflang', 'structured-data']
  };

  // Mots-clés pour catégoriser dans chaque catégorie
  const keywordMapping = {
    'performance': ['performance', 'speed', 'time', 'load', 'render', 'resource', 'javascript-execution', 'css', 'image', 'cache', 'server-response'],
    'accessibility': ['accessibility', 'a11y', 'aria', 'contrast', 'label', 'alt', 'keyboard', 'focus', 'tabindex'],
    'seo': ['seo', 'crawl', 'robots', 'meta', 'description', 'canonical', 'link', 'anchor', 'text']
  };

  for (const [key, audit] of Object.entries(audits)) {
    // Vérification de sécurité pour éviter les erreurs avec des audits incomplets
    if (!audit || audit.score === 1 || audit.score === null) continue;
    
    // Déterminer la catégorie d'audit
    let auditCategory = 'other';
    
    // Vérifier d'abord les mappings directs
    for (const [cat, auditIds] of Object.entries(categoryMapping)) {
      if (auditIds.some(id => key === id || key.startsWith(id))) {
        auditCategory = cat;
        break;
      }
    }
    
    // Si aucune correspondance directe, utiliser les mots-clés
    if (auditCategory === 'other') {
      for (const [cat, keywords] of Object.entries(keywordMapping)) {
        if (keywords.some(keyword => 
          key.includes(keyword) || 
          (audit.title && audit.title.toLowerCase().includes(keyword)) ||
          (audit.description && audit.description.toLowerCase().includes(keyword))
        )) {
          auditCategory = cat;
          break;
        }
      }
    }

    // Ajouter l'issue si elle correspond à la catégorie demandée
    if (auditCategory === category || category === 'all') {
      // Ajouter un ID unique pour chaque problème pour éviter les doublons
      const issueId = `${key}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      issues.push({
        id: issueId,
        description: audit.title || 'Problème non spécifié',
        severity: getSeverity(audit.score),
        type: auditCategory,
        details: audit.description || 'Pas de détails disponibles',
        auditId: key, // Inclure l'ID d'audit original pour le débogage
        url: url  // Inclure l'URL pour assurer la diversité des recommandations
      });
    }
  }

  // Journaliser pour le débogage
  console.log(`Extrait ${issues.length} problèmes pour la catégorie ${category}`);
  
  return issues;
};

// Fonction pour déterminer la sévérité selon le score
const getSeverity = (score) => {
  if (score < 0.5) return 'high';
  if (score < 0.9) return 'medium';
  return 'low';
};

// Fonction pour extraire les mots-clés potentiels
const extractKeywords = (lhr) => {
  const keywords = [];

  if (!lhr || !lhr.audits) {
    console.warn('Données LHR incomplètes pour l\'extraction des mots-clés');
    return keywords;
  }

  // Extraction à partir du titre de la page
  if (lhr.audits['document-title']?.details?.items?.[0]?.content) {
    try {
      const title = lhr.audits['document-title'].details.items[0].content;
      const titleWords = title.split(' ').filter(word => word.length > 3);
      keywords.push(...titleWords);
    } catch (error) {
      console.warn('Erreur lors de l\'extraction des mots-clés depuis le titre:', error);
    }
  }

  // Extraction à partir des titres (headings)
  if (lhr.audits['heading-levels']?.details?.items) {
    try {
      const headings = lhr.audits['heading-levels'].details.items;
      headings.forEach(heading => {
        if (heading && heading.content) {
          const headingWords = heading.content.split(' ').filter(word => word.length > 3);
          keywords.push(...headingWords);
        }
      });
    } catch (error) {
      console.warn('Erreur lors de l\'extraction des mots-clés depuis les titres:', error);
    }
  }

  // Retourner un tableau unique de mots-clés
  return [...new Set(keywords)];
};