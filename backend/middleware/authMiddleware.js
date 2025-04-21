const jwt = require('jsonwebtoken');

// Middleware pour vérifier si l'utilisateur est authentifié
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization') && req.header('Authorization').replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attacher l'utilisateur décodé au request
    next(); // Passer au prochain middleware ou contrôleur
  } catch (error) {
    return res.status(400).json({ message: 'Token invalide.' });
  }
};


module.exports = authMiddleware;
