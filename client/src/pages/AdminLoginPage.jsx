import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AdminContext } from "../App.jsx";
import { adminLogin, setAdminToken } from "../api.jsx";

export default function AdminLoginPage() {
  const { loginAdmin } = useContext(AdminContext);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    if (!name.trim()) return setError("Please enter your name.");
    if (!password) return setError("Please enter the password.");
    setLoading(true);
    setError("");
    try {
      const data = await adminLogin(name.trim(), password);
      // data = { token, name }
      setAdminToken(data.token);
      loginAdmin(data);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check your password.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landing-wrap">
      <div className="landing-box">
        <div className="landing-icon">🔐</div>
        <h1 className="landing-title">Admin access</h1>
        <p className="landing-sub">Enter your name and the admin password to manage elections.</p>

        <form onSubmit={handleLogin} className="landing-form">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Your name</label>
            <input className="form-input landing-input" type="text"
              placeholder="e.g. Stephanie Bello"
              value={name} onChange={e => { setName(e.target.value); setError(""); }} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Admin password</label>
            <div style={{ position:"relative" }}>
              <input className="form-input landing-input"
                type={showPwd ? "text" : "password"}
                placeholder="Enter password..."
                value={password}
                style={{ paddingRight:44 }}
                onChange={e => { setPassword(e.target.value); setError(""); }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", cursor:"pointer", fontSize:16,
                  color:"var(--text3)", padding:0, lineHeight:1 }}
                title={showPwd ? "Hide" : "Show"}>
                {showPwd ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg landing-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign in as admin →"}
          </button>
        </form>

        <div className="landing-divider" />
        <Link to="/" className="admin-link">← Back to voter login</Link>
      </div>
    </div>
  );
}
