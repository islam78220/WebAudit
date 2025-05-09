// validators.js - Validation plus robuste des URLs
exports.isValidUrl = (string) => {
  try {
    const url = new URL(string);
    // Vérifier aussi que c'est http ou https
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};