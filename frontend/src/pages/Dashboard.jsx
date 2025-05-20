import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getAuditResults, downloadAuditReport } from '../api/auditService';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import OverviewTab from '../components/dashboard/OverviewTab';
import SeoTab from '../components/dashboard/SeoTab';
import PerformanceTab from '../components/dashboard/PerformanceTab';
import UiUxTab from '../components/dashboard/UiUxTab';
import Alert from '../components/common/Alert';

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auditId = searchParams.get('auditId');
  
  const [activeTab, setActiveTab] = useState('overview');
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gtmetrixWarning, setGtmetrixWarning] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Calculer le score global
  const getGlobalScore = () => {
    if (!auditData) return 0;
    
    const seoScore = auditData.seo?.score || 0;
    const performanceScore = auditData.performance?.score || 0;
    const uiUxScore = auditData.uiUx?.score || 0;
    
    return Math.round((seoScore + performanceScore + uiUxScore) / 3);
  };

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBgScoreColorClass = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  useEffect(() => {
    const fetchAuditData = async () => {
      if (!auditId) {
        setError("ID d'audit non spécifié dans l'URL");
        setLoading(false);
        return;
      }

      try {
        console.log("Récupération des données pour l'audit:", auditId);
        const data = await getAuditResults(auditId);
        
        if (!data) {
          throw new Error("Aucune donnée d'audit reçue");
        }

        console.log("Données d'audit reçues:", data);
        setAuditData(data);

        // Vérifier si les données GTmetrix sont simulées
        if (data.performance && data.performance.gtmetrixGrade) {
          const errorInfo = data.performance.errorInfo || {};
          
          if (errorInfo.code) {
            let warningMessage = '';
            
            switch (errorInfo.code) {
              case 'NO_API_KEY':
                warningMessage = "Aucune clé API GTmetrix configurée. Les données de performance sont simulées.";
                break;
              case 'INSUFFICIENT_CREDITS':
                warningMessage = "Crédits GTmetrix insuffisants. Les données de performance sont simulées.";
                break;
              case 'RATE_LIMIT':
                warningMessage = "Limite de requêtes GTmetrix atteinte. Les données de performance sont simulées.";
                break;
              case 'TIMEOUT':
                warningMessage = "L'analyse GTmetrix a pris trop de temps. Les données de performance sont simulées.";
                break;
              default:
                warningMessage = "Les données de performance GTmetrix sont simulées.";
            }
            
            setGtmetrixWarning(warningMessage);
          } else if (!data.performance.isRealData) {
            setGtmetrixWarning("Les données de performance GTmetrix sont simulées.");
          }
        }
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        setError(err.message || "Erreur lors du chargement des données d'audit");
      } finally {
        setLoading(false);
      }
    };

    fetchAuditData();
  }, [auditId]);

  const handleDownloadReport = async () => {
    if (!auditId) {
      setError("ID d'audit non disponible");
      return;
    }

    try {
      setIsDownloading(true);
      const pdfBlob = await downloadAuditReport(auditId);
      
      // Créer un lien et déclencher le téléchargement
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `webaudit-report-${auditId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Nettoyer l'URL
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur lors du téléchargement du rapport:", err);
      setError(err.message || "Impossible de télécharger le rapport");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}/dashboard?auditId=${auditId}`;
    
    // Copier l'URL dans le presse-papier
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Erreur lors de la copie du lien: ', err);
      });
  };

  // Afficher l'état de chargement
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex-grow flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Analyse de votre site en cours...</p>
            <p className="text-gray-500 mt-2">Merci de patienter quelques instants</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Afficher un message si aucun auditId n'est fourni
  if (!auditId) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex-grow flex items-center justify-center pt-20 p-4">
          <div className="text-center max-w-xl bg-white p-8 rounded-xl shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Aucun audit en cours</h2>
            <p className="mb-6 text-gray-600">Veuillez soumettre une URL sur la page d'accueil pour lancer un audit.</p>
            <button
              onClick={() => navigate('/')}
              className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Afficher un message d'erreur si le chargement a échoué
  if (error && !auditData) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex-grow flex items-center justify-center pt-20 p-4">
          <div className="text-center max-w-xl bg-white p-8 rounded-xl shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Erreur</h2>
            <p className="mb-6 text-red-600">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow pt-8 pb-8">
        <div className="container mx-auto px-4">
          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError('')}
            />
          )}
          
          {gtmetrixWarning && (
            <Alert
              type="info"
              message={gtmetrixWarning}
              onClose={() => setGtmetrixWarning('')}
            />
          )}
          
          {auditData && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 transition-all duration-300">
              {/* En-tête du dashboard - style modifié */}
              <div className="bg-white border-b border-gray-200 rounded-t-xl shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold mb-1 text-gray-800">
                        Audit pour: {auditData.url}
                      </h1>
                      <p className="text-gray-500 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Date: {new Date(auditData.overview?.timestamp || auditData.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-4 md:mt-0">
                    <div className="relative mr-4">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-medium mb-1 text-gray-500">Score Global</span>
                        <span className={`text-xl font-bold ${getScoreColorClass(getGlobalScore())}`}>{getGlobalScore()}%</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setShowShareModal(true)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors duration-300 flex items-center"
                        title="Partager cet audit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                      
                      <button 
                        onClick={handleDownloadReport}
                        disabled={isDownloading}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors duration-300 flex items-center"
                        title="Télécharger le rapport PDF"
                      >
                        {isDownloading ? (
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Score cards - style modifié */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-indigo-50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold mb-1 text-gray-700">SEO</h3>
                      <p className={`text-2xl font-bold ${getScoreColorClass(auditData.seo?.score || 0)}`}>
                        {Math.round(auditData.seo?.score || 0)}%
                      </p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold mb-1 text-gray-700">Performance</h3>
                      <p className={`text-2xl font-bold ${getScoreColorClass(auditData.performance?.score || 0)}`}>
                        {Math.round(auditData.performance?.score || 0)}%
                      </p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  
                  <div className="bg-amber-50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold mb-1 text-gray-700">UI/UX</h3>
                      <p className={`text-2xl font-bold ${getScoreColorClass(auditData.uiUx?.score || 0)}`}>
                        {Math.round(auditData.uiUx?.score || 0)}%
                      </p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Navigation des onglets */}
              <div className="p-4 md:p-6">
                <div className="mb-6">
                  <nav className="flex flex-wrap -mb-px">
                    <button
                      className={`py-4 px-6 flex items-center border-b-2 font-medium text-sm transition-colors duration-200 ${
                        activeTab === 'overview'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('overview')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${activeTab === 'overview' ? 'text-blue-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Vue d'ensemble
                    </button>
                    <button
                      className={`py-4 px-6 flex items-center border-b-2 font-medium text-sm transition-colors duration-200 ${
                        activeTab === 'seo'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('seo')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${activeTab === 'seo' ? 'text-blue-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      SEO
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getBgScoreColorClass(auditData.seo?.score || 0)} text-white`}>
                        {Math.round(auditData.seo?.score || 0)}%
                      </span>
                    </button>
                    <button
                      className={`py-4 px-6 flex items-center border-b-2 font-medium text-sm transition-colors duration-200 ${
                        activeTab === 'performance'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('performance')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${activeTab === 'performance' ? 'text-blue-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Performance
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getBgScoreColorClass(auditData.performance?.score || 0)} text-white`}>
                        {Math.round(auditData.performance?.score || 0)}%
                      </span>
                    </button>
                    <button
                      className={`py-4 px-6 flex items-center border-b-2 font-medium text-sm transition-colors duration-200 ${
                        activeTab === 'uiux'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('uiux')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${activeTab === 'uiux' ? 'text-blue-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                      UI/UX
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getBgScoreColorClass(auditData.uiUx?.score || 0)} text-white`}>
                        {Math.round(auditData.uiUx?.score || 0)}%
                      </span>
                    </button>
                  </nav>
                </div>

                {/* Contenu des onglets */}
                <div className="bg-gray-50 rounded-lg p-6 transition-opacity duration-300">
                  {activeTab === 'overview' && <OverviewTab data={auditData} />}
                  {activeTab === 'seo' && <SeoTab data={auditData.seo} />}
                  {activeTab === 'performance' && <PerformanceTab data={auditData.performance} />}
                  {activeTab === 'uiux' && <UiUxTab data={auditData.uiUx} />}
                </div>

                {/* Actions en pied de page */}
                <div className="mt-6 flex flex-col md:flex-row justify-between items-center bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-4 md:mb-0">
                    <button 
                      onClick={() => navigate('/')}
                      className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                      </svg>
                      Nouvel audit
                    </button>
                  </div>
                  
                  <button
                    onClick={handleDownloadReport}
                    disabled={isDownloading}
                    className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center transition-colors duration-300"
                  >
                    {isDownloading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Télécharger le rapport complet (PDF)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Modal de partage - Modifié: Twitter retiré, LinkedIn conservé, Gmail ajouté */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all duration-300 scale-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Partager cet audit</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">Copiez le lien ci-dessous pour partager cet audit :</p>
            
            <div className="flex">
              <input 
                type="text" 
                value={`${window.location.origin}/dashboard?auditId=${auditId}`}
                readOnly
                className="flex-grow p-2 border border-gray-300 rounded-l-md bg-gray-50 text-gray-800"
              />
              <button
                onClick={handleShareLink}
                className={`${copied ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'} px-4 text-white rounded-r-md transition-colors duration-300 flex items-center`}
              >
                {copied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copié!
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Copier
                  </>
                )}
              </button>
            </div>
            
            <div className="mt-6 flex justify-between">
              <div className="flex space-x-4">
                <button 
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                  onClick={() => {
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}/dashboard?auditId=${auditId}`)}`, '_blank');
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </button>
                <button 
                  className="text-red-500 hover:text-red-700 flex items-center"
                  onClick={() => {
                    const subject = encodeURIComponent("Résultats d'audit WebAudit");
                    const body = encodeURIComponent(`Découvrez les résultats de mon audit WebAudit: ${window.location.origin}/dashboard?auditId=${auditId}`);
                    window.location.href = `mailto:?subject=${subject}&body=${body}`;
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors duration-300"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default Dashboard;                