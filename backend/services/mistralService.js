// mistralService.js
const axios = require('axios');
const config = require('../config/config');

// Cache pour stocker les recommandations par type de problème
const recommendationsCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures

// Paramètres pour la gestion du rate limiting
const MAX_CONCURRENT_REQUESTS = 3; // Nombre maximal de requêtes simultanées
const RETRY_DELAYS = [1000, 2000, 5000, 10000, 15000]; // Délais de retry exponentiels en ms

// Configuration de la langue pour les recommandations
const LANGUAGE = 'fr'; // 'fr' pour français, 'en' pour anglais

exports.generateRecommendations = async (issues, category) => {
  try {
    if (!config.MISTRAL_API_KEY) {
      console.warn('Mistral AI API key not found, returning mock recommendations');
      return Promise.all(issues.map(issue => Promise.resolve(getMockRecommendation(issue, category))));
    }

    // Log pour déboguer la diversité des problèmes
    console.log(`Génération de recommandations pour ${issues.length} problèmes de type ${category}`);
    
    // Vérifier rapidement s'il y a des ID uniques
    const hasUniqueIds = issues.every(issue => issue.id);
    if (!hasUniqueIds) {
      console.warn('Attention: Certains problèmes n\'ont pas d\'ID unique, ce qui peut causer des recommandations dupliquées');
    }

    // Traiter les problèmes par lots pour limiter les requêtes simultanées
    const results = [];
    const batches = [];
    
    // Diviser les problèmes en lots
    for (let i = 0; i < issues.length; i += MAX_CONCURRENT_REQUESTS) {
      batches.push(issues.slice(i, i + MAX_CONCURRENT_REQUESTS));
    }
    
    // Traiter chaque lot séquentiellement
    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(issue => processIssue(issue, category))
      );
      results.push(...batchResults);
      
      // Attendre un peu entre les lots pour éviter de frapper les limites de rate
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  } catch (error) {
    console.error('Erreur lors de la génération des recommandations:', error);
    return issues.map((issue, index) => 
      getMockRecommendation(issue, category, `${category}-${index}-${Date.now()}`)
    );
  }
};

// Fonction pour traiter un problème individuel
async function processIssue(issue, category) {
  // Créer un identifiant unique pour chaque problème s'il n'en a pas déjà un
  const issueId = issue.id || `${category}-${issue.description}-${Date.now()}`;
  
  // Vérifier si une recommandation pour ce type de problème existe dans le cache
  const cacheKey = `${category}-${issue.description}`;
  const cachedRecommendation = checkCache(cacheKey);
  if (cachedRecommendation) {
    console.log(`Recommandation récupérée du cache pour problème ${issueId}`);
    return cachedRecommendation;
  }
  
  // Définir les termes spécifiques à la langue
  const langTerms = {
    fr: {
      seo: 'SEO',
      performance: 'performance web',
      uiux: 'UI/UX et accessibilité',
      expert: 'Tu es un expert en optimisation web spécialisé en',
      problem: 'Voici un problème détecté sur un site web',
      specific: 'Problème spécifique',
      details: 'Détails',
      severity: 'Sévérité',
      type: 'Type',
      audit: 'ID audit',
      instruction: 'Donne une recommandation spécifique et technique pour résoudre ce problème précis. ' +
                 'Évite les conseils génériques et concentre-toi sur des solutions pratiques que les développeurs peuvent mettre en œuvre. ' +
                 'Limite ta réponse à 2-3 phrases maximum et sois précis. ' +
                 'Ta réponse doit être UNIQUEMENT en français.'
    },
    en: {
      seo: 'SEO',
      performance: 'web performance',
      uiux: 'UI/UX and accessibility',
      expert: 'You are a web optimization expert specialized in',
      problem: 'Here is an issue detected on a website',
      specific: 'Specific issue',
      details: 'Details',
      severity: 'Severity',
      type: 'Type',
      audit: 'Audit ID',
      instruction: 'Provide a specific and technical recommendation to solve this precise issue. ' +
                 'Avoid generic advice and focus on practical solutions that developers can implement. ' +
                 'Limit your response to 2-3 sentences maximum and be precise. ' +
                 'Your response must be ONLY in English.'
    }
  };
  
  // Sélectionner les termes selon la langue configurée
  const terms = langTerms[LANGUAGE] || langTerms.fr;
  const categoryLabel = category === 'seo' ? terms.seo : (category === 'performance' ? terms.performance : terms.uiux);
  
  // Inclure l'ID du problème, l'URL et tous les détails dans le prompt
  const prompt = `
    ${terms.expert} ${categoryLabel}.
    ${terms.problem} (${issue.url || 'URL non spécifiée'}):

    ${terms.specific}: ${issue.description}
    ${terms.details}: ${issue.details || "Pas de détails supplémentaires disponibles"}
    ${terms.severity}: ${issue.severity}
    ${terms.type}: ${issue.type || category}
    ${terms.audit}: ${issue.auditId || "non spécifié"}
    
    ${terms.instruction}
  `;

  // Tentative avec stratégie de retry
  let recommendation;
  let retryCount = 0;
  
  while (retryCount < RETRY_DELAYS.length) {
    try {
      const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
        model: 'mistral-medium',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8, // Augmenté pour plus de diversité
        max_tokens: 150
      }, {
        headers: {
          'Authorization': `Bearer ${config.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      recommendation = response.data.choices[0].message.content.trim();
      console.log(`Recommandation générée pour problème ${issueId}: ${recommendation.substring(0, 30)}...`);
      
      // Mettre en cache la recommandation
      cacheRecommendation(cacheKey, recommendation);
      
      return recommendation;
    } catch (apiError) {
      const status = apiError.response?.status;
      
      // Si erreur de rate limit (429), on attend et on réessaie
      if (status === 429) {
        console.warn(`Rate limit atteint (429), tentative ${retryCount + 1}/${RETRY_DELAYS.length}. Attente de ${RETRY_DELAYS[retryCount]/1000} secondes...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[retryCount]));
        retryCount++;
      } else {
        // Pour les autres erreurs, on utilise une recommandation fictive
        console.error(`Erreur API Mistral (${status || 'inconnue'}):`
            , apiError.message);
        recommendation = getMockRecommendation(issue, category, issueId);
        break;
      }
    }
  }
  
  // Si on a épuisé toutes les tentatives, on utilise une recommandation fictive
  if (retryCount >= RETRY_DELAYS.length) {
    console.warn(`Échec après ${RETRY_DELAYS.length} tentatives, utilisation d'une recommandation fictive`);
    recommendation = getMockRecommendation(issue, category, issueId);
  }
  
  return recommendation;
}

// Vérifier si une recommandation existe dans le cache
function checkCache(key) {
  const cached = recommendationsCache.get(key);
  if (cached && cached.timestamp > Date.now() - CACHE_TTL) {
    return cached.recommendation;
  }
  return null;
}

// Mettre en cache une recommandation
function cacheRecommendation(key, recommendation) {
  recommendationsCache.set(key, {
    timestamp: Date.now(),
    recommendation
  });
}

// Générer des recommandations fictives en cas d'erreur ou d'absence de clé API
const getMockRecommendation = (issue, category, seed = null) => {
  // Utiliser l'ID ou l'URL comme seed pour assurer la diversité des recommandations
  const seedValue = seed || issue.id || issue.url || `${category}-${issue.description}-${Date.now()}`;
  const seedHash = typeof seedValue === 'string' ? 
    seedValue.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 
    Date.now();
  
  // Utiliser le hash pour sélectionner une recommandation de manière déterministe
  const random = (seedHash % 1000) / 1000;

  // Sélectionner les recommandations dans la langue configurée
  const recommendations = LANGUAGE === 'en' ? getEnglishRecommendations() : getFrenchRecommendations();

  const severityRecommendations = recommendations[category]?.[issue.severity] || recommendations[category]?.medium;
  if (!severityRecommendations) {
    return LANGUAGE === 'en' 
      ? `To solve this ${category} issue, examine your code and follow industry best practices.`
      : `Pour résoudre ce problème de ${category}, examinez votre code et suivez les bonnes pratiques du secteur.`;
  }
  
  // Utiliser le hash de seed pour sélectionner une recommandation
  const index = Math.floor(random * severityRecommendations.length);
  return severityRecommendations[index];
};

// Recommandations en français
function getFrenchRecommendations() {
  return {
    seo: {
      high: [
        "Ajoutez des balises meta description pertinentes contenant vos mots-clés principaux. Assurez-vous qu'elles soient entre 120 et 158 caractères pour optimiser leur visibilité dans les résultats de recherche.",
        "Intégrez des balises H1 appropriées avec vos mots-clés principaux. Structurez votre contenu avec des sous-titres H2 et H3 pour améliorer la lisibilité et le référencement.",
        "Corrigez les erreurs d'URL canoniques en implémentant des balises rel='canonical' cohérentes sur toutes vos pages. Cela évitera les problèmes de contenu dupliqué.",
        "Assurez-vous que tous vos liens sont en HTML standard plutôt qu'en JavaScript. Évitez d'utiliser onclick pour la navigation et préférez des balises <a href> traditionnelles pour une meilleure indexation.",
        "Vérifiez votre fichier robots.txt et supprimez toute directive bloquant l'accès aux pages importantes. Utilisez Google Search Console pour identifier les URL bloquées au crawling."
      ],
      medium: [
        "Optimisez les attributs alt des images avec des descriptions pertinentes incluant vos mots-clés. Cela améliorera l'accessibilité et le référencement des images.",
        "Mettez en place un sitemap XML et soumettez-le aux moteurs de recherche. Assurez-vous qu'il soit à jour et comprenne toutes vos pages importantes.",
        "Améliorez la structure des URLs en utilisant des mots-clés pertinents et en évitant les paramètres inutiles. Préférez des URLs courtes et descriptives.",
        "Optimisez les titres de vos pages en incluant vos mots-clés principaux en début de titre, tout en maintenant une longueur inférieure à 60 caractères pour éviter la troncature dans les SERP.",
        "Implémentez des balises hreflang pour les sites multilingues afin d'indiquer aux moteurs de recherche quelle version linguistique afficher dans les résultats de recherche."
      ],
      low: [
        "Ajoutez des données structurées (Schema.org) pour enrichir l'affichage de vos résultats dans les moteurs de recherche. Concentrez-vous sur les types pertinents pour votre activité.",
        "Optimisez le texte des liens internes avec des ancres descriptives contenant vos mots-clés secondaires. Évitez les ancres génériques comme 'cliquez ici'.",
        "Améliorez la longueur et la qualité de votre contenu en visant au moins 600 mots par page avec une densité de mots-clés optimale (2-3%).",
        "Ajoutez des attributs title aux liens importants pour fournir des informations supplémentaires aux utilisateurs et aux moteurs de recherche sur la destination du lien.",
        "Optimisez votre balise title en incluant votre mot-clé principal et votre marque. Maintenez une longueur entre 50 et 60 caractères pour une visibilité optimale dans les SERP."
      ]
    },
    performance: {
      high: [
        "Compressez et optimisez vos images en utilisant des formats modernes comme WebP et AVIF. Implémentez le lazy loading avec loading='lazy' pour les images sous la ligne de flottaison.",
        "Réduisez le temps de réponse initial du serveur en optimisant les requêtes de base de données, en augmentant les ressources serveur, ou en utilisant un CDN pour distribuer le contenu statique.",
        "Minimisez et compressez vos fichiers JavaScript avec Terser ou UglifyJS. Utilisez les attributs async ou defer pour éviter le blocage du rendu pendant le chargement des scripts.",
        "Éliminez les ressources bloquant le rendu en déplaçant les CSS critiques inline dans le <head> et en chargeant de manière asynchrone les styles non critiques avec loadCSS ou preload.",
        "Réduisez le temps d'exécution JavaScript en révisant votre code pour éliminer les opérations inutiles, optimiser les boucles, et éviter les reflows et repaints fréquents du DOM."
      ],
      medium: [
        "Réduisez le nombre de requêtes HTTP en regroupant vos fichiers CSS et JavaScript. Utilisez la concaténation pour limiter les appels au serveur.",
        "Optimisez le rendu critique en minimisant les CSS bloquants. Identifiez et intégrez les styles essentiels directement dans le HTML.",
        "Implémentez la compression GZIP ou Brotli sur votre serveur pour réduire la taille des fichiers transférés. Cela peut réduire jusqu'à 70% le volume de données.",
        "Utilisez HTTP/2 ou HTTP/3 pour permettre le multiplexage des requêtes sur une seule connexion, améliorant ainsi la vitesse de chargement des ressources multiples.",
        "Adoptez une stratégie de mise en cache efficace en configurant des en-têtes Cache-Control appropriés pour les ressources statiques, avec des TTL adaptés à la fréquence de mise à jour."
      ],
      low: [
        "Réduisez les redirections inutiles qui augmentent le temps de chargement. Chaque redirection ajoute un aller-retour supplémentaire au serveur.",
        "Optimisez le chargement des polices web en utilisant font-display:swap et en limitant le nombre de variantes. Considérez l'utilisation de polices système quand c'est possible.",
        "Implémentez le préchargement pour les ressources critiques avec <link rel='preload'>. Cela permettra au navigateur de les charger plus tôt dans le processus.",
        "Utilisez des solutions comme IntersectionObserver pour charger les contenus hors écran uniquement lorsqu'ils entrent dans le viewport, améliorant ainsi les performances perçues.",
        "Optimisez vos animations en utilisant uniquement les propriétés CSS qui déclenchent uniquement la composition (transform et opacity) pour éviter les repaints coûteux."
      ]
    },
    'ui-ux': {
      high: [
        "Améliorez le contraste des couleurs pour garantir une meilleure lisibilité. Visez un ratio minimum de 4.5:1 pour le texte standard et 3:1 pour les grands textes conformément aux WCAG 2.1 AA.",
        "Ajoutez des attributs ARIA appropriés aux éléments interactifs non standard. Assurez-vous que tous les éléments sont accessibles au clavier et aux lecteurs d'écran en suivant les patterns ARIA établis.",
        "Structurez correctement vos formulaires avec des labels explicites associés à chaque champ via l'attribut for. Ajoutez des messages d'erreur clairs avec aria-describedby pour améliorer l'accessibilité.",
        "Assurez-vous que tous les éléments interactifs ont un nom accessible. Utilisez des textes descriptifs pour les boutons et ajoutez des attributs alt appropriés aux images cliquables.",
        "Implémentez une hiérarchie de titres logique et séquentielle (H1-H6) pour structurer votre contenu, facilitant la navigation pour les utilisateurs de lecteurs d'écran."
      ],
      medium: [
        "Optimisez la navigation mobile avec des zones tactiles suffisamment grandes (minimum 44x44px). Évitez de placer les éléments cliquables trop près les uns des autres pour réduire les erreurs de toucher.",
        "Améliorez la hiérarchie visuelle de votre contenu pour guider l'œil de l'utilisateur. Utilisez la taille, la couleur et l'espacement pour établir l'importance relative des éléments.",
        "Implémentez des retours visuels clairs pour toutes les interactions (hover, focus, active). Les utilisateurs doivent toujours savoir où ils se trouvent et ce qui est cliquable.",
        "Assurez-vous que votre site est utilisable avec le clavier uniquement. Vérifiez que l'ordre de tabulation est logique et que l'indicateur de focus est clairement visible.",
        "Optimisez les formulaires en regroupant les champs connexes avec fieldset et legend, en fournissant des instructions claires, et en validant les données côté client avec feedback immédiat."
      ],
      low: [
        "Ajoutez des animations subtiles pour améliorer l'expérience utilisateur, tout en respectant les préférences de réduction de mouvement (prefers-reduced-motion).",
        "Optimisez la lecture sur mobile en utilisant une taille de police d'au moins 16px et un interlignage suffisant (1.5). Évitez les longs paragraphes sans rupture.",
        "Améliorez la cohérence de votre interface en standardisant les composants UI comme les boutons, formulaires et cartes à travers tout votre site.",
        "Utilisez des microinteractions pour fournir un feedback sur les actions des utilisateurs, rendant l'interface plus engageante et informative sans surcharger l'expérience.",
        "Optimisez l'espacement et la densité d'information de votre interface en utilisant une grille cohérente et en respectant la loi de proximité pour regrouper visuellement les éléments liés."
      ]
    }
  };
}

// Recommandations en anglais
function getEnglishRecommendations() {
  return {
    seo: {
      high: [
        "Add relevant meta description tags containing your main keywords. Ensure they are between 120 and 158 characters to optimize their visibility in search results.",
        "Implement appropriate H1 tags with your main keywords. Structure your content with H2 and H3 subtitles to improve readability and SEO.",
        "Fix canonical URL errors by implementing consistent rel='canonical' tags across all your pages. This will prevent duplicate content issues.",
        "Ensure all your links are in standard HTML rather than JavaScript. Avoid using onclick for navigation and prefer traditional <a href> tags for better indexing.",
        "Check your robots.txt file and remove any directives blocking access to important pages. Use Google Search Console to identify URLs blocked from crawling."
      ],
      medium: [
        "Optimize image alt attributes with relevant descriptions including your keywords. This will improve both accessibility and image SEO.",
        "Set up an XML sitemap and submit it to search engines. Ensure it is up-to-date and includes all your important pages.",
        "Improve your URL structure by using relevant keywords and avoiding unnecessary parameters. Prefer short and descriptive URLs.",
        "Optimize your page titles by including your main keywords at the beginning, while maintaining a length under 60 characters to avoid truncation in SERPs.",
        "Implement hreflang tags for multilingual sites to indicate to search engines which language version to display in search results."
      ],
      low: [
        "Add structured data (Schema.org) to enrich the display of your results in search engines. Focus on the types relevant to your business.",
        "Optimize internal link text with descriptive anchors containing your secondary keywords. Avoid generic anchors like 'click here'.",
        "Improve the length and quality of your content by aiming for at least 600 words per page with an optimal keyword density (2-3%).",
        "Add title attributes to important links to provide additional information to users and search engines about the link destination.",
        "Optimize your title tag by including your main keyword and your brand. Maintain a length between 50 and 60 characters for optimal visibility in SERPs."
      ]
    },
    performance: {
      high: [
        "Compress and optimize your images using modern formats like WebP and AVIF. Implement lazy loading with loading='lazy' for images below the fold.",
        "Reduce initial server response time by optimizing database queries, increasing server resources, or using a CDN to distribute static content.",
        "Minimize and compress your JavaScript files with Terser or UglifyJS. Use async or defer attributes to avoid render blocking during script loading.",
        "Eliminate render-blocking resources by moving critical CSS inline in the <head> and loading non-critical styles asynchronously with loadCSS or preload.",
        "Reduce JavaScript execution time by revising your code to eliminate unnecessary operations, optimize loops, and avoid frequent DOM reflows and repaints."
      ],
      medium: [
        "Reduce the number of HTTP requests by bundling your CSS and JavaScript files. Use concatenation to limit server calls.",
        "Optimize critical rendering by minimizing blocking CSS. Identify and integrate essential styles directly in the HTML.",
        "Implement GZIP or Brotli compression on your server to reduce the size of transferred files. This can reduce data volume by up to 70%.",
        "Use HTTP/2 or HTTP/3 to allow multiplexing of requests on a single connection, improving the loading speed of multiple resources.",
        "Adopt an efficient caching strategy by configuring appropriate Cache-Control headers for static resources, with TTLs adapted to the update frequency."
      ],
      low: [
        "Reduce unnecessary redirects that increase loading time. Each redirect adds an additional round trip to the server.",
        "Optimize web font loading by using font-display:swap and limiting the number of variants. Consider using system fonts when possible.",
        "Implement preloading for critical resources with <link rel='preload'>. This will allow the browser to load them earlier in the process.",
        "Use solutions like IntersectionObserver to load off-screen content only when it enters the viewport, thus improving perceived performance.",
        "Optimize your animations by using only CSS properties that trigger only composition (transform and opacity) to avoid costly repaints."
      ]
    },
    'ui-ux': {
      high: [
        "Improve color contrast to ensure better readability. Aim for a minimum ratio of 4.5:1 for standard text and 3:1 for large text in accordance with WCAG 2.1 AA.",
        "Add appropriate ARIA attributes to non-standard interactive elements. Ensure all elements are accessible via keyboard and screen readers by following established ARIA patterns.",
        "Properly structure your forms with explicit labels associated with each field via the for attribute. Add clear error messages with aria-describedby to improve accessibility.",
        "Ensure all interactive elements have an accessible name. Use descriptive text for buttons and add appropriate alt attributes to clickable images.",
        "Implement a logical and sequential heading hierarchy (H1-H6) to structure your content, facilitating navigation for screen reader users."
      ],
      medium: [
        "Optimize mobile navigation with sufficiently large touch targets (minimum 44x44px). Avoid placing clickable elements too close together to reduce touch errors.",
        "Improve the visual hierarchy of your content to guide the user's eye. Use size, color, and spacing to establish the relative importance of elements.",
        "Implement clear visual feedback for all interactions (hover, focus, active). Users should always know where they are and what is clickable.",
        "Ensure your site is usable with keyboard only. Check that the tab order is logical and that the focus indicator is clearly visible.",
        "Optimize forms by grouping related fields with fieldset and legend, providing clear instructions, and validating data client-side with immediate feedback."
      ],
      low: [
        "Add subtle animations to improve the user experience, while respecting motion reduction preferences (prefers-reduced-motion).",
        "Optimize mobile reading by using a font size of at least 16px and sufficient line height (1.5). Avoid long paragraphs without breaks.",
        "Improve the consistency of your interface by standardizing UI components such as buttons, forms, and cards across your site.",
        "Use microinteractions to provide feedback on user actions, making the interface more engaging and informative without overloading the experience.",
        "Optimize spacing and information density of your interface using a consistent grid and respecting the law of proximity to visually group related elements."
      ]
    }
  };
}