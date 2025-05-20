import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const OverviewTab = ({ data }) => {
  if (!data) {
    return <div>Aucune donnée disponible</div>;
  }

  // Fonction pour formater les scores (arrondir les nombres)
  const formatScore = (score) => {
    return Math.round(score || 0);
  };

  // Extraire les scores des différentes catégories
  const seoScore = data.seo?.score || 0;
  const performanceScore = data.performance?.score || 0;
  const uiUxScore = data.uiUx?.score || 0;
  
  // Récupérer les métriques d'overview
  const url = data.url || '';
  const timestamp = data.overview?.timestamp || data.createdAt;
  const metaDescription = data.seo?.metaDescription || 'Non définie';
  const canonicalUrl = data.seo?.canonicalUrl || url;
  
  // Obtenir des informations sur les problèmes
  const seoIssuesCount = data.seo?.issues?.length || 0;
  const performanceIssuesCount = data.performance?.issues?.length || 0;
  const uiUxIssuesCount = data.uiUx?.issues?.length || 0;
  
  // Calculer le nombre de problèmes par sévérité
  const getCriticalCount = () => {
    let count = 0;
    if (data.seo?.issues) count += data.seo.issues.filter(i => i.severity === 'high').length;
    if (data.performance?.issues) count += data.performance.issues.filter(i => i.severity === 'high').length;
    if (data.uiUx?.issues) count += data.uiUx.issues.filter(i => i.severity === 'high').length;
    return count;
  };
  
  const getImportantCount = () => {
    let count = 0;
    if (data.seo?.issues) count += data.seo.issues.filter(i => i.severity === 'medium').length;
    if (data.performance?.issues) count += data.performance.issues.filter(i => i.severity === 'medium').length;
    if (data.uiUx?.issues) count += data.uiUx.issues.filter(i => i.severity === 'medium').length;
    return count;
  };
  
  const getMinorCount = () => {
    let count = 0;
    if (data.seo?.issues) count += data.seo.issues.filter(i => i.severity === 'low').length;
    if (data.performance?.issues) count += data.performance.issues.filter(i => i.severity === 'low').length;
    if (data.uiUx?.issues) count += data.uiUx.issues.filter(i => i.severity === 'low').length;
    return count;
  };
  
  const criticalCount = getCriticalCount();
  const importantCount = getImportantCount();
  const minorCount = getMinorCount();
  
  // Données pour les graphiques avec scores arrondis
  const seoChartData = {
    labels: ['Score SEO'],
    datasets: [
      {
        data: [formatScore(seoScore), 100 - formatScore(seoScore)],
        backgroundColor: ['#4F46E5', '#E5E7EB'],
        borderWidth: 0,
      },
    ],
  };

  const performanceChartData = {
    labels: ['Score Performance'],
    datasets: [
      {
        data: [formatScore(performanceScore), 100 - formatScore(performanceScore)],
        backgroundColor: ['#10B981', '#E5E7EB'],
        borderWidth: 0,
      },
    ],
  };

  const uiuxChartData = {
    labels: ['Score UI/UX'],
    datasets: [
      {
        data: [formatScore(uiUxScore), 100 - formatScore(uiUxScore)],
        backgroundColor: ['#F59E0B', '#E5E7EB'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    cutout: '70%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // Fonction pour obtenir une classe de couleur basée sur le score
  const getScoreColorClass = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Vue d'ensemble</h2>
      
      {/* Scores et graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-indigo-50 rounded-lg p-6 text-center">
          <div className="mb-4 h-48 relative">
            <Doughnut data={seoChartData} options={chartOptions} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-3xl font-bold ${getScoreColorClass(seoScore)}`}>{formatScore(seoScore)}%</span>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">SEO</h3>
          <p className="text-gray-600 mt-2">
            {seoScore >= 80 ? 'Excellent' : seoScore >= 60 ? 'Bon' : seoScore >= 40 ? 'Moyen' : 'À améliorer'}
          </p>
          <p className="text-sm mt-3 text-gray-500">{seoIssuesCount} problème(s) détecté(s)</p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-6 text-center">
          <div className="mb-4 h-48 relative">
            <Doughnut data={performanceChartData} options={chartOptions} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-3xl font-bold ${getScoreColorClass(performanceScore)}`}>{formatScore(performanceScore)}%</span>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Performance</h3>
          <p className="text-gray-600 mt-2">
            {performanceScore >= 80 ? 'Excellent' : performanceScore >= 60 ? 'Bon' : performanceScore >= 40 ? 'Moyen' : 'À améliorer'}
          </p>
          <p className="text-sm mt-3 text-gray-500">{performanceIssuesCount} problème(s) détecté(s)</p>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-6 text-center">
          <div className="mb-4 h-48 relative">
            <Doughnut data={uiuxChartData} options={chartOptions} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-3xl font-bold ${getScoreColorClass(uiUxScore)}`}>{formatScore(uiUxScore)}%</span>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">UI/UX</h3>
          <p className="text-gray-600 mt-2">
            {uiUxScore >= 80 ? 'Excellent' : uiUxScore >= 60 ? 'Bon' : uiUxScore >= 40 ? 'Moyen' : 'À améliorer'}
          </p>
          <p className="text-sm mt-3 text-gray-500">{uiUxIssuesCount} problème(s) détecté(s)</p>
        </div>
      </div>
      
      {/* Informations générales */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Informations sur la page</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700">URL</h4>
            <p className="text-gray-800 break-words">{url}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700">Date d'audit</h4>
            <p className="text-gray-800">{new Date(timestamp).toLocaleString()}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700">Meta Description</h4>
            <p className="text-gray-800 break-words">{metaDescription}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700">URL Canonique</h4>
            <p className="text-gray-800 break-words">{canonicalUrl}</p>
          </div>
        </div>
      </div>
      
      {/* Résumé des problèmes */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Résumé des problèmes</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <div className="flex items-center mb-2">
              <span className="bg-red-100 text-red-800 font-medium px-2.5 py-0.5 rounded-full text-xs mr-2">Critique</span>
              <span className="text-gray-700 font-medium">{criticalCount}</span>
            </div>
            <p className="text-gray-600 text-sm">Problèmes critiques nécessitant une attention immédiate</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center mb-2">
              <span className="bg-yellow-100 text-yellow-800 font-medium px-2.5 py-0.5 rounded-full text-xs mr-2">Important</span>
              <span className="text-gray-700 font-medium">{importantCount}</span>
            </div>
            <p className="text-gray-600 text-sm">Problèmes importants à résoudre rapidement</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center mb-2">
              <span className="bg-blue-100 text-blue-800 font-medium px-2.5 py-0.5 rounded-full text-xs mr-2">Mineur</span>
              <span className="text-gray-700 font-medium">{minorCount}</span>
            </div>
            <p className="text-gray-600 text-sm">Problèmes mineurs à améliorer</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;