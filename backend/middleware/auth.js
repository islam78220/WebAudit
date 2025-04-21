const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware pour vérifier l'authentification des utilisateurs
const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Le token est généralement dans le format "Bearer token"

  if (!token) {
    return res.status(401).json({ message: 'Token manquant, autorisation refusée' });
  }

  try {
    // Vérifier et décoder le token avec la clé secrète
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attacher les informations de l'utilisateur décodées à la requête
    next(); // Passer au middleware suivant ou à la route
  } catch (error) {
    console.error('Erreur de vérification du token :', error);
    return res.status(401).json({ message: 'Token invalide ou expiré' }); // Plus explicite sur le type d'erreur
  }
};

// Middleware pour générer un token JWT de manière sécurisée
const generateAuthToken = (user) => {
  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '1h' } // Durée configurable
  );
  return token; // Retourner le token généré
};

module.exports = { authenticate, generateAuthToken };
