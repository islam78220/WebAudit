const PDFDocument = require('pdfkit');

exports.generateAuditReport = async (audit) => {
  return new Promise((resolve, reject) => {
    try {
      // Créer un document PDF
      const doc = new PDFDocument({ margin: 50 });
      
      // Buffer pour stocker le PDF
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      // En-tête
      doc.fontSize(25).font('Helvetica-Bold').text('Rapport d\'audit web', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).font('Helvetica').text(`URL: ${audit.url}`, { align: 'center' });
      doc.fontSize(12).text(`Date: ${new Date(audit.overview.timestamp).toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);
      
      // Vue d'ensemble
      doc.fontSize(18).font('Helvetica-Bold').text('Vue d\'ensemble');
      doc.moveDown();
      
      // Scores en cercles
      const scores = [
        { name: 'SEO', score: audit.overview.seoScore },
        { name: 'Performance', score: audit.overview.performanceScore },
        { name: 'UI/UX', score: audit.overview.uiUxScore }
      ];
      
      // Table des scores
      doc.fontSize(12).font('Helvetica');
      const tableTop = doc.y;
      const tableLeft = 150;
      
      scores.forEach((item, i) => {
        const y = tableTop + i * 30;
        
        // Texte du nom
        doc.font('Helvetica-Bold').text(item.name, 50, y);
        
        // Barre de score
        const scoreWidth = 200;
        const scoreHeight = 20;
        
        // Fond gris
        doc.fillColor('#e0e0e0')
           .rect(tableLeft, y, scoreWidth, scoreHeight)
           .fill();
        
        // Barre de progression
        const color = getColorForScore(item.score);
        doc.fillColor(color)
           .rect(tableLeft, y, scoreWidth * (item.score / 100), scoreHeight)
           .fill();
        
        // Texte du score
        doc.fillColor('black')
           .font('Helvetica-Bold')
           .text(`${Math.round(item.score)}%`, tableLeft + scoreWidth + 10, y + 5);
      });
      
      doc.moveDown(5);
      
      // Audit SEO
      doc.fontSize(18).font('Helvetica-Bold').text('Audit SEO');
      doc.moveDown();
      
      // Informations SEO
      doc.fontSize(12).font('Helvetica');
      doc.text(`Score SEO: ${Math.round(audit.seo.score)}%`);
      
      if (audit.seo.keywords && audit.seo.keywords.length > 0) {
        doc.moveDown();
        doc.font('Helvetica-Bold').text('Mots-clés détectés:');
        doc.font('Helvetica').text(audit.seo.keywords.join(', '));
      }
      
      if (audit.seo.metaDescription) {
        doc.moveDown();
        doc.font('Helvetica-Bold').text('Meta Description:');
        doc.font('Helvetica').text(audit.seo.metaDescription);
      }
      
      if (audit.seo.canonicalUrl) {
        doc.moveDown();
        doc.font('Helvetica-Bold').text('URL Canonique:');
        doc.font('Helvetica').text(audit.seo.canonicalUrl);
      }
      
      // Problèmes SEO
      if (audit.seo.issues && audit.seo.issues.length > 0) {
        doc.moveDown(2);
        doc.fontSize(14).font('Helvetica-Bold').text('Problèmes SEO détectés:');
        doc.moveDown();
        
        audit.seo.issues.forEach((issue, index) => {
          const color = getSeverityColor(issue.severity);
          
          doc.fontSize(12).font('Helvetica-Bold').fillColor(color)
             .text(`${index + 1}. ${issue.description} (${issue.severity})`);
          
          doc.fontSize(12).font('Helvetica').fillColor('black')
             .text(issue.recommendation);
          
          doc.moveDown();
        });
      }
      
      // Nouvelle page pour Performance
      doc.addPage();
      
      // Audit Performance
      doc.fontSize(18).font('Helvetica-Bold').text('Audit Performance');
      doc.moveDown();
      
      // Informations Performance
      doc.fontSize(12).font('Helvetica');
      doc.text(`Score Performance: ${Math.round(audit.performance.score)}%`);
      
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Temps de chargement:');
      doc.font('Helvetica').text(`${audit.performance.loadTime.toFixed(2)} secondes`);
      
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Taille de la page:');
      doc.font('Helvetica').text(`${Math.round(audit.performance.pageSize)} KB`);
      
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Nombre de requêtes:');
      doc.font('Helvetica').text(`${audit.performance.requests}`);
      
      // Problèmes Performance
      if (audit.performance.issues && audit.performance.issues.length > 0) {
        doc.moveDown(2);
        doc.fontSize(14).font('Helvetica-Bold').text('Problèmes de performance détectés:');
        doc.moveDown();
        
        audit.performance.issues.forEach((issue, index) => {
          const color = getSeverityColor(issue.severity);
          
          doc.fontSize(12).font('Helvetica-Bold').fillColor(color)
             .text(`${index + 1}. ${issue.description} (${issue.severity})`);
          
          doc.fontSize(12).font('Helvetica').fillColor('black')
             .text(issue.recommendation);
          
          doc.moveDown();
        });
      }
      
      // Nouvelle page pour UI/UX
      doc.addPage();
      
      // Audit UI/UX
      doc.fontSize(18).font('Helvetica-Bold').text('Audit UI/UX');
      doc.moveDown();
      
      // Informations UI/UX
      doc.fontSize(12).font('Helvetica');
      doc.text(`Score UI/UX: ${Math.round(audit.uiUx.score)}%`);
      
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Accessibilité:');
      doc.font('Helvetica').text(`${Math.round(audit.uiUx.accessibility)}%`);
      
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Temps d\'interactivité:');
      doc.font('Helvetica').text(`${audit.uiUx.interactiveTime.toFixed(2)} secondes`);
      
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Design Responsive:');
      doc.font('Helvetica').text(audit.uiUx.responsiveDesign ? 'Oui' : 'Non');
      
      // Problèmes UI/UX
      if (audit.uiUx.issues && audit.uiUx.issues.length > 0) {
        doc.moveDown(2);
        doc.fontSize(14).font('Helvetica-Bold').text('Problèmes UI/UX détectés:');
        doc.moveDown();
        
        audit.uiUx.issues.forEach((issue, index) => {
          const color = getSeverityColor(issue.severity);
          
          doc.fontSize(12).font('Helvetica-Bold').fillColor(color)
             .text(`${index + 1}. ${issue.description} (${issue.severity})`);
          
          doc.fontSize(12).font('Helvetica').fillColor('black')
             .text(issue.recommendation);
          
          doc.moveDown();
        });
      }
      
      // Pied de page
      doc.fontSize(10).font('Helvetica').text('Ce rapport a été généré automatiquement. Contactez-nous pour plus de détails.', { align: 'center' });
      
      // Finir le document
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Obtenir une couleur en fonction du score
const getColorForScore = (score) => {
  if (score >= 90) return '#4CAF50'; // Vert
  if (score >= 50) return '#FFC107'; // Jaune
  return '#F44336'; // Rouge
};

// Obtenir une couleur en fonction de la sévérité
const getSeverityColor = (severity) => {
  if (severity === 'high') return '#F44336'; // Rouge
  if (severity === 'medium') return '#FFC107'; // Jaune
  return '#4CAF50'; // Vert
};