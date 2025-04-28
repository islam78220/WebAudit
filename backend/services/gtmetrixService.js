import axios from 'axios';

// Fonction d'audit avec GTmetrix
export const auditWithGTmetrix = async (url) => {
  const apiKey = '21dba9311ba159a52ee3793d13473a61';
  const apiUrl = `https://gtmetrix.com/api/2.0/tests`; // Correct endpoint for starting a test

  try {
    // Démarrer un test GTmetrix
    const response = await axios.post(apiUrl, {
      url: url // L'URL de l'audit à analyser
    }, {
      headers: {
        'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/vnd.api+json'
      }
    });

    if (!response.data || !response.data.test_id) {
      throw new Error('No test ID found in GTmetrix response');
    }

    const testId = response.data.test_id;

    // Attendre que le test soit terminé
    const result = await axios.get(`${apiUrl}/${testId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
      }
    });

    if (!result.data || !result.data.results || !result.data.results.scores) {
      throw new Error('No results found in GTmetrix response');
    }

    const performanceScore = result.data.results.scores.performance;
    const structureScore = result.data.results.scores.structure;
    const accessibilityScore = result.data.results.scores.accessibility;

    return {
      performanceScore,
      structureScore,
      accessibilityScore,
      reportUrl: result.data.results.report_url
    };

  } catch (err) {
    console.error('GTmetrix audit failed:', err);
    return null;
  }
};
