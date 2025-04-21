const { check, validationResult } = require('express-validator');

// Validation pour l'inscription de l'utilisateur
const validateRegistration = [
  check('nom').notEmpty().withMessage('Le nom est requis'),
  check('email').isEmail().withMessage('L\'email doit être valide'),
  check('password').isLength({ min: 6 }).withMessage('Le mot de passe doit avoir au moins 6 caractères')
];

// Middleware pour vérifier si la validation a échoué
const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  next(); // Si la validation passe, continuer vers le contrôleur
};

module.exports = { validateRegistration, validationMiddleware };
