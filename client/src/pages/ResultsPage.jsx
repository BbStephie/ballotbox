import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getElections, getResults } from "../api.jsx";

export default function ResultsPage() {
  const { electionId } = useParams();
  const [election, setElection] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [elections, results] = await Promise.all([
      getElections(),
      getResults(electionId),
    ]);
    setElection(elections.find(e => e.id === electionId));
    setData(results);
    setLoading(false);
  }

  useEffect(() => { load(); }, [electionId]);

  if (loading) return <div className="page"><div className="spinner-wrap"><div className="spinner" /></div></div>;
  if (!election) return <div className="page"><div className="container"><div className="alert alert-error">Election not found.</div></div></div>;

  const totalVoters = data?.totalVoters || 0;
  const results = data?.results || [];

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 680 }}>
        <div className="page-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1>{election.title} — Results</h1>
              {election.description && <p>{election.description}</p>}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span className={`badge ${election.isOpen ? "badge-green" : "badge-red"}`}>{election.isOpen ? "Open" : "Closed"}</span>
              <button className="btn btn-secondary btn-sm" onClick={load}>↻ Refresh</button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "1.75rem" }}>
          <div className="stat-card">
            <div className="val">{totalVoters}</div>
            <div className="lbl">Total voters</div>
          </div>
          <div className="stat-card">
            <div className="val">{results.length}</div>
            <div className="lbl">Posts</div>
          </div>
          <div className="stat-card">
            <div className="val">{results.reduce((s, r) => s + (r.candidates?.length || 0), 0)}</div>
            <div className="lbl">Candidates</div>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📊</div>
            <h3>No results yet</h3>
            <p>Waiting for votes to come in.</p>
          </div>
        ) : (
          results.map(({ post, candidates, totalVotes }) => (
            <div className="card" key={post.id} style={{ marginBottom: "1rem" }}>
              <div className="card-header">
                <div className="card-title">{post.title}</div>
                <span className="badge badge-gray">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
              </div>

              {candidates.length === 0 ? (
                <p style={{ color: "var(--text3)", fontSize: "0.875rem" }}>No candidates.</p>
              ) : (
                candidates.map((c, i) => {
                  const isLeader = i === 0 && c.votes > 0;
                  const isTie = i > 0 && candidates[0]?.votes === c.votes && c.votes > 0;
                  return (
                    <div className="poll-bar-wrap" key={c.id}>
                      <div className="poll-bar-meta">
                        <span className="poll-bar-name">
                          {c.name}
                          {isLeader && <span className="badge badge-gold" style={{ marginLeft: 8, fontSize: "0.7rem", padding: "2px 8px" }}>Leading</span>}
                          {isTie && <span className="badge badge-gray" style={{ marginLeft: 8, fontSize: "0.7rem", padding: "2px 8px" }}>Tied</span>}
                        </span>
                        <span className="poll-bar-stat">{c.votes} · {c.percentage}%</span>
                      </div>
                      <div className="poll-bar-track">
                        <div className={`poll-bar-fill${isLeader ? " leader" : ""}`} style={{ width: c.percentage + "%" }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ))
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
          {election.isOpen && <Link to={`/vote/${electionId}`} className="btn btn-primary">Vote now</Link>}
          <Link to="/elections" className="btn btn-secondary">All elections</Link>
        </div>
      </div>
    </div>
  );
}
