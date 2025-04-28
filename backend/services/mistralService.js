import axios from 'axios';

// Fonction pour générer des recommandations avec Mistral AI
export const generateRecommendationsWithMistral = async (errors) => {
  const apiKey = 'd8R5rAj51k0jyVRDeebr3KIRjPpPnO9b';
  const apiUrl = 'https://api.mistral.ai/v1/chat/completions';

  try {
    const response = await axios.post(apiUrl, {
      prompt: `Voici des erreurs SEO, performance et accessibilité pour un site web : ${JSON.stringify(errors)}. 
               Donne-moi des recommandations détaillées pour chaque erreur.`
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return response.data.recommendations;
  } catch (err) {
    console.error('Erreur avec Mistral AI:', err);
    return 'Impossible de générer des recommandations pour le moment.';
  }
};
