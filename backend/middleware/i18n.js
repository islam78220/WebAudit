const i18n = require('../utils/i18n');
const config = require('../config/config');

/**
 * Middleware pour la gestion des langues
 * Détecte la langue demandée par le client et la rend disponible dans la requête
 */
exports.handleLanguage = (req, res, next) => {
  // Vérifier la langue dans l'en-tête Accept-Language, dans les query params ou utiliser la langue par défaut
  let lang = req.query.lang || req.headers['accept-language'] || config.DEFAULT_LANGUAGE;
  
  // Si l'en-tête Accept-Language contient plusieurs langues, extraire la première
  if (lang.includes(',')) {
    lang = lang.split(',')[0].trim();
  }
  
  // Si la langue contient un sous-code (fr-FR, en-US, etc.), extraire le code principal
  if (lang.includes('-')) {
    lang = lang.split('-')[0].trim();
  }
  
  // Vérifier si la langue est supportée
  const supportedLanguages = i18n.getSupportedLanguages();
  if (!supportedLanguages.includes(lang)) {
    lang = config.DEFAULT_LANGUAGE;
  }
  
  // Stocker la langue dans la requête pour y accéder plus tard
  req.language = lang;
  
  // Ajouter une fonction de traduction pour la langue actuelle
  req.t = (key, replacements = {}) => i18n.translate(key, lang, replacements);
  
  // Étendre la fonction res.json pour traduire automatiquement les messages
  const originalJson = res.json;
  res.json = function(obj) {
    const translatedObj = i18n.translateResponseMessages(obj, lang);
    return originalJson.call(this, translatedObj);
  };
  
  next();
};