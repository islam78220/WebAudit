// src/components/Dashboard.jsx
import React from 'react';
import Sidebar from './Sidebar'; 
import '../styles/Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <header className="dashboard-header">
          <h1>Tableau de Bord - Audit de Site Web</h1>
        </header>
        <section className="overview">
          <h2>Vue d'ensemble</h2>
          <p>Bienvenue sur votre tableau de bord de performance et d’audit SEO.</p>
        </section>
        <section className="seo-audit">
          <h2>Audit SEO</h2>
          <p>Analyse complète de votre référencement.</p>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
