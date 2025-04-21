const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Fonction pour générer un rapport PDF détaillé
const generatePDFReport = async (auditRecord) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    
    // Crée le fichier PDF dans le dossier 'reports'
    const filename = `rapport_${auditRecord._id}.pdf`;
    const filePath = path.join(__dirname, '../reports', filename);
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Ajouter le titre
    doc.fontSize(20).text('Rapport d\'Audit du Site Web', { align: 'center' });
    doc.moveDown(2);

    // Informations sur l'URL audité
    doc.fontSize(14).text(`URL: ${auditRecord.url}`);
    doc.moveDown(1);

    // Section Performance
    doc.fontSize(16).text('1. Performance', { underline: true });
    doc.fontSize(12).text(`Score de performance : ${auditRecord.performance?.score_total}`);
    doc.moveDown(1);

    // Section SEO
    doc.fontSize(16).text('2. SEO', { underline: true });
    doc.fontSize(12).text(`Score SEO : ${auditRecord.seo?.score_total}`);
    doc.moveDown(1);

    // Section UX/UI
    doc.fontSize(16).text('3. UX/UI', { underline: true });
    doc.fontSize(12).text(`Score UX/UI : ${auditRecord.ui_ux?.score_total}`);
    doc.moveDown(1);

    // Recommandations IA pour Performance, SEO, UX/UI
    if (auditRecord.performance?.recommandations_ia) {
      doc.fontSize(14).text('Recommandations IA pour la performance :', { underline: true });
      auditRecord.performance.recommandations_ia.forEach(recommendation => {
        doc.fontSize(12).text(`- ${recommendation}`);
      });
      doc.moveDown(1);
    }

    // Terminer l'écriture du PDF
    doc.end();

    // Lorsque le PDF est généré, on renvoie le fichier
    writeStream.on('finish', () => {
      resolve(filename);
    });

    writeStream.on('error', (error) => {
      reject(error);
    });
  });
};

module.exports = { generatePDFReport };
