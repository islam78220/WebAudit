import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

// Fonction d'audit avec Lighthouse
export const auditWithLighthouse = async (url) => {
  const chrome = await launch({ chromeFlags: ['--headless'] });
  const options = { port: chrome.port };

  try {
    const result = await lighthouse(url, options);
    const audits = result.lhr.audits;

    const seoScore = audits['seo'] ? audits['seo'].score * 100 : 0;
    const performanceScore = audits['performance'] ? audits['performance'].score * 100 : 0;
    const accessibilityScore = audits['accessibility'] ? audits['accessibility'].score * 100 : 0;

    const seoErrors = audits['seo']?.details?.items || [];
    const performanceErrors = audits['performance']?.details?.items || [];
    const accessibilityErrors = audits['accessibility']?.details?.items || [];

    return {
      seoScore,
      performanceScore,
      accessibilityScore,
      seoErrors,
      performanceErrors,
      accessibilityErrors
    };

  } catch (err) {
    console.error('Lighthouse audit failed:', err);
    return null;
  } finally {
    await chrome.kill(); // Ensure the Chrome instance is always killed
  }
};
