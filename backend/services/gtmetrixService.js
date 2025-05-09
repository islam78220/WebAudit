const axios = require('axios');
const config = require('../config/config');
const cacheService = require('../utils/cache');

// Constantes pour le polling
const MAX_RETRIES = 20;
const RETRY_INTERVAL = 15000; // 15 secondes
const CACHE_TTL = 24 * 60 * 60; // 24 heures

// Fonction pour attendre la complétion d'un test GTmetrix
const waitForTestCompletion = async (gtmetrixClient, testId) => {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      // Vérifier l'état du test
      const testResponse = await gtmetrixClient.get(`/tests/${testId}`);
      const testState = testResponse.data.data.attributes.state;
      
      console.log(`État du test (tentative ${retries+1}/${MAX_RETRIES}): ${testState}`);
      
      if (testState === 'completed') {
        const reportId = testResponse.data.data.attributes.report;
        if (reportId) {
          console.log(`Test terminé avec succès, rapport disponible: ${reportId}`);
          return reportId;
        }
      } else if (testState === 'error') {
        throw new Error(`Le test GTmetrix a échoué avec l'état: ${testState}`);
      }
      
      // Attendre avant la prochaine vérification
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      retries++;
    } catch (error) {
      // Vérifier si c'est une redirection 303 (see other)
      if (error.response && error.response.status === 303 && error.response.headers.location) {
        console.log('Redirection 303 détectée, rapport disponible');
        // Extraire l'ID du rapport de l'URL de redirection
        const locationUrl = error.response.headers.location;
        const reportIdMatch = locationUrl.match(/\/reports\/([a-zA-Z0-9]+)$/);
        if (reportIdMatch && reportIdMatch[1]) {
          return reportIdMatch[1]; // Retourner l'ID du rapport
        }
      }
      
      console.error(`Erreur lors de la vérification du test (tentative ${retries+1}):`, error.message);
      
      // Continuer uniquement pour certains types d'erreurs temporaires
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || 
          (error.response && (error.response.status === 429 || error.response.status === 500))) {
        console.log('Erreur temporaire, nouvelle tentative...');
        await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
        retries++;
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error(`Le test GTmetrix n'a pas été complété après ${MAX_RETRIES} tentatives`);
};

// Fonction principale d'audit
exports.runAudit = async (url) => {
  try {
    // Vérifier si nous avons des résultats en cache
    const cacheKey = `gtmetrix_${url}`;
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      console.log(`Résultats GTmetrix récupérés du cache pour: ${url}`);
      return cachedResult;
    }
    
    // Vérifier la clé API
    if (!config.GTMETRIX_API_KEY) {
      console.warn('Aucune clé API GTmetrix configurée, utilisation de données fictives');
      const mockData = getMockGTmetrixData();
      await cacheService.set(cacheKey, mockData, CACHE_TTL);
      return {
        ...mockData,
        errorInfo: {
          code: 'NO_API_KEY',
          message: 'Aucune clé API GTmetrix configurée. Données simulées affichées.'
        }
      };
    }
    
    // Essayer d'obtenir des données réelles avec un timeout global
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('GTmetrix timeout global dépassé')), 300000); // 5 minutes
    });
    
    try {
      // Utiliser Promise.race pour implémenter un timeout global
      const result = await Promise.race([runGTmetrixAudit(url), timeoutPromise]);
      
      // Mettre en cache le résultat réussi
      await cacheService.set(cacheKey, result, CACHE_TTL);
      
      return result;
    } catch (specificError) {
      console.error('Erreur GTmetrix spécifique:', specificError.message);
      
      // Déterminer le type d'erreur pour une meilleure information à l'utilisateur
      let errorCode = 'UNKNOWN_ERROR';
      let errorMessage = 'Une erreur inconnue est survenue lors de l\'analyse GTmetrix.';
      
      if (specificError.message.includes('timeout') || specificError.code === 'ETIMEDOUT') {
        errorCode = 'TIMEOUT';
        errorMessage = 'L\'analyse GTmetrix a pris trop de temps. Veuillez réessayer plus tard.';
      } else if (specificError.message.includes('crédits') || 
                (specificError.response && specificError.response.status === 402)) {
        errorCode = 'INSUFFICIENT_CREDITS';
        errorMessage = 'Crédits GTmetrix insuffisants pour effectuer l\'analyse. Données simulées affichées.';
      } else if (specificError.message.includes('limite de débit') || 
                (specificError.response && specificError.response.status === 429)) {
        errorCode = 'RATE_LIMIT';
        errorMessage = 'Trop de requêtes GTmetrix. Veuillez réessayer dans quelques minutes. Données simulées affichées.';
      }
      
      // Générer et renvoyer des données fictives avec des informations d'erreur
      const mockData = getMockGTmetrixData();
      
      // Ajouter des informations sur l'erreur pour l'interface utilisateur
      const resultWithError = {
        ...mockData,
        errorInfo: {
          code: errorCode,
          message: errorMessage,
          originalError: specificError.message
        }
      };
      
      // Mettre en cache les données fictives pour éviter des appels répétés en erreur
      await cacheService.set(cacheKey, resultWithError, 300); // Cache plus court (5 minutes) pour les erreurs
      
      return resultWithError;
    }
  } catch (error) {
    console.error('Erreur critique GTmetrix:', error.message);
    throw error; // Ne pas utiliser de données fictives, laisser le contrôleur gérer l'erreur
  }
};

// Fonction pour exécuter l'audit GTmetrix
const runGTmetrixAudit = async (url) => {
  console.log('Démarrage de l\'audit GTmetrix pour:', url);
  console.log(`Clé API utilisée (masquée): ${maskApiKey(config.GTMETRIX_API_KEY)}`);

  // Créer une instance axios avec authentification et timeout augmenté
  const gtmetrixClient = axios.create({
    baseURL: 'https://gtmetrix.com/api/2.0',
    auth: {
      username: config.GTMETRIX_API_KEY,
      password: ''
    },
    headers: {
      'Content-Type': 'application/vnd.api+json'
    },
    timeout: 60000, // 60 secondes au lieu de 30
    maxRedirects: 0 // Ne pas suivre automatiquement les redirections
  });

  // 1. Démarrer le test
  let testId;
  try {
    const startResponse = await gtmetrixClient.post('/tests', {
      data: {
        type: "test",
        attributes: {
          url,
          report: "lighthouse"
        }
      }
    });
    
    testId = startResponse.data.data.id;
    console.log(`Test créé avec succès, ID: ${testId}`);
    console.log(`Crédits restants: ${startResponse.data.meta.credits_left}`);
    
    // Enregistrer les crédits restants pour informer l'utilisateur si nécessaire
    await cacheService.set('gtmetrix_credits', startResponse.data.meta.credits_left);
  } catch (startError) {
    console.error('Erreur lors du lancement du test GTmetrix:', startError.message);
    if (startError.response) {
      console.error('Status:', startError.response.status);
      console.error('Data:', JSON.stringify(startError.response.data));
    }
    
    throw new Error('Échec du lancement du test GTmetrix');
  }

  // 2. Attendre que le test soit terminé avec notre système de polling
  try {
    const reportId = await waitForTestCompletion(gtmetrixClient, testId);
    
    // 3. Récupérer le rapport
    const reportResponse = await gtmetrixClient.get(`/reports/${reportId}`);
    
    if (reportResponse.data && 
        reportResponse.data.data && 
        reportResponse.data.data.attributes) {
      
      const reportData = reportResponse.data.data.attributes;
      console.log('Rapport récupéré avec succès');
      
      // Extraire et mettre en cache les métriques
      const result = {
        isRealData: true, // Indicateur explicite
        loadTime: reportData.fully_loaded_time / 1000 || reportData.onload_time / 1000 || 0,
        pageSize: reportData.page_bytes / 1024 || 0,
        requests: reportData.page_requests || 0,
        gtmetrixGrade: reportData.gtmetrix_grade || '',
        performanceScore: reportData.performance_score || 0,
        structureScore: reportData.structure_score || 0,
        largestContentfulPaint: reportData.largest_contentful_paint / 1000 || 0,
        totalBlockingTime: reportData.total_blocking_time || 0,
        cumulativeLayoutShift: reportData.cumulative_layout_shift || 0,
        speedIndex: reportData.speed_index || 0,
        // Autres métriques utiles
        resourceBreakdown: reportData.resources_breakdown || {},
        reportId: reportId, // Stocke l'ID du rapport pour référence
        reportUrl: `https://gtmetrix.com/reports/${reportId}`, // URL du rapport GTmetrix
        timestamp: Date.now()
      };
      
      console.log('Résultats GTmetrix récupérés avec succès pour:', url);
      return result;
    }
  } catch (error) {
    console.error('Erreur lors de l\'attente ou de la récupération des résultats:', error.message);
    throw error;
  }
  
  throw new Error('Impossible de récupérer les résultats GTmetrix');
};

// Fonction pour masquer la clé API dans les logs
const maskApiKey = (apiKey) => {
  if (!apiKey) return 'undefined';
  const length = apiKey.length;
  if (length <= 5) return '*'.repeat(length);
  return `${apiKey.substring(0, 2)}${'*'.repeat(length - 4)}${apiKey.substring(length - 2)}`;
};

// Données fictives pour les cas d'erreur
const getMockGTmetrixData = () => {
  const mockId = `mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  console.log(`Returning mock GTmetrix data with ID: ${mockId}`);
  return {
    mockId: mockId, // Ajout d'un identifiant pour les données fictives
    isRealData: false, // Indicateur explicite
    loadTime: Math.random() * 5 + 1,
    pageSize: Math.random() * 2000 + 500,
    requests: Math.floor(Math.random() * 50) + 20,
    gtmetrixGrade: convertScoreToGrade(Math.floor(Math.random() * 30) + 70),
    performanceScore: Math.floor(Math.random() * 30) + 70,
    structureScore: Math.floor(Math.random() * 30) + 70,
    largestContentfulPaint: Math.random() * 3 + 1,
    totalBlockingTime: Math.floor(Math.random() * 500) + 100,
    cumulativeLayoutShift: Math.random() * 0.3,
    speedIndex: Math.floor(Math.random() * 3000) + 1000,
    resourceBreakdown: {
      html: Math.floor(Math.random() * 50) + 20,
      js: Math.floor(Math.random() * 500) + 200,
      css: Math.floor(Math.random() * 100) + 50,
      images: Math.floor(Math.random() * 1000) + 300,
      fonts: Math.floor(Math.random() * 200) + 50,
      other: Math.floor(Math.random() * 100) + 30
    },
    reportId: mockId,
    reportUrl: null,
    timestamp: Date.now(),
    isMockData: true // Flag indiquant clairement que ce sont des données fictives
  };
};

// Fonction pour convertir le score en grade (A-F)
function convertScoreToGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  if (score >= 50) return 'E';
  return 'F';
}