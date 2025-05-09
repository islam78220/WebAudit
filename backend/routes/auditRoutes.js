const express = require('express');
const { 
  createAudit, 
  getUserAudits, 
  getAudit, 
  generatePdf 
} = require('../controllers/auditController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Routes accessibles avec ou sans authentification
router.post('/', optionalAuth, createAudit);
router.get('/:id', optionalAuth, getAudit);
router.get('/:id/pdf', optionalAuth, generatePdf);

// Routes protégées nécessitant une authentification
router.get('/', protect, getUserAudits);

module.exports = router;