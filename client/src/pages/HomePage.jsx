import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getElections } from "../api.jsx";

export default function HomePage() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getElections()
      .then(setElections)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page"><div className="spinner-wrap"><div className="spinner" /></div></div>
  );

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Active Elections</h1>
          <p>Choose an election to cast your vote or view results.</p>
        </div>

        {elections.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🗳️</div>
            <h3>No elections yet</h3>
            <p>Head to the <Link to="/admin">Admin panel</Link> to create one.</p>
          </div>
        ) : (
          <div className="grid-2">
            {elections.map(el => (
              <div className="card" key={el.id}>
                <div className="card-header">
                  <div>
                    <div className="card-title">{el.title}</div>
                    {el.description && <div className="card-subtitle">{el.description}</div>}
                  </div>
                  <span className={`badge ${el.isOpen ? "badge-green" : "badge-red"}`}>
                    {el.isOpen ? "Open" : "Closed"}
                  </span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text3)", marginBottom: "1.25rem" }}>
                  Created {new Date(el.createdAt).toLocaleDateString()}
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  {el.isOpen && (
                    <Link to={`/vote/${el.id}`} className="btn btn-primary btn-sm">
                      Vote
                    </Link>
                  )}
                  <Link to={`/results/${el.id}`} className="btn btn-secondary btn-sm">
                    Results
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
