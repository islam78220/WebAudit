const fetch = require('node-fetch');

const getAIRecommendations = async (auditResults) => {
  const formatErrors = (sectionName, criteres) => {
    let prompt = `Pour la section ${sectionName}, voici les erreurs détectées :\n`;

    criteres.forEach(critere => {
      if (critere.erreurs && critere.erreurs.length > 0) {
        prompt += `\nCritère : ${critere.nom}\n`;
        critere.erreurs.forEach(erreur => {
          prompt += `- [${erreur.severite}] ${erreur.type_erreur} : ${erreur.description}\n`;
        });
      }
    });

    prompt += `\nPropose des recommandations précises et pratiques (une par ligne) pour corriger ces erreurs.`;
    return prompt;
  };

  const recommandations = {};

  for (const sectionName of ['performance', 'seo', 'ui_ux']) {
    const messages = [
      {
        role: 'system',
        content: 'Tu es un expert en audit de sites web. Donne des recommandations pratiques, claires et concises.',
      },
      {
        role: 'user',
        content: formatErrors(sectionName, auditResults[sectionName]?.criteres || []),
      },
    ];

    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mistral-medium',
          messages,
          max_tokens: 500,
        }),
      });

      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content || '';

      recommandations[sectionName] = aiText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    } catch (err) {
      console.error(`Erreur Mistral pour ${sectionName} :`, err);
      recommandations[sectionName] = ['Impossible de générer les recommandations.'];
    }
  }

  return recommandations;
};

module.exports = { getAIRecommendations };
