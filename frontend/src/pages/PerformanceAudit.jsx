import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { motion } from "framer-motion";
import { FaExclamationCircle, FaCheckCircle } from "react-icons/fa"; // Import des icônes
import "react-circular-progressbar/dist/styles.css";
import "../styles/PerformanceAudit.css";
import auditImg from "../assets/audit-image.png";

const performanceScore = 85;

const metrics = [
  {
    label: "Temps de Chargement",
    value: 72,
    color: "#00BFFF",
    detail: {
      description: "Le temps de chargement des pages a un impact direct sur l'expérience utilisateur et le SEO.",
      error: "Le temps de chargement est trop long, supérieur à 3 secondes.",
      solution: "Optimiser les images, minifier les ressources et utiliser le lazy loading.",
    },
  },
  {
    label: "Taille de la Page",
    value: 80,
    color: "#FF8C00",
    detail: {
      description: "La taille de la page influence le temps de téléchargement et l'expérience sur mobile.",
      error: "La taille de la page est trop élevée, ce qui peut ralentir le chargement.",
      solution: "Réduire la taille des images et des scripts, utiliser la compression.",
    },
  },
  {
    label: "Nombre de Requêtes",
    value: 65,
    color: "#32CD32",
    detail: {
      description: "Le nombre de requêtes HTTP affecte le temps de chargement de la page.",
      error: "Il y a trop de requêtes HTTP, ce qui ralentit le site.",
      solution: "Combiner les fichiers CSS/JS, utiliser le caching.",
    },
  },
  {
    label: "Optimisation Mobile",
    value: 90,
    color: "#8A2BE2",
    detail: {
      description: "Une bonne optimisation mobile garantit une expérience utilisateur fluide sur tous les appareils.",
      error: "La version mobile n'est pas optimisée, le site est lent sur mobile.",
      solution: "Utiliser des media queries, optimiser les images et les polices pour mobile.",
    },
  },
];

const PerformanceAudit = () => {
  const [selectedMetric, setSelectedMetric] = useState(0);

  return (
    <div className="performance-audit-container">
      <Sidebar />
      <main className="content">
        <motion.h1
          className="main-title"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Performance Audit
        </motion.h1>
        <motion.p
          className="subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Analyse approfondie des performances de votre site web pour optimiser l'expérience utilisateur.
        </motion.p>

        <div className="top-section">
          <motion.img
            src={auditImg}
            alt="audit"
            className="audit-image"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7 }}
            whileHover={{ scale: 1.05 }}
          />

          <motion.div
            className="score-block"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="score-circle">
              <CircularProgressbar
                value={performanceScore}
                text={`${performanceScore}%`}
                styles={buildStyles({
                  textSize: "18px",
                  pathColor: "#4ade80",
                  textColor: "#1e293b",
                  trailColor: "#e2e8f0",
                })}
              />
            </div>
            <p className="score-text">
              Ce score représente la performance globale de votre site. Un bon score améliore l’expérience utilisateur et le SEO.
            </p>
          </motion.div>
        </div>

        <motion.div
          className="metrics-section"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {metrics.map((metric, index) => (
            <div
              className={`metric-circle ${selectedMetric === index ? "selected" : ""}`}
              key={index}
              onClick={() => setSelectedMetric(index)} // Mise à jour de la métrique sélectionnée
            >
              <CircularProgressbar
                value={metric.value}
                text={`${metric.value}%`}
                styles={buildStyles({
                  textSize: "16px",
                  pathColor: metric.color,
                  textColor: "#0f172a",
                  trailColor: "#f1f5f9",
                })}
              />
              <p>{metric.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          className="metric-detail-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h3>{metrics[selectedMetric].label}</h3>
          <p className="metric-description">{metrics[selectedMetric].detail.description}</p>
          
          {/* Affichage des erreurs et solutions pour la métrique sélectionnée */}
          <div className="metric-error-solution">
            <div className="error">
              <FaExclamationCircle className="error-icon" />
              <span>{metrics[selectedMetric].detail.error}</span>
            </div>
            <div className="solution">
              <FaCheckCircle className="solution-icon" />
              <span>{metrics[selectedMetric].detail.solution}</span>
            </div>
            <div className="error">
              <FaExclamationCircle className="error-icon" />
              <span>{metrics[selectedMetric].detail.error}</span>
            </div>
            <div className="solution">
              <FaCheckCircle className="solution-icon" />
              <span>{metrics[selectedMetric].detail.solution}</span>
            </div>
            
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PerformanceAudit;
