import { useState } from 'react';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import SimulatedDataNotice from '../common/SimulatedDataNotice';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PerformanceTab = ({ data }) => {
  const [expandedIssue, setExpandedIssue] = useState(null);

  if (!data) {
    return <div>Aucune donnée de performance disponible</div>;
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Extraire les métriques GTmetrix et Lighthouse
  const score = data.score || 0;
  const loadTime = data.loadTime || 0;
  const pageSize = data.pageSize ? `${(data.pageSize / 1024).toFixed(2)} MB` : 'N/A';
  const requests = data.requests || 0;
  const gtmetrixGrade = data.gtmetrixGrade || 'N/A';
  const largestContentfulPaint = data.largestContentfulPaint ? `${data.largestContentfulPaint.toFixed(2)}s` : 'N/A';
  const totalBlockingTime = data.totalBlockingTime ? `${data.totalBlockingTime}ms` : 'N/A';
  const cumulativeLayoutShift = data.cumulativeLayoutShift ? data.cumulativeLayoutShift.toFixed(4) : 'N/A';
  const speedIndex = data.speedIndex ? `${(data.speedIndex / 1000).toFixed(2)}s` : 'N/A';
  const interactiveTime = data.interactiveTime ? `${data.interactiveTime.toFixed(2)}s` : 'N/A';
  const mobileOptimization = data.mobileOptimization ? `${data.mobileOptimization}%` : 'N/A';
  
  // Données pour le graphique Doughnut
  const scoreChartData = {
    labels: ['Score Performance'],
    datasets: [
      {
        data: [score, 100 - score],
        backgroundColor: ['#10B981', '#E5E7EB'],
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

  // Vérifier si des données GTmetrix sont disponibles
  const hasGtmetrixData = data.gtmetrixGrade || data.largestContentfulPaint || data.totalBlockingTime;

  // Afficher un message si les données sont simulées
  const isSimulatedData = data.isRealData === false || data.errorInfo?.code;
  
  const issues = data.issues || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Audit Performance</h2>
        <div className="bg-green-100 text-green-800 font-medium rounded-full px-4 py-1 text-lg">
          Score: {score}%
        </div>
      </div>
      
      {isSimulatedData && (
        <SimulatedDataNotice 
          type="GTmetrix" 
          errorCode={data.errorInfo?.code} 
        />
      )}
      
      {/* Graphique de score et métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 col-span-1 flex flex-col items-center justify-center">
          <div className="h-48 w-48 relative">
            <Doughnut data={scoreChartData} options={chartOptions} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">{score}%</span>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mt-4">Score Global</h3>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 col-span-3">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Métriques clés</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Temps de chargement</p>
              <p className="text-xl font-semibold text-gray-800">{loadTime.toFixed(2)}s</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Taille de la page</p>
              <p className="text-xl font-semibold text-gray-800">{pageSize}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Requêtes HTTP</p>
              <p className="text-xl font-semibold text-gray-800">{requests}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Temps d'interactivité</p>
              <p className="text-xl font-semibold text-gray-800">{interactiveTime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Optimisation mobile</p>
              <p className="text-xl font-semibold text-gray-800">{mobileOptimization}</p>
            </div>
            {gtmetrixGrade && (
              <div>
                <p className="text-sm text-gray-500">Grade GTmetrix</p>
                <p className="text-xl font-semibold text-gray-800">{gtmetrixGrade}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Métriques avancées GTmetrix */}
      {hasGtmetrixData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Métriques GTmetrix</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Largest Contentful Paint</p>
              <p className="text-xl font-semibold text-gray-800">{largestContentfulPaint}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Blocking Time</p>
              <p className="text-xl font-semibold text-gray-800">{totalBlockingTime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cumulative Layout Shift</p>
              <p className="text-xl font-semibold text-gray-800">{cumulativeLayoutShift}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Speed Index</p>
              <p className="text-xl font-semibold text-gray-800">{speedIndex}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Liste des problèmes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Problèmes détectés ({issues.length})</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {issues.length > 0 ? (
            issues.map((issue, index) => (
              <div key={index} className="p-6">
                <div className="flex flex-wrap items-start gap-2 mb-3">
                  <span className={`${getSeverityColor(issue.severity)} font-medium px-2.5 py-0.5 rounded-full text-xs`}>
                    {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                  </span>
                  <h4 className="text-lg font-medium text-gray-800">
                    {issue.description}
                  </h4>
                </div>
                
                {/* Afficher les détails de l'erreur si disponibles */}
                {issue.details && (
                  <div className="mb-4">
                    <button
                      onClick={() => setExpandedIssue(expandedIssue === index ? null : index)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      {expandedIssue === index ? "Masquer les détails" : "Afficher les détails"}
                      <svg className={`w-4 h-4 ml-1 transform ${expandedIssue === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {expandedIssue === index && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                        {issue.details}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Recommandation IA */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <h5 className="font-medium text-blue-700 mb-2">Recommandation</h5>
                  <p className="text-gray-800">{issue.recommendation || "Aucune recommandation disponible."}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-600">Aucun problème de performance détecté.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceTab;