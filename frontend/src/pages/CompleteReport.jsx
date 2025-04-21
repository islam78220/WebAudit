import React, { useState } from "react";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Radar } from "react-chartjs-2";
import { motion } from "framer-motion";
import "../styles/PerformanceAudit.css";

function PerformanceAudit() {
  const [url, setUrl] = useState("");

  const radarData = {
    labels: ["Performance", "Accessibilité", "SEO", "Bonnes pratiques", "Sécurité"],
    datasets: [
      {
        label: "Score",
        data: [85, 78, 90, 75, 80],
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="performance-audit">
      {/* Zone d'entrée d'URL */}
      <motion.div className="url-section" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <input
          type="text"
          className="site-url"
          placeholder="Entrez l'URL de votre site web..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button className="analyze-btn">Analyser</button>
      </motion.div>

      {/* Cercles de performance */}
      <div className="metrics">
        {[
          { label: "Score Performance", value: 85 },
          { label: "Temps de chargement", value: 60 },
          { label: "Taille de la page", value: 75 },
          { label: "Nombre de requêtes", value: 50 },
          { label: "Optimisation mobile", value: 90 },
        ].map((metric, index) => (
          <motion.div
            className="metric-card"
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2, duration: 0.5 }}
          >
            <h3>{metric.label}</h3>
            <div className="circle">
              <CircularProgressbar value={metric.value} text={`${metric.value}%`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Graphique Radar */}
      <motion.div className="chart-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.8 }}>
        <h3>Analyse détaillée</h3>
        <Radar data={radarData} />
      </motion.div>
    </div>
  );
}

export default PerformanceAudit;
