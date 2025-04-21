// src/components/Sidebar.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../styles/Sidebar.css"; // Importation du fichier CSS

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h1 className="sidebar-logo">Site URL</h1>
      <ul className="sidebar-menu">
        <li><Link to="/">Vue d'ensemble</Link></li>
        <li><Link to="/performance-audit">Audit Performance</Link></li>
        <li><Link to="/uiux-audit">Audit UI/UX</Link></li>
        <li><Link to="/seo-audit">Audit SEO</Link></li>
        <li><Link to="/full-report">Rapport Complet</Link></li>
      </ul>
      <div className="sidebar-footer">
        <p>© 2025 MonSite.com</p>
      </div>
    </div>
  );
};

export default Sidebar;
