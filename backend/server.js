import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import des routes
import authRoutes from './routes/authRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
// Connexion à la base de données MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connexion à MongoDB réussie'))
  .catch((err) => console.error('Erreur de connexion à MongoDB:', err));


// Utilisation des routes
app.use('/api/auth', authRoutes);
app.use('/api/audit', auditRoutes);

// Lancer le serveur
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Serveur lancé sur le port ${port}`));
