import { useState } from 'react';

const UiUxTab = ({ data }) => {
  const [expandedIssue, setExpandedIssue] = useState(null);

  if (!data) {
    return <div>Aucune donnée UI/UX disponible</div>;
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

  // Extraire les données d'accessibilité
  const score = data.score || 0;
  const accessibilityScore = data.accessibility || 0;
  const interactiveTime = data.interactiveTime ? `${data.interactiveTime.toFixed(2)}s` : 'N/A';
  const responsiveDesign = data.responsiveDesign || false;
  const issues = data.issues || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Audit UI/UX</h2>
        <div className="bg-amber-100 text-amber-800 font-medium rounded-full px-4 py-1 text-lg">
          Score: {score}%
        </div>
      </div>
      
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Accessibilité</h3>
          <p className="text-2xl font-bold text-gray-900">{accessibilityScore}%</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Temps d'interactivité</h3>
          <p className="text-2xl font-bold text-gray-900">{interactiveTime}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Design Responsive</h3>
          <div className="flex items-center">
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${responsiveDesign ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} mr-2`}>
              {responsiveDesign ? '✓' : '✗'}
            </span>
            <p className="text-xl font-bold text-gray-900">{responsiveDesign ? 'Oui' : 'Non'}</p>
          </div>
        </div>
      </div>
      
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
              <p className="text-gray-600">Aucun problème UI/UX détecté.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UiUxTab;