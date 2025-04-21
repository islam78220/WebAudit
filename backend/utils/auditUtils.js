const axios = require('axios');

const analyzeWebsite = async (url) => {
  try {
    // Appels vers les API externes
    const lighthouseResults = await axios.get(`https://api.lighthouse.com/analyze?url=${encodeURIComponent(url)}`);
    const seoResults = await axios.get(`https://api.gtmetrix.com/seo?url=${encodeURIComponent(url)}`);

    // Simulation de données UX/UI (à remplacer par une vraie API si dispo)
    const uxUIResults = {
      score_total: 70,
      criteres: [
        {
          nom: "Lisibilité du contenu",
          score: 75,
          erreurs: [
            {
              type_erreur: "Taille de police inadéquate",
              description: "Certaines zones du site utilisent une taille de police trop petite.",
              severite: "moyenne",
            },
          ],
        },
      ],
      recommandations_ia: [], // Remplie plus tard avec l'IA
    };

    return {
      performance: lighthouseResults.data, // Doit suivre ton modèle Mongo (score_total, criteres, etc.)
      seo: seoResults.data,
      ux_ui: uxUIResults,
    };

  } catch (error) {
    console.error('Erreur analyse du site :', error?.response?.data || error.message);
    throw new Error('Échec de l’analyse du site web.');
  }
};

module.exports = { analyzeWebsite };
