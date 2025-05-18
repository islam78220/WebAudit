import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-blue-600 text-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">WebAudit</Link>
        
        <div className="hidden md:flex space-x-6">
          <Link to="/" className="hover:text-blue-200">Accueil</Link>
          <Link to="/dashboard" className="hover:text-blue-200">Dashboard</Link>
          {user ? (
            <>
              <Link to="/history" className="hover:text-blue-200">Historique</Link>
              <button onClick={logout} className="hover:text-blue-200">Déconnexion</button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-200">Connexion</Link>
              <Link to="/register" className="hover:text-blue-200">Inscription</Link>
            </>
          )}
        </div>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {/* Hamburger icon */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-blue-700 pb-4 px-4">
          <Link to="/" className="block py-2 hover:text-blue-200">Accueil</Link>
          <Link to="/dashboard" className="block py-2 hover:text-blue-200">Dashboard</Link>
          {user ? (
            <>
              <Link to="/history" className="block py-2 hover:text-blue-200">Historique</Link>
              <button onClick={logout} className="block w-full text-left py-2 hover:text-blue-200">Déconnexion</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block py-2 hover:text-blue-200">Connexion</Link>
              <Link to="/register" className="block py-2 hover:text-blue-200">Inscription</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;