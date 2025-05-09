const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    let error = { ...err };
    error.message = err.message;
    
    // Erreur de validation MongoDB
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message);
      error = { message };
      return res.status(400).json({
        success: false,
        error: message
      });
    }
    
    // Erreur d'ID MongoDB invalide
    if (err.name === 'CastError') {
      const message = `Ressource non trouvée avec l'ID ${err.value}`;
      error = { message };
      return res.status(404).json({
        success: false,
        error: message
      });
    }
    
    // Erreur de doublon MongoDB
    if (err.code === 11000) {
      const message = 'Valeur en doublon entrée';
      error = { message };
      return res.status(400).json({
        success: false,
        error: message
      });
    }
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Erreur serveur'
    });
  };
  
  module.exports = errorHandler;
  