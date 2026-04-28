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
    // Only digits, max 9 digits (Cameroon: 6XXXXXXXX or 2XXXXXXXX)
    const digits = val.replace(/\D/g, "").slice(0, 9);
    setPhone(digits);
    setError("");
  }

  function validatePhone(digits) {
    if (digits.length !== 9) return "Phone number must be 9 digits e.g. 6XXXXXXXX";
    if (!["6", "2"].includes(digits[0])) return "Number must start with 6 or 2";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim() || name.trim().length < 2)
      return setError("Please enter your full name.");
    const phoneError = validatePhone(phone);
    if (phoneError) return setError(phoneError);

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

  function continueAsReturning() { loginVoter(returning); }

  // Format display: 6XX XXX XXX
  function formatDisplay(digits) {
    if (!digits) return "";
    const d = digits.padEnd(9, " ");
    return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6,9)}`.trimEnd();
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
                  placeholder="6XX XXX XXX"
                  value={phone}
                  onChange={e => handlePhoneInput(e.target.value)}
                  maxLength={9}
                />
              </div>
              <p style={{ fontSize:"0.75rem", color:"var(--text3)", marginTop:5 }}>
                Format: +237 6XX XXX XXX — used to identify you uniquely.
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
