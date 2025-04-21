const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

const { User } = require('./models/User');
const authMiddleware = require('./middleware/authMiddleware');
const { generateAuthToken } = require('./controllers/authController');

// Chargement des variables d’environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de parsing JSON
app.use(bodyParser.json());

// Rate Limiting – doit être défini AVANT les routes
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requêtes par minute
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
});
app.use(limiter);

// Connexion à MongoDB sans les options dépréciées
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connexion à MongoDB réussie'))
  .catch(err => console.error('Erreur de connexion MongoDB:', err));

// Importation des routes
const auditRoutes = require('./routes/auditRoutes');

// Utilisation des routes
app.use('/api', auditRoutes);

// Route d’inscription
app.post('/register', async (req, res) => {
  try {
    const { nom, email, password, entreprise, telephone } = req.body;

    if (!nom || !email || !password || !entreprise || !telephone ) {
      return res.status(400).json({ message: 'Veuillez fournir tous les champs requis' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    const newUser = new User({ nom, email, password, entreprise, telephone});
    await newUser.save();

    res.status(201).json({ message: 'Utilisateur inscrit avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
});

// Route de connexion
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }

    const token = generateAuthToken(user);

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Exemple de route protégée
app.get('/user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Gestionnaire d’erreurs global
app.use((err, req, res, next) => {
  console.error('Erreur non capturée :', err);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(` Serveur lancé sur le port ${PORT}`);
});
