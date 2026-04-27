import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { getElections } from "../api.jsx";
import { VoterContext } from "../App.jsx";

export default function ElectionsPage() {
  const { voter } = useContext(VoterContext);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getElections().then(setElections).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="spinner-wrap"><div className="spinner" /></div></div>;

  const open = elections.filter(e => e.isOpen);
  const closed = elections.filter(e => !e.isOpen);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Hello, {voter.name} 👋</h1>
          <p>Choose an election below to cast your vote or view results.</p>
        </div>

        {elections.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <h3>No elections available yet</h3>
            <p>Check back soon — elections will appear here once they are opened.</p>
          </div>
        ) : (
          <>
            {open.length > 0 && (
              <>
                <div className="section-label" style={{ marginBottom: "0.75rem" }}>Open elections</div>
                <div className="grid-2" style={{ marginBottom: "2rem" }}>
                  {open.map(el => (
                    <div className="card election-card" key={el.id}>
                      <div className="card-header">
                        <div>
                          <div className="card-title">{el.title}</div>
                          {el.description && <div className="card-subtitle">{el.description}</div>}
                        </div>
                        <span className="badge badge-green">Open</span>
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "var(--text3)", marginBottom: "1.25rem" }}>
                        Started {new Date(el.createdAt).toLocaleDateString()}
                      </p>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <Link to={`/vote/${el.id}`} className="btn btn-primary btn-sm">
                          Vote now →
                        </Link>
                        <Link to={`/results/${el.id}`} className="btn btn-secondary btn-sm">
                          Results
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {closed.length > 0 && (
              <>
                <div className="section-label" style={{ marginBottom: "0.75rem" }}>Closed elections</div>
                <div className="grid-2">
                  {closed.map(el => (
                    <div className="card election-card election-card-closed" key={el.id}>
                      <div className="card-header">
                        <div>
                          <div className="card-title" style={{ color: "var(--text2)" }}>{el.title}</div>
                          {el.description && <div className="card-subtitle">{el.description}</div>}
                        </div>
                        <span className="badge badge-red">Closed</span>
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "var(--text3)", marginBottom: "1.25rem" }}>
                        Created {new Date(el.createdAt).toLocaleDateString()}
                      </p>
                      <Link to={`/results/${el.id}`} className="btn btn-secondary btn-sm">
                        View results
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
