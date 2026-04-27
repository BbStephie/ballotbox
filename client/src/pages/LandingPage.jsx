import React, { useState, useContext } from "react";
import { VoterContext } from "../App.jsx";
import { registerVoter } from "../api.jsx";

export default function LandingPage() {
  const { loginVoter } = useContext(VoterContext);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [returning, setReturning] = useState(null);

  function handlePhoneInput(val) {
    // Only allow digits, max 8 digits after +237
    const digits = val.replace(/\D/g, "").slice(0, 8);
    setPhone(digits);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim() || name.trim().length < 2)
      return setError("Please enter your full name.");
    if (phone.length < 8)
      return setError("Please enter a valid 8-digit phone number.");

    const fullPhone = "237" + phone;
    setLoading(true);
    try {
      const data = await registerVoter(name.trim(), fullPhone);
      if (!data.isNew && data.voter.name !== name.trim()) {
        setReturning(data.voter);
        setLoading(false);
        return;
      }
      loginVoter(data.voter);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function continueAsReturning() {
    loginVoter(returning);
  }

  return (
    <div className="landing-wrap">
      <div className="landing-box">
        <div className="landing-icon">🗳️</div>
        <h1 className="landing-title">Welcome to BallotBox</h1>
        <p className="landing-sub">Enter your name and phone number to access elections and cast your vote.</p>

        {returning ? (
          <div>
            <div className="alert alert-warning" style={{ textAlign:"left", marginBottom:"1rem" }}>
              This number is already registered as <strong>{returning.name}</strong>.
            </div>
            <button className="btn btn-primary landing-btn" onClick={continueAsReturning}>
              Continue as {returning.name}
            </button>
            <button className="btn btn-secondary landing-btn" style={{ marginTop:8 }}
              onClick={() => { setReturning(null); setPhone(""); setName(""); }}>
              Use a different number
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="landing-form">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="form-input landing-input" type="text"
                placeholder="e.g. Jean-Pierre Mbarga"
                value={name} onChange={e => { setName(e.target.value); setError(""); }} autoFocus />
            </div>

            <div className="form-group">
              <label className="form-label">Phone number</label>
              <div className="phone-input-wrap">
                <span className="phone-prefix">🇨🇲 +237</span>
                <input
                  className="form-input phone-input"
                  type="tel"
                  inputMode="numeric"
                  placeholder="6XXXXXXX"
                  value={phone}
                  onChange={e => handlePhoneInput(e.target.value)}
                  maxLength={8}
                />
              </div>
              <p style={{ fontSize:"0.75rem", color:"var(--text3)", marginTop:5 }}>
                Your phone number identifies you uniquely — you can only vote once per election.
              </p>
            </div>

            <button type="submit" className="btn btn-primary btn-lg landing-btn" disabled={loading}>
              {loading ? "Checking..." : "Enter & vote →"}
            </button>
          </form>
        )}

        <div className="landing-divider" />
        <a href="/admin/login" className="admin-link">Admin login →</a>
      </div>
    </div>
  );
}
