// controllers/authController.js
const { User } = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Fonction pour générer un token JWT
const generateAuthToken = (user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return token;
};

// Inscription d'un nouvel utilisateur
exports.registerUser = async (req, res) => {
  try {
    const { nom, email, entreprise, telephone, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'L\'email est déjà pris' });
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de l'utilisateur
    user = new User({
      nom,
      email,
      entreprise,
      telephone,
      password: hashedPassword,
    });

    await user.save();

    // Génération du token
    const token = generateAuthToken(user);

    // Retourner une réponse avec le token
    res.status(201).json({ message: 'Utilisateur créé avec succès', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
};

// Connexion d'un utilisateur existant
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Recherche de l'utilisateur dans la base de données
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérification du mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Génération du token
    const token = generateAuthToken(user);

    // Retourner une réponse avec le token
    res.json({ message: 'Connexion réussie', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
};
