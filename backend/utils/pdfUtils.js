const PDFDocument = require('pdfkit');

const generatePDFReport = async (auditRecord) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();

    doc.fontSize(20).text('Website Audit Report', { align: 'center' });
    doc.fontSize(14).text(`URL: ${auditRecord.url}`, { align: 'left' });
    doc.end();

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
};

module.exports = { generatePDFReport };
