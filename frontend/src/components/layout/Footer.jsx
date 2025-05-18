const Footer = () => {
    return (
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-xl font-bold mb-4">WebAudit</h2>
              <p className="text-gray-400">Analysez et améliorez votre site web en un clic</p>
            </div>
            
            <div className="mb-6 md:mb-0">
              <h3 className="text-lg font-semibold mb-3">Liens rapides</h3>
              <ul className="space-y-2">
                <li><a href="/" className="text-gray-400 hover:text-white">Accueil</a></li>
                <li><a href="/dashboard" className="text-gray-400 hover:text-white">Dashboard</a></li>
                <li><a href="/login" className="text-gray-400 hover:text-white">Connexion</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Contact</h3>
              <p className="text-gray-400">support@webaudit.com</p>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} WebAudit. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    );
  };
  
  export default Footer;