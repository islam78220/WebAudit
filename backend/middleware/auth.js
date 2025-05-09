const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

// Middleware pour protéger les routes
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Vérifier si le token est présent dans les headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé à accéder à cette ressource'
      });
    }
    
    try {
      // Vérifier le token
      const decoded = jwt.verify(token, config.JWT_SECRET);
      
      // Ajouter l'utilisateur à la requête
      req.user = await User.findById(decoded.id);
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé à accéder à cette ressource'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Middleware optionnel pour les routes qui peuvent être accessibles avec ou sans authentification
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    // Vérifier si le token est présent dans les headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      
      try {
        // Vérifier le token
        const decoded = jwt.verify(token, config.JWT_SECRET);
        
        // Ajouter l'utilisateur à la requête
        req.user = await User.findById(decoded.id);
      } catch (error) {
        // Si le token est invalide, continuer sans utilisateur
        req.user = null;
      }
    } else {
      // Si pas de token, continuer sans utilisateur
      req.user = null;
    }
    
    next();
  } catch (error) {
    next(error);
  }
};
