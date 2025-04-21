// Middleware global de gestion des erreurs
const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack); // Afficher l'erreur dans la console pour le débogage
  
    res.status(err.statusCode || 500).json({
      message: err.message || 'Erreur interne du serveur.',
      stack: process.env.NODE_ENV === 'production' ? null : err.stack, // Ne pas exposer la stack en production
    });
  };
  
  module.exports = errorMiddleware;
  