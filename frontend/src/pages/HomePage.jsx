import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitUrlForAudit } from '../api/auditService';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Alert from '../components/common/Alert';

const HomePage = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [animate, setAnimate] = useState(false);
  const navigate = useNavigate();

  // Animation au chargement de la page
  useEffect(() => {
    setAnimate(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation simple de l'URL
    if (!url) {
      setError('Veuillez entrer une URL');
      return;
    }

    // Validation avec regex pour vérifier format de l'URL
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/;
    if (!urlPattern.test(url)) {
      setError('Veuillez entrer une URL valide');
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
        {/* Section Hero avec animation */}
        <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight animate-fade-in-down">
              Analysez et <span className="text-yellow-400">optimisez</span> votre site web
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto opacity-90 animate-fade-in-up">
              Une analyse complète SEO, performance et UI/UX avec des recommandations générées par IA.
            </p>
            
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-8 relative animate-fade-in">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow relative shadow-lg rounded-lg overflow-hidden">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Entrez l'URL de votre site web (ex: example.com)"
                    className="w-full py-4 px-6 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-lg"
                  />
                  {url && (
                    <button 
                      type="button" 
                      onClick={() => setUrl('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`py-4 px-8 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-lg transition shadow-lg text-lg transform hover:scale-105 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyse en cours...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Analyser
                    </span>
                  )}
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
            
            {/* Badges des technologies */}
            <div className="flex flex-wrap justify-center gap-4 mt-12 animate-fade-in-up">
              <div className="py-2 px-4 bg-white bg-opacity-20 rounded-full text-sm flex items-center hover:bg-opacity-30 transition-all duration-300">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                SEO Optimisé
              </div>
              <div className="py-2 px-4 bg-white bg-opacity-20 rounded-full text-sm flex items-center hover:bg-opacity-30 transition-all duration-300">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Performance Web
              </div>
              <div className="py-2 px-4 bg-white bg-opacity-20 rounded-full text-sm flex items-center hover:bg-opacity-30 transition-all duration-300">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Analyses UI/UX
              </div>
              <div className="py-2 px-4 bg-white bg-opacity-20 rounded-full text-sm flex items-center hover:bg-opacity-30 transition-all duration-300">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Recommandations IA
              </div>
            </div>
          </div>
        </section>

        {/* Section des statistiques */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold text-indigo-600">100+</div>
                <p className="text-gray-600">Points de contrôle</p>
              </div>
              <div className="transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold text-indigo-600">3</div>
                <p className="text-gray-600">Types d'audit</p>
              </div>
              <div className="transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-gray-600">Recommandations IA</p>
              </div>
              <div className="transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600">Rapports exportables</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section Comment ça fonctionne - Modifiée: ligne jaune descendue et numéros plus visibles */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Comment ça fonctionne</h2>
              {/* Ligne jaune déplacée plus bas */}
              <div className="w-48 h-1 bg-yellow-500 mx-auto mt-3"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 pt-12 rounded-lg shadow-sm hover:shadow-lg transition duration-300 transform hover:-translate-y-1 relative">
                {/* Numéro au format badge horizontal sur le dessus */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="flex items-center justify-center bg-blue-600 text-white font-bold text-xl px-6 py-2 rounded-full shadow-lg">
                    <span>1</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl text-blue-500 mb-4 mx-auto">
                    <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">Entrez votre URL</h3>
                  <p className="text-gray-600">Indiquez simplement l'adresse de votre site web que vous souhaitez analyser.</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 pt-12 rounded-lg shadow-sm hover:shadow-lg transition duration-300 transform hover:-translate-y-1 relative">
                {/* Numéro au format badge horizontal sur le dessus */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="flex items-center justify-center bg-blue-600 text-white font-bold text-xl px-6 py-2 rounded-full shadow-lg">
                    <span>2</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl text-blue-500 mb-4 mx-auto">
                    <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">Obtenez un audit complet</h3>
                  <p className="text-gray-600">Notre système analyse votre site sous tous les angles: SEO, performance et UX/UI.</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 pt-12 rounded-lg shadow-sm hover:shadow-lg transition duration-300 transform hover:-translate-y-1 relative">
                {/* Numéro au format badge horizontal sur le dessus */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="flex items-center justify-center bg-blue-600 text-white font-bold text-xl px-6 py-2 rounded-full shadow-lg">
                    <span>3</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl text-blue-500 mb-4 mx-auto">
                    <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">Améliorez votre site</h3>
                  <p className="text-gray-600">Suivez nos recommandations personnalisées pour optimiser votre site web.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Section Fonctionnalités - Modifiée: ligne jaune descendue */}
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Pourquoi choisir WebAudit ?</h2>
              {/* Ligne jaune déplacée plus bas */}
              <div className="w-48 h-1 bg-yellow-500 mx-auto mt-3"></div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition duration-300 flex items-start group">
                <div className="mr-6 text-indigo-600 text-4xl transition duration-300 group-hover:scale-110">
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Analyse en temps réel</h3>
                  <p className="text-gray-600">Obtenez des résultats détaillés en quelques secondes, sans attente inutile.</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition duration-300 flex items-start group">
                <div className="mr-6 text-indigo-600 text-4xl transition duration-300 group-hover:scale-110">
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Conseils personnalisés</h3>
                  <p className="text-gray-600">Recommandations générées par IA spécifiquement adaptées à votre site web.</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition duration-300 flex items-start group">
                <div className="mr-6 text-indigo-600 text-4xl transition duration-300 group-hover:scale-110">
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Rapports complets</h3>
                  <p className="text-gray-600">Téléchargez des rapports détaillés au format PDF pour partager avec votre équipe.</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition duration-300 flex items-start group">
                <div className="mr-6 text-indigo-600 text-4xl transition duration-300 group-hover:scale-110">
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Suivi d'historique</h3>
                  <p className="text-gray-600">Suivez les progrès de votre site au fil du temps et visualisez les améliorations.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Section CTA */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Prêt à améliorer votre site web?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">Commencez votre audit maintenant et obtenez des recommandations personnalisées pour optimiser votre présence en ligne.</p>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="py-3 px-8 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-lg transition duration-300 transform hover:scale-105 flex items-center mx-auto"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              Démarrer un audit
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;