/**
 * Système simple de mise en cache pour les résultats d'audit
 */
const NodeCache = require('node-cache'); // npm install node-cache

class CacheService {
  constructor(ttlSeconds = 3600) {
    this.cache = new NodeCache({ 
      stdTTL: ttlSeconds, 
      checkperiod: ttlSeconds * 0.2,
      useClones: false
    });
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    return this.cache.set(key, value);
  }

  delete(keys) {
    return this.cache.del(keys);
  }

  flush() {
    return this.cache.flushAll();
  }

  // Méthode spécifique pour les audits
  getAuditCache(url, type) {
    return this.get(`audit:${type}:${url}`);
  }

  setAuditCache(url, type, data) {
    return this.set(`audit:${type}:${url}`, data);
  }
}

module.exports = new CacheService();