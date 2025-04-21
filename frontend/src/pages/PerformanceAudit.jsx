import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { motion } from "framer-motion";
import { FaExclamationCircle, FaCheckCircle } from "react-icons/fa";
import "react-circular-progressbar/dist/styles.css";
import "../styles/PerformanceAudit.css";
import auditImg from "../assets/audit-image.png";
import { fetchPerformanceData } from "../api"; // Import de l’API
import axios from 'axios';

const PerformanceAudit = () => {
  const [performanceScore, setPerformanceScore] = useState(0);
  const [metrics, setMetrics] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchPerformanceData();
        const data = response.data;
        setPerformanceScore(data.scorePerformance);
        setMetrics(data.metrics); // structure : [{ label, value, color, detail }]
      } catch (error) {
        console.error("Erreur lors du chargement des données :", error);ù
      }
    };

    loadData();
  }, []);

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
              onClick={() => setSelectedMetric(index)}
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

        {metrics.length > 0 && (
          <motion.div
            className="metric-detail-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h3>{metrics[selectedMetric].label}</h3>
            <p className="metric-description">{metrics[selectedMetric].detail.description}</p>

            <div className="metric-error-solution">
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
        )}
      </main>
    </div>
  );
};

export default PerformanceAudit;
