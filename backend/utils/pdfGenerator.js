const PDFDocument = require('pdfkit');

exports.generateAuditReport = async (audit) => {
  return new Promise((resolve, reject) => {
    try {
      // Ensure audit data exists with safe defaults
      audit = audit || {};
      audit.url = audit.url || 'Site Web';
      audit.createdAt = audit.createdAt || new Date();
      
      // Ensure all sections exist with safe defaults
      audit.seo = audit.seo || {};
      audit.seo.score = typeof audit.seo.score === 'number' && !isNaN(audit.seo.score) ? audit.seo.score : 0;
      audit.seo.canonicalUrl = audit.seo.canonicalUrl || audit.url;
      audit.seo.issues = Array.isArray(audit.seo.issues) ? audit.seo.issues : [];
      
      audit.performance = audit.performance || {};
      audit.performance.score = typeof audit.performance.score === 'number' && !isNaN(audit.performance.score) ? audit.performance.score : 0;
      audit.performance.loadTime = typeof audit.performance.loadTime === 'number' && !isNaN(audit.performance.loadTime) ? audit.performance.loadTime : 0;
      audit.performance.pageSize = typeof audit.performance.pageSize === 'number' && !isNaN(audit.performance.pageSize) ? audit.performance.pageSize : 0;
      audit.performance.requests = typeof audit.performance.requests === 'number' && !isNaN(audit.performance.requests) ? audit.performance.requests : 0;
      audit.performance.issues = Array.isArray(audit.performance.issues) ? audit.performance.issues : [];
      
      audit.uiUx = audit.uiUx || {};
      audit.uiUx.score = typeof audit.uiUx.score === 'number' && !isNaN(audit.uiUx.score) ? audit.uiUx.score : 0;
      audit.uiUx.issues = Array.isArray(audit.uiUx.issues) ? audit.uiUx.issues : [];
      
      // Create PDF document with margins
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
        info: {
          Title: `Rapport d'audit web - ${audit.url}`,
          Author: 'WebAudit',
          Subject: 'Audit de site web'
        }
      });
      
      // Buffer to store the PDF
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      // Page layout constants
      const margin = 50;
      const pageWidth = doc.page.width - margin * 2;
      const maxY = doc.page.height - 70;
      
      // Color palette - Matching your screenshots
      const colors = {
        primary: '#4338CA',    // Indigo for SEO
        success: '#10B981',    // Green for Performance
        warning: '#F59E0B',    // Amber for UI/UX
        danger: '#EF4444',     // Red for critical issues
        info: '#3B82F6',       // Blue for info
        light: '#F9FAFB',      // Light background
        dark: '#1F2937',       // Dark text
        white: '#FFFFFF',
        lightGray: '#E5E7EB',  // Gray-200
        mediumGray: '#9CA3AF', // Gray-400
        darkGray: '#4B5563'    // Gray-600
      };
      
      // Improved function to check available space - FIXED to prevent blank pages
      const ensureSpace = (currentY, neededSpace) => {
        // Validate inputs to prevent NaN
        currentY = typeof currentY === 'number' && !isNaN(currentY) ? currentY : margin;
        neededSpace = typeof neededSpace === 'number' && !isNaN(neededSpace) ? neededSpace : 0;
        
        // Only add a new page if absolutely necessary
        if (currentY + neededSpace > maxY) {
          doc.addPage();
          return margin;
        }
        return currentY;
      };
      
      // Text truncation helper
      const truncateText = (text, maxLength = 300) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
      };
      
      // Section title function - Simplified to match screenshots
      const addSectionTitle = (title, y, color = colors.primary) => {
        y = ensureSpace(y, 40);
        
        doc.fillColor(colors.dark)
           .font('Helvetica-Bold')
           .fontSize(18)
           .text(title || '', margin, y);
        
        // Simple underline as shown in screenshots
        doc.strokeColor(color)
           .lineWidth(2)
           .moveTo(margin, y + 28)
           .lineTo(margin + pageWidth, y + 28)
           .stroke();
        
        return y + 40;
      };
      
      // Simple score circle function - Matching screenshots with safety checks
      const drawScoreCircle = (score, x, y, radius, color) => {
        // Validate inputs to prevent NaN
        score = typeof score === 'number' && !isNaN(score) ? Math.max(0, Math.min(100, score)) : 0;
        x = typeof x === 'number' && !isNaN(x) ? x : margin;
        y = typeof y === 'number' && !isNaN(y) ? y : margin;
        radius = typeof radius === 'number' && !isNaN(radius) ? radius : 35;
        
        // Get score color based on value
        const getScoreColor = (score) => {
          if (score >= 80) return colors.success;
          if (score >= 50) return colors.warning;
          return colors.danger;
        };
        
        const scoreColor = color || getScoreColor(score);
        
        // Light background circle
        doc.circle(x, y, radius)
           .fill(colors.lightGray);
        
        // Score ring - Using simple stroke for reliability
        doc.lineWidth(8)
           .strokeColor(scoreColor)
           .circle(x, y, radius - 4)
           .stroke();
        
        // Score text
        doc.fillColor(colors.dark)
           .font('Helvetica-Bold')
           .fontSize(radius * 0.5)
           .text(`${Math.round(score)}%`, 
                x - radius/2, y - radius*0.25, 
                {width: radius, align: 'center'});
      };
      
      // Simple metric box with icon - With safety checks to prevent NaN
      const addMetricBoxWithIcon = (title, value, x, y, width, height, iconType) => {
        // Validate inputs to prevent NaN
        title = title || '';
        value = value || 'N/A';
        x = typeof x === 'number' && !isNaN(x) ? x : margin;
        y = typeof y === 'number' && !isNaN(y) ? y : margin;
        width = typeof width === 'number' && !isNaN(width) ? width : 100;
        height = typeof height === 'number' && !isNaN(height) ? height : 65;
        
        // Background
        doc.roundedRect(x, y, width, height, 5)
           .fillAndStroke(colors.light, colors.lightGray);
        
        // Simple icon based on type
        const iconSize = 24;
        const iconX = x + 15;
        const iconY = y + (height - iconSize) / 2;
        
        switch(iconType) {
          case 'time':
            // Clock icon - Simplified
            doc.circle(iconX + iconSize/2, iconY + iconSize/2, iconSize/2)
               .strokeColor(colors.primary)
               .lineWidth(1.5)
               .stroke();
            break;
            
          case 'size':
            // Document icon - Simplified
            doc.rect(iconX, iconY, iconSize*0.8, iconSize)
               .strokeColor(colors.primary)
               .lineWidth(1.5)
               .stroke();
            break;
            
          case 'requests':
            // Connection icon - Simplified
            doc.moveTo(iconX, iconY + iconSize/2)
               .lineTo(iconX + iconSize, iconY + iconSize/2)
               .strokeColor(colors.primary)
               .lineWidth(1.5)
               .stroke();
            break;
            
          case 'issues':
            // Alert triangle - Simplified
            doc.moveTo(iconX + iconSize/2, iconY)
               .lineTo(iconX + iconSize, iconY + iconSize*0.8)
               .lineTo(iconX, iconY + iconSize*0.8)
               .closePath()
               .strokeColor(colors.danger)
               .lineWidth(1.5)
               .stroke();
            break;
        }
        
        // Title
        doc.fillColor(colors.darkGray)
           .font('Helvetica')
           .fontSize(11)
           .text(title, x + iconSize + 25, y + 15);
        
        // Value
        doc.fillColor(colors.dark)
           .font('Helvetica-Bold')
           .fontSize(16)
           .text(String(value).substring(0, 50), 
                 x + iconSize + 25, y + height - 30, 
                 { width: width - iconSize - 40 });
        
        return height;
      };
      
      // Issue box with safety checks to prevent NaN
      const addIssue = (issue, index, y) => {
        // Validate inputs
        issue = issue || {};
        issue.description = issue.description || 'Problème non spécifié';
        issue.recommendation = issue.recommendation || '';
        issue.severity = issue.severity || 'info';
        index = typeof index === 'number' && !isNaN(index) ? index : 0;
        y = typeof y === 'number' && !isNaN(y) ? y : margin;
        
        // Calculate needed height with safer calculations
        const titleLength = issue.description ? issue.description.length : 0;
        const recoLength = issue.recommendation ? issue.recommendation.length : 0;
        
        // More accurate height estimation with safety bounds
        const titleHeight = Math.min(60, Math.ceil(titleLength / 60) * 20);
        const recoHeight = recoLength ? Math.min(200, Math.ceil(recoLength / 60) * 15) : 0;
        
        // Total estimated height with reduced padding
        const estimatedHeight = Math.max(30, 10 + titleHeight + (recoLength ? 20 + recoHeight : 0));
        
        // Ensure we have enough space
        y = ensureSpace(y, estimatedHeight + 10);
        
        // Get severity info
        const getSeverityColor = (severity) => {
          switch(severity) {
            case 'high': return { bg: colors.danger, text: 'CRITIQUE' };
            case 'medium': return { bg: colors.warning, text: 'IMPORTANT' };
            case 'low': return { bg: colors.success, text: 'MINEUR' };
            default: return { bg: colors.info, text: 'INFO' };
          }
        };
        
        const sevInfo = getSeverityColor(issue.severity);
        
        // Simple box background - Matching screenshots
        doc.roundedRect(margin, y, pageWidth, estimatedHeight, 5)
           .fill('#F9FAFB');
        
        // Left border colored by severity (as in screenshots)
        doc.rect(margin, y, 5, estimatedHeight)
           .fill(sevInfo.bg);
        
        // Severity badge
        doc.roundedRect(margin + 15, y + 10, 80, 20, 10)
           .fill(sevInfo.bg);
        
        doc.fillColor(colors.white)
           .font('Helvetica-Bold')
           .fontSize(10)
           .text(sevInfo.text, margin + 25, y + 15);
        
        // Issue number and title
        doc.fillColor(colors.dark)
           .font('Helvetica-Bold')
           .fontSize(13)
           .text(`${index + 1}. ${truncateText(issue.description, 500)}`, 
                 margin + 110, y + 12, 
                 { width: pageWidth - 130 });
        
        let currentY = y + 12 + titleHeight;
        
        // Recommendation if present
        if (issue.recommendation) {
          // Add space
          currentY += 5;
          
          // Calculate remaining height safely
          const remainingHeight = Math.max(10, estimatedHeight - (currentY - y) - 10);
          
          // Light background for recommendation
          doc.rect(margin + 15, currentY, pageWidth - 30, remainingHeight)
             .fill('#F3F4F6');
          
          // Blue left border
          doc.rect(margin + 15, currentY, 4, remainingHeight)
             .fill(colors.info);
          
          // Recommendation title
          doc.fillColor(colors.info)
             .font('Helvetica-Bold')
             .fontSize(11)
             .text('Recommandation:', margin + 25, currentY + 10);
          
          // Recommendation text
          doc.fillColor(colors.dark)
             .font('Helvetica')
             .fontSize(10)
             .text(truncateText(issue.recommendation, 800), 
                   margin + 25, currentY + 25, 
                   { width: pageWidth - 50 });
        }
        
        return y + estimatedHeight + 5;
      };
      
      // ---- REPORT HEADER ----
      doc.font('Helvetica-Bold')
         .fontSize(20)
         .text('Rapport d\'audit web', margin, margin, { align: 'center' });
      
      doc.moveDown();
      doc.font('Helvetica')
         .fontSize(12)
         .text(`URL: ${audit.url}`, { align: 'center' });
      
      doc.moveDown(0.5);
      doc.fontSize(11)
         .text(`Date: ${new Date(audit.createdAt).toLocaleDateString()}`, { align: 'center' });
      
      // ---- OVERVIEW SECTION ----
      let yPos = 150; // Start a bit higher to save space
      yPos = addSectionTitle('Vue d\'ensemble', yPos, colors.primary);
      
      // Score circles in a row - Matching screenshots
      const scoreRadius = 35;
      const scoreCentersY = yPos + scoreRadius + 10;
      const scoreSpacing = pageWidth / 3;
      
      // SEO Score
      drawScoreCircle(
        audit.seo.score, 
        margin + scoreSpacing / 2, 
        scoreCentersY, 
        scoreRadius, 
        colors.primary
      );
      
      // SEO Label
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor(colors.dark)
         .text('SEO', margin + scoreSpacing / 2 - 15, scoreCentersY + scoreRadius + 10, 
               { width: 30, align: 'center' });
      
      // Performance Score
      drawScoreCircle(
        audit.performance.score, 
        margin + scoreSpacing + scoreSpacing / 2, 
        scoreCentersY, 
        scoreRadius, 
        colors.success
      );
      
      // Performance Label
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor(colors.dark)
         .text('Performance', margin + scoreSpacing + scoreSpacing / 2 - 40, 
               scoreCentersY + scoreRadius + 10, 
               { width: 80, align: 'center' });
      
      // UI/UX Score
      drawScoreCircle(
        audit.uiUx.score, 
        margin + scoreSpacing * 2 + scoreSpacing / 2, 
        scoreCentersY, 
        scoreRadius, 
        colors.warning
      );
      
      // UI/UX Label
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor(colors.dark)
         .text('UI/UX', margin + scoreSpacing * 2 + scoreSpacing / 2 - 20, 
               scoreCentersY + scoreRadius + 10, 
               { width: 40, align: 'center' });
      
      // Position after score circles
      yPos = scoreCentersY + scoreRadius + 40;
      
      // Metrics row 1 - More compact
      const metricWidth = pageWidth / 2 - 5;
      const metricHeight = 65;
      
      addMetricBoxWithIcon(
        'Temps de chargement', 
        `${audit.performance.loadTime.toFixed(2)} s`, 
        margin, yPos, metricWidth, metricHeight, 
        'time'
      );
      
      addMetricBoxWithIcon(
        'Taille de la page', 
        `${(audit.performance.pageSize / 1024).toFixed(2)} MB`, 
        margin + metricWidth + 10, yPos, metricWidth, metricHeight, 
        'size'
      );
      
      // Metrics row 2
      yPos += metricHeight + 10;
      
      addMetricBoxWithIcon(
        'Requêtes HTTP', 
        `${audit.performance.requests}`, 
        margin, yPos, metricWidth, metricHeight, 
        'requests'
      );
      
      // Count issues by severity
      const countIssuesBySeverity = (severity) => {
        let count = 0;
        if (audit.seo?.issues) count += audit.seo.issues.filter(i => i.severity === severity).length;
        if (audit.performance?.issues) count += audit.performance.issues.filter(i => i.severity === severity).length;
        if (audit.uiUx?.issues) count += audit.uiUx.issues.filter(i => i.severity === severity).length;
        return count;
      };
      
      const criticalCount = countIssuesBySeverity('high');
      const totalIssues = (audit.seo?.issues?.length || 0) + 
                          (audit.performance?.issues?.length || 0) + 
                          (audit.uiUx?.issues?.length || 0);
      
      addMetricBoxWithIcon(
        'Problèmes détectés', 
        `${totalIssues} (${criticalCount} critiques)`, 
        margin + metricWidth + 10, yPos, metricWidth, metricHeight, 
        'issues'
      );
      
      // ---- SEO SECTION ----
      yPos += metricHeight + 25;
      yPos = addSectionTitle('Audit SEO', yPos, colors.primary);
      
      // SEO Score with circle
      const seoScoreY = yPos;
      const seoCircleSize = 45;
      
      drawScoreCircle(audit.seo.score, margin + seoCircleSize, seoScoreY + seoCircleSize, seoCircleSize, colors.primary);
      
      // SEO Info card
      const seoMetricsX = margin + seoCircleSize * 2 + 20;
      const seoMetricsWidth = pageWidth - seoCircleSize * 2 - 20;
      
      doc.roundedRect(seoMetricsX, seoScoreY, seoMetricsWidth, 100, 5)
         .fill(colors.light);
      
      doc.font('Helvetica-Bold')
         .fontSize(13)
         .fillColor(colors.dark)
         .text('Informations SEO', seoMetricsX + 15, seoScoreY + 15);
      
      // Canonical URL
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor(colors.darkGray)
         .text('URL Canonique:', seoMetricsX + 15, seoScoreY + 45);
      
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor(colors.dark)
         .text(truncateText(audit.seo.canonicalUrl || audit.url, 80), 
               seoMetricsX + 120, seoScoreY + 45, 
               { width: seoMetricsWidth - 140 });
      
      // Meta Description
      if (audit.seo.metaDescription) {
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .fillColor(colors.darkGray)
           .text('Meta Description:', seoMetricsX + 15, seoScoreY + 70);
        
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor(colors.dark)
           .text(truncateText(audit.seo.metaDescription, 80), 
                 seoMetricsX + 120, seoScoreY + 70, 
                 { width: seoMetricsWidth - 140 });
      }
      
      // Continue after score and info
      yPos = seoScoreY + Math.max(seoCircleSize * 2 + 20, 120);
      
      // SEO Issues
      if (audit.seo.issues && audit.seo.issues.length > 0) {
        // Position actuelle
        let titleY = yPos;
        
        // Définir la police
        doc.font('Helvetica-Bold')
           .fontSize(15)
           .fillColor(colors.dark);
        
        // Calculer la hauteur du texte avant de l'écrire
        const titleHeight = doc.heightOfString('Problèmes SEO détectés:', {
          width: pageWidth,
          fontSize: 15,
          font: 'Helvetica-Bold'
        });
        
        // Écrire le texte
        doc.text('Problèmes SEO détectés:', margin, titleY);
        
        // Réduire l'espacement au minimum absolu (appliquer une correction négative)
        yPos = titleY + titleHeight - 5; // Correction négative de 5 points
        
        // Premier problème
        yPos = addIssue(audit.seo.issues[0], 0, yPos);
        
        // Problèmes restants
        for (let i = 1; i < audit.seo.issues.length; i++) {
          yPos = addIssue(audit.seo.issues[i], i, yPos);
        }
      } else {
        doc.roundedRect(margin, yPos, pageWidth, 80, 5)
           .fill(colors.light);
        
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .fillColor(colors.success)
           .text('Félicitations!', margin + 15, yPos + 15);
        
        doc.font('Helvetica')
           .fontSize(12)
           .fillColor(colors.dark)
           .text('Aucun problème SEO n\'a été détecté sur votre site.', 
                 margin + 15, yPos + 35, 
                 { width: pageWidth - 30 });
        
        yPos += 100;
      }
      
      // ---- PERFORMANCE SECTION ----
      yPos += 20;
      yPos = addSectionTitle('Audit Performance', yPos, colors.success);
      
      // Performance Score with circle
      const perfScoreY = yPos;
      const perfCircleSize = 45;
      
      drawScoreCircle(audit.performance.score, margin + perfCircleSize, perfScoreY + perfCircleSize, perfCircleSize, colors.success);
      
      // Performance metrics card
      const perfMetricsX = margin + perfCircleSize * 2 + 20;
      const perfMetricsWidth = pageWidth - perfCircleSize * 2 - 20;
      
      doc.roundedRect(perfMetricsX, perfScoreY, perfMetricsWidth, 140, 5)
         .fill(colors.light);
      
      doc.font('Helvetica-Bold')
         .fontSize(13)
         .fillColor(colors.dark)
         .text('Métriques de Performance', perfMetricsX + 15, perfScoreY + 15);
      
      // Performance metrics
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor(colors.darkGray)
         .text('Temps de chargement:', perfMetricsX + 15, perfScoreY + 45);
      
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor(colors.dark)
         .text(`${audit.performance.loadTime.toFixed(2)} s`, perfMetricsX + 150, perfScoreY + 45);
      
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor(colors.darkGray)
         .text('Taille de la page:', perfMetricsX + 15, perfScoreY + 65);
      
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor(colors.dark)
         .text(`${(audit.performance.pageSize / 1024).toFixed(2)} MB`, perfMetricsX + 150, perfScoreY + 65);
      
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor(colors.darkGray)
         .text('Requêtes HTTP:', perfMetricsX + 15, perfScoreY + 85);
      
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor(colors.dark)
         .text(`${audit.performance.requests}`, perfMetricsX + 150, perfScoreY + 85);
      
      // Largest Contentful Paint
      if (audit.performance.largestContentfulPaint !== undefined) {
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .fillColor(colors.darkGray)
           .text('Largest Contentful Paint:', perfMetricsX + 15, perfScoreY + 105);
        
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor(colors.dark)
           .text(`${audit.performance.largestContentfulPaint.toFixed(2)}s`, perfMetricsX + 150, perfScoreY + 105);
      }
      
      // Total Blocking Time
      if (audit.performance.totalBlockingTime !== undefined) {
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .fillColor(colors.darkGray)
           .text('Total Blocking Time:', perfMetricsX + 15, perfScoreY + 125);
        
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor(colors.dark)
           .text(`${audit.performance.totalBlockingTime}ms`, perfMetricsX + 150, perfScoreY + 125);
      }
      
      // Continue after metrics card
      yPos = perfScoreY + Math.max(perfCircleSize * 2 + 20, 160);
      
      // Performance Issues
      if (audit.performance.issues && audit.performance.issues.length > 0) {
        // Position actuelle
        let titleY = yPos;
        
        // Définir la police
        doc.font('Helvetica-Bold')
           .fontSize(15)
           .fillColor(colors.dark);
        
        // Calculer la hauteur du texte avant de l'écrire
        const titleHeight = doc.heightOfString('Problèmes de performance détectés:', {
          width: pageWidth,
          fontSize: 15,
          font: 'Helvetica-Bold'
        });
        
        // Écrire le texte
        doc.text('Problèmes de performance détectés:', margin, titleY);
        
        // Réduire l'espacement au minimum absolu (appliquer une correction négative)
        yPos = titleY + titleHeight - 5; // Correction négative de 5 points
        
        // Premier problème
        yPos = addIssue(audit.performance.issues[0], 0, yPos);
        
        // Problèmes restants
        for (let i = 1; i < audit.performance.issues.length; i++) {
          yPos = addIssue(audit.performance.issues[i], i, yPos);
        }
      } else {
        doc.roundedRect(margin, yPos, pageWidth, 80, 5)
           .fill(colors.light);
        
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .fillColor(colors.success)
           .text('Félicitations!', margin + 15, yPos + 15);
        
        doc.font('Helvetica')
           .fontSize(12)
           .fillColor(colors.dark)
           .text('Aucun problème de performance n\'a été détecté sur votre site.', 
                 margin + 15, yPos + 35, 
                 { width: pageWidth - 30 });
        
        yPos += 100;
      }
      
      // ---- UI/UX SECTION ----
      yPos += 20;
      yPos = addSectionTitle('Audit UI/UX', yPos, colors.warning);
      
      // UI/UX Score with circle
      const uiuxScoreY = yPos;
      const uiuxCircleSize = 45;
      
      drawScoreCircle(audit.uiUx.score, margin + uiuxCircleSize, uiuxScoreY + uiuxCircleSize, uiuxCircleSize, colors.warning);
      
      // UI/UX metrics card
      const uiuxMetricsX = margin + uiuxCircleSize * 2 + 20;
      const uiuxMetricsWidth = pageWidth - uiuxCircleSize * 2 - 20;
      
      doc.roundedRect(uiuxMetricsX, uiuxScoreY, uiuxMetricsWidth, 120, 5)
         .fill(colors.light);
      
      doc.font('Helvetica-Bold')
         .fontSize(13)
         .fillColor(colors.dark)
         .text('Métriques UI/UX', uiuxMetricsX + 15, uiuxScoreY + 15);
      
      // UI/UX metrics
      if (audit.uiUx.accessibility !== undefined) {
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .fillColor(colors.darkGray)
           .text('Accessibilité:', uiuxMetricsX + 15, uiuxScoreY + 45);
        
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor(colors.dark)
           .text(`${audit.uiUx.accessibility}%`, uiuxMetricsX + 150, uiuxScoreY + 45);
      }
      
      if (audit.uiUx.responsiveDesign !== undefined) {
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .fillColor(colors.darkGray)
           .text('Design Responsive:', uiuxMetricsX + 15, uiuxScoreY + 65);
        
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor(colors.dark)
           .text(audit.uiUx.responsiveDesign ? 'Oui' : 'Non', uiuxMetricsX + 150, uiuxScoreY + 65);
      }
      
      if (audit.uiUx.interactiveTime !== undefined) {
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .fillColor(colors.darkGray)
           .text('Temps d\'interactivité:', uiuxMetricsX + 15, uiuxScoreY + 85);
        
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor(colors.dark)
           .text(`${audit.uiUx.interactiveTime.toFixed(2)}s`, uiuxMetricsX + 150, uiuxScoreY + 85);
      }
      
      // Continue after metrics card
      yPos = uiuxScoreY + Math.max(uiuxCircleSize * 2 + 20, 140);
      
      // UI/UX Issues
      if (audit.uiUx.issues && audit.uiUx.issues.length > 0) {
        // Position actuelle
        let titleY = yPos;
        
        // Définir la police
        doc.font('Helvetica-Bold')
           .fontSize(15)
           .fillColor(colors.dark);
        
        // Calculer la hauteur du texte avant de l'écrire
        const titleHeight = doc.heightOfString('Problèmes UI/UX détectés:', {
          width: pageWidth,
          fontSize: 15,
          font: 'Helvetica-Bold'
        });
        
        // Écrire le texte
        doc.text('Problèmes UI/UX détectés:', margin, titleY);
        
        // Réduire l'espacement au minimum absolu (appliquer une correction négative)
        yPos = titleY + titleHeight - 5; // Correction négative de 5 points
        
        // Premier problème
        yPos = addIssue(audit.uiUx.issues[0], 0, yPos);
        
        // Problèmes restants
        for (let i = 1; i < audit.uiUx.issues.length; i++) {
          yPos = addIssue(audit.uiUx.issues[i], i, yPos);
        }
      } else {
        doc.roundedRect(margin, yPos, pageWidth, 80, 5)
           .fill(colors.light);
        
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .fillColor(colors.success)
           .text('Félicitations!', margin + 15, yPos + 15);
        
        doc.font('Helvetica')
           .fontSize(12)
           .fillColor(colors.dark)
           .text('Aucun problème UI/UX n\'a été détecté sur votre site.', 
                 margin + 15, yPos + 35, 
                 { width: pageWidth - 30 });
      }
      
      // Finalize document
      doc.end();
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      reject(error);
    }
  });
};