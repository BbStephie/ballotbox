import React, { createContext, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink, Link, Navigate } from "react-router-dom";
import "./index.css";
import LandingPage from "./pages/LandingPage.jsx";
import ElectionsPage from "./pages/ElectionsPage.jsx";
import VotePage from "./pages/VotePage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import { adminVerify, adminLogout, getAdminToken, clearAdminToken } from "./api.jsx";

export const VoterContext = createContext(null);
export const AdminContext = createContext(null);

function PublicNav({ voter, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to={voter ? "/elections" : "/"} className="navbar-brand">
          <span className="dot" />BallotBox
        </Link>
        <div className="navbar-links">
          {voter && (
            <>
              <span className="voter-name-pill">👤 {voter.name}</span>
              <NavLink to="/elections" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>Elections</NavLink>
              <button className="nav-link nav-btn" onClick={onLogout}>Sign out</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function AdminNav({ adminName, onLogout }) {
  return (
    <nav className="navbar navbar-admin">
      <div className="navbar-inner">
        <Link to="/admin" className="navbar-brand">
          <span className="dot dot-admin" />BallotBox
          <span style={{ fontSize:"0.75rem", color:"var(--text3)", marginLeft:6 }}>Admin</span>
        </Link>
        <div className="navbar-links">
          <span className="voter-name-pill" style={{ background:"#fef3c7", color:"#92400e" }}>⚙️ {adminName}</span>
          <Link to="/elections" className="nav-link">← Public</Link>
          <button className="nav-link nav-btn" onClick={onLogout}>Sign out</button>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const [voter, setVoter] = useState(() => {
    try { return JSON.parse(localStorage.getItem("voter") || "null"); } catch { return null; }
  });
  // admin = { name, token } or null
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("admin") || "null"); } catch { return null; }
  });
  const [adminChecked, setAdminChecked] = useState(false);

  // On load, verify stored admin token is still valid with the server
  useEffect(() => {
    if (admin && getAdminToken()) {
      adminVerify()
        .then(() => setAdminChecked(true))
        .catch(() => { clearAdminToken(); setAdmin(null); setAdminChecked(true); });
    } else {
      clearAdminToken();
      setAdmin(null);
      setAdminChecked(true);
    }
  }, []);

  function loginVoter(v) { localStorage.setItem("voter", JSON.stringify(v)); setVoter(v); }
  function logoutVoter() { localStorage.removeItem("voter"); setVoter(null); }

  function loginAdmin(data) {
    // data = { token, name } from server
    sessionStorage.setItem("admin", JSON.stringify(data));
    setAdmin(data);
  }

  async function logoutAdmin() {
    try { await adminLogout(); } catch {}
    clearAdminToken();
    setAdmin(null);
  }

  if (!adminChecked) return null; // brief flash prevention

  return (
    <VoterContext.Provider value={{ voter, loginVoter, logoutVoter }}>
      <AdminContext.Provider value={{ admin, loginAdmin, logoutAdmin }}>
        <BrowserRouter>
          <Routes>
            {/* Admin */}
            <Route path="/admin/login" element={
              admin ? <Navigate to="/admin" replace /> :
              <><PublicNav voter={voter} onLogout={logoutVoter}/><AdminLoginPage /></>
            }/>
            <Route path="/admin" element={
              admin
                ? <><AdminNav adminName={admin.name} onLogout={logoutAdmin}/><AdminPage /></>
                : <Navigate to="/admin/login" replace />
            }/>
            {/* Public */}
            <Route path="/" element={<><PublicNav voter={voter} onLogout={logoutVoter}/>{voter ? <Navigate to="/elections" replace /> : <LandingPage />}</>}/>
            <Route path="/elections" element={<><PublicNav voter={voter} onLogout={logoutVoter}/>{voter ? <ElectionsPage /> : <Navigate to="/" replace />}</>}/>
            <Route path="/vote/:electionId" element={<><PublicNav voter={voter} onLogout={logoutVoter}/>{voter ? <VotePage /> : <Navigate to="/" replace />}</>}/>
            <Route path="/results/:electionId" element={<><PublicNav voter={voter} onLogout={logoutVoter}/><ResultsPage /></>}/>
          </Routes>
        </BrowserRouter>
      </AdminContext.Provider>
    </VoterContext.Provider>
  );
}
