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
          // Vérifier si errorInfo est présent dans les données de performance
          // Vérifier si errorInfo est présent dans les données de performance
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
      const pdfBlob = await downloadAuditReport(auditId);
      
      // Créer un lien et déclencher le téléchargement
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `webaudit-report-${auditId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Erreur lors du téléchargement du rapport:", err);
      setError(err.message || "Impossible de télécharger le rapport");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!auditId) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center max-w-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Aucun audit en cours</h2>
            <p className="mb-6 text-gray-600">Veuillez soumettre une URL sur la page d'accueil pour lancer un audit.</p>
            <button 
              onClick={() => navigate('/')}
              className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !auditData) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center max-w-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Erreur</h2>
            <p className="mb-6 text-red-600">{error}</p>
            <button 
              onClick={() => navigate('/')}
              className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700"
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
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-gray-100 py-8">
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
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="bg-blue-600 text-white p-4">
                <h1 className="text-2xl font-bold">Audit pour: {auditData.url}</h1>
                <p className="text-blue-100">
                  Date: {new Date(auditData.overview?.timestamp || auditData.createdAt).toLocaleString()}
                </p>
              </div>
              
              <div className="p-4 md:p-6">
                {/* Navigation des onglets */}
                <div className="border-b border-gray-200">
                  <nav className="flex -mb-px">
                    <button
                      className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                        activeTab === 'overview'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('overview')}
                    >
                      Vue d'ensemble
                    </button>
                    <button
                      className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                        activeTab === 'seo'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('seo')}
                    >
                      SEO
                    </button>
                    <button
                      className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                        activeTab === 'performance'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('performance')}
                    >
                      Performance
                    </button>
                    <button
                      className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                        activeTab === 'uiux'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('uiux')}
                    >
                      UI/UX
                    </button>
                  </nav>
                </div>
                
                {/* Contenu des onglets */}
                <div className="py-6">
                  {activeTab === 'overview' && <OverviewTab data={auditData} />}
                  {activeTab === 'seo' && <SeoTab data={auditData.seo} />}
                  {activeTab === 'performance' && <PerformanceTab data={auditData.performance} />}
                  {activeTab === 'uiux' && <UiUxTab data={auditData.uiUx} />}
                </div>
                
                {/* Bouton de téléchargement du rapport */}
                <div className="mt-6 text-center">
                  <button
                    onClick={handleDownloadReport}
                    className="bg-green-600 hover:bg-green-700 text-white py-3 px-8 rounded-lg font-medium flex items-center justify-center mx-auto"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Télécharger le rapport complet (PDF)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
