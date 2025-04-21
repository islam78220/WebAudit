// src/App.jsx

import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Overview from "./pages/Overview";
import PerformanceAudit from "./pages/PerformanceAudit";
import SEOAudit from "./pages/SEOAudit"; // ✅ Utilise bien SEOAudit
import UIUXTool from "./pages/UIUXTool";
import CompleteReport from "./pages/CompleteReport";

function App() {
  return (
    <Router>
      <div className="app-container flex">
        <Sidebar />
        <div className="main-content w-full">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/performance-audit" element={<PerformanceAudit />} />
            <Route path="/seo-audit" element={<SEOAudit />} /> {/* ✅ Corrigé ici */}
            <Route path="/ui-ux-audit" element={<UIUXTool />} />
            <Route path="/complete-report" element={<CompleteReport />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
