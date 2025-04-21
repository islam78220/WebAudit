const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schéma de l'utilisateur
const UserSchema = new mongoose.Schema({
  nom: { 
    type: String, 
    required: true, 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    match: [/^\S+@\S+\.\S+$/, 'Veuillez entrer une adresse e-mail valide']
  },
  entreprise: { 
    type: String, 
    required: true, 
  },
  telephone: { 
    type: String, 
    required: true, 
    match: [/^\+?[1-9]\d{1,14}$/, 'Veuillez entrer un numéro de téléphone valide']
  },
  role: { 
    type: String, 
    required: true, 
    enum: ['développeur', 'manager', 'responsable marketing', 'directeur', 'assistant', 'autre'],
    default: 'autre'
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6, // Longueur minimale pour le mot de passe
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
});

// Middleware pour hacher le mot de passe avant de le sauvegarder
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    next();
  } catch (error) {
    return next(error); // Passer l'erreur au gestionnaire de l'erreur
  }
});

// Méthode pour comparer le mot de passe
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Création du modèle Utilisateur
const User = mongoose.model('User', UserSchema);

module.exports = { User };
