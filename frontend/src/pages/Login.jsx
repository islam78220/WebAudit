import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Alert from '../components/common/Alert';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, user, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Rediriger si l'utilisateur est déjà connecté
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from);
    }
  }, [user, navigate, location]);
  
  // Réinitialiser l'erreur à chaque changement de formulaire
  useEffect(() => {
    clearError();
    setFormError('');
  }, [email, password, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!email || !password) {
      setFormError('Veuillez remplir tous les champs');
      return;
    }
    
    setLoading(true);
    try {
      await login(email, password);
      // Pas besoin de rediriger ici, l'effet ci-dessus s'en chargera
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow flex items-center justify-center bg-gray-100 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Connexion</h2>
          
          {(formError || error) && (
            <Alert 
              type="error" 
              message={formError || error} 
              onClose={() => {
                setFormError('');
                clearError();
              }}
            />
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 font-medium mb-2">Mot de passe</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>
          
          <p className="mt-6 text-center text-gray-600">
            Pas encore de compte ? <Link to="/register" className="text-blue-600 hover:text-blue-800">S'inscrire</Link>
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Login;