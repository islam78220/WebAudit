import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitUrlForAudit } from '../api/auditService';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Alert from '../components/common/Alert';

const HomePage = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation simple de l'URL
    if (!url) {
      setError('Veuillez entrer une URL');
      return;
    }
    
    setLoading(true);
    try {
      const response = await submitUrlForAudit(url);
      
      if (!response || !response.auditId) {
        throw new Error("Impossible de récupérer l'ID de l'audit");
      }
      
      navigate(`/dashboard?auditId=${response.auditId}`);
    } catch (err) {
      console.error("Erreur lors de la soumission:", err);
      setError(err.message || "Erreur lors de la soumission de l'URL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <section className="bg-gradient-to-b from-blue-600 to-blue-800 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Analysez et optimisez votre site web en quelques secondes
            </h1>
            <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto">
              WebAudit vous aide à améliorer votre SEO, performance et UX/UI avec des recommandations personnalisées alimentées par l'IA.
            </p>
            
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Entrez l'URL de votre site web (ex: https://example.com)"
                  className="flex-grow py-3 px-4 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={`py-3 px-8 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-lg transition ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Analyse en cours...' : 'Analyser'}
                </button>
              </div>
              {error && (
                <Alert 
                  type="error" 
                  message={error} 
                  onClose={() => setError('')}
                />
              )}
            </form>
          </div>
        </section>
        
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Comment ça fonctionne</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-100 p-6 rounded-lg text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">Entrez votre URL</h3>
                <p className="text-gray-600">Indiquez simplement l'adresse de votre site web que vous souhaitez analyser.</p>
              </div>
              
              <div className="bg-gray-100 p-6 rounded-lg text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">Obtenez un audit complet</h3>
                <p className="text-gray-600">Notre système analyse votre site sous tous les angles: SEO, performance et UX/UI.</p>
              </div>
              
              <div className="bg-gray-100 p-6 rounded-lg text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">Améliorez votre site</h3>
                <p className="text-gray-600">Suivez nos recommandations personnalisées pour optimiser votre site web.</p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8 text-gray-800">Pourquoi choisir WebAudit ?</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Analyse en temps réel</h3>
                <p className="text-gray-600">Obtenez des résultats détaillés en quelques secondes.</p>
              </div>
              
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Conseils personnalisés</h3>
                <p className="text-gray-600">Recommandations générées par IA pour votre site spécifique.</p>
              </div>
              
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Rapports complets</h3>
                <p className="text-gray-600">Téléchargez des rapports détaillés pour partager avec votre équipe.</p>
              </div>
              
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Suivi d'historique</h3>
                <p className="text-gray-600">Suivez les progrès de votre site au fil du temps.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;
