import React from "react";
import Sidebar from "../components/Sidebar";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { FaSearch, FaLink, FaTags, FaInfoCircle, FaGlobe } from "react-icons/fa";
import "react-circular-progressbar/dist/styles.css";
import "../styles/SEOAudit.css";

const seoScore = 78;

const seoMetrics = [
  {
    label: "Mots-clés",
    icon: <FaTags />,
    score: 70,
    description: "Les mots-clés ne sont pas suffisamment présents dans le contenu.",
    suggestion: "Ajouter des mots-clés pertinents dans les titres et le corps de la page.",
  },
  {
    label: "Backlinks",
    icon: <FaLink />,
    score: 60,
    description: "Le site possède peu de backlinks entrants.",
    suggestion: "Créer du contenu de qualité pour attirer plus de backlinks naturels.",
  },
  {
    label: "Meta Description",
    icon: <FaInfoCircle />,
    score: 85,
    description: "La meta description est bien rédigée, mais pourrait être plus engageante.",
    suggestion: "Utiliser des appels à l'action et rester sous les 160 caractères.",
  },
  {
    label: "URL Canonical",
    icon: <FaGlobe />,
    score: 90,
    description: "L'URL canonical est correctement utilisée.",
    suggestion: "Continuer à appliquer les balises canonical sur les pages similaires.",
  },
];

const SEOAudit = () => {
  return (
    <div className="seo-audit-container">
      <Sidebar />
      <main className="seo-content">
        <h1 className="seo-title">Audit SEO</h1>
        <p className="seo-subtitle">Optimisez la visibilité de votre site web sur les moteurs de recherche.</p>

        <div className="seo-score-global">
          <div className="seo-circle">
            <CircularProgressbar
              value={seoScore}
              text={`${seoScore}%`}
              styles={buildStyles({
                textSize: "18px",
                pathColor: "#10b981",
                textColor: "#1e293b",
                trailColor: "#e5e7eb",
              })}
            />
          </div>
          <p className="seo-score-text">Score global SEO basé sur les critères d’optimisation essentiels.</p>
        </div>

        <div className="seo-metrics-grid">
          {seoMetrics.map((metric, index) => (
            <div className="seo-card" key={index}>
              <div className="seo-card-header">
                <span className="seo-icon">{metric.icon}</span>
                <h3>{metric.label}</h3>
              </div>
              <div className="seo-progress">
                <CircularProgressbar
                  value={metric.score}
                  text={`${metric.score}%`}
                  styles={buildStyles({
                    pathColor: "#3b82f6",
                    trailColor: "#f3f4f6",
                    textSize: "14px",
                    textColor: "#1f2937",
                  })}
                />
              </div>
              <p className="seo-description"><strong>Analyse :</strong> {metric.description}</p>
              <p className="seo-suggestion"><strong>Suggestion :</strong> {metric.suggestion}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SEOAudit;
