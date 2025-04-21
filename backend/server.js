const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const { User } = require('./models/User');
const { authenticate, generateAuthToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
const auditRoutes = require('./routes/auditRoutes');
const authRoutes = require('./routes/authRoutes'); // ton auth.js
const userRoutes = require('./routes/userRoutes'); // si tu en as

app.use('/api', auditRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limiter à 10 requêtes par minute
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
});
app.use(limiter);

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log(err));

// Gestionnaire d'erreur global
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

// Route d'inscription
app.post('/register', async (req, res) => {
  try {
    const { nom, email, password, entreprise, telephone, role } = req.body;
    
    if (!nom || !email || !password || !entreprise || !telephone || !role) {
      return res.status(400).json({ message: 'Veuillez fournir tous les champs requis' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    const newUser = new User({ nom, email, password,
       entreprise, telephone, role });
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

// Route protégée (Exemple)
app.get('/user', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
