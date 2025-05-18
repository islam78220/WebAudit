const SimulatedDataNotice = ({ type, errorCode }) => {
    let message = "Les données sont simulées et peuvent ne pas refléter les valeurs réelles.";
    
    switch (errorCode) {
      case 'NO_API_KEY':
        message = `Aucune clé API ${type} configurée. Les données sont simulées.`;
        break;
      case 'INSUFFICIENT_CREDITS':
        message = `Crédits ${type} insuffisants. Les données sont simulées.`;
        break;
      case 'RATE_LIMIT':
        message = `Limite de requêtes ${type} atteinte. Les données sont simulées.`;
        break;
      case 'TIMEOUT':
        message = `L'analyse ${type} a pris trop de temps. Les données sont simulées.`;
        break;
      default:
        break;
    }
    
    return (
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              {message}
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  export default SimulatedDataNotice;