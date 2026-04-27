import React, { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { getElections, getPosts, checkVote, submitVote } from "../api.jsx";
import { VoterContext } from "../App.jsx";

const COLORS = [
  { bg:"#e8f0ea", fg:"#1a472a" },{ bg:"#e0f2fe", fg:"#0369a1" },
  { bg:"#fef3c7", fg:"#92400e" },{ bg:"#fce7f3", fg:"#9d174d" },
  { bg:"#ede9fe", fg:"#5b21b6" },
];

function initials(name) {
  return name.trim().split(" ").map(w => w[0]?.toUpperCase() || "").join("").slice(0,2) || "?";
}

export default function VotePage() {
  const { electionId } = useParams();
  const { voter } = useContext(VoterContext);
  const [election, setElection] = useState(null);
  const [posts, setPosts] = useState([]);
  const [votedMap, setVotedMap] = useState({});   // postId -> candidateId already voted
  const [selections, setSelections] = useState({}); // postId -> candidateId selected now
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [justVoted, setJustVoted] = useState(false);

  async function load() {
    const [elections, postsData, voteStatus] = await Promise.all([
      getElections(),
      getPosts(electionId),
      checkVote(electionId, voter.phone),
    ]);
    setElection(elections.find(e => e.id === electionId));
    setPosts(postsData.filter(p => p.candidates.length > 0));
    setVotedMap(voteStatus.votedMap || {});
    setLoading(false);
  }

  useEffect(() => { load(); }, [electionId]);

  // Posts the user still needs to vote on
  const pendingPosts = posts.filter(p => !votedMap[p.id]);
  // Posts the user already voted on
  const donePosts = posts.filter(p => votedMap[p.id]);

  const progress = posts.length > 0
    ? Math.round(((donePosts.length + Object.keys(selections).length) / posts.length) * 100)
    : 0;

  async function handleSubmit() {
    const missing = pendingPosts.filter(p => !selections[p.id]);
    if (missing.length > 0) {
      setError(`Please vote for all posts. Missing: ${missing.map(p => p.title).join(", ")}`);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const ballots = Object.entries(selections).map(([postId, candidateId]) => ({ postId, candidateId }));
      await submitVote(electionId, { phone: voter.phone, ballots });
      setJustVoted(true);
      await load(); // refresh to show all as voted
      setSelections({});
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page"><div className="spinner-wrap"><div className="spinner" /></div></div>;
  if (!election) return <div className="page"><div className="container"><div className="alert alert-error">Election not found.</div></div></div>;

  if (!election.isOpen) return (
    <div className="page"><div className="container" style={{ maxWidth:560 }}>
      <div className="empty-state">
        <div className="icon">🔒</div>
        <h3>This election is closed</h3>
        <p>Voting is no longer available.</p>
        <Link to={`/results/${electionId}`} className="btn btn-primary" style={{ marginTop:"1rem" }}>View results</Link>
      </div>
    </div></div>
  );

  // All posts are voted and nothing new to vote on
  const allDone = pendingPosts.length === 0;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth:620 }}>
        <div className="page-header">
          <h1>{election.title}</h1>
          {election.description && <p>{election.description}</p>}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.82rem", color:"var(--text2)", marginBottom:6 }}>
            <span>{donePosts.length} of {posts.length} posts voted</span>
            <span>{progress}%</span>
          </div>
          <div style={{ height:6, background:"var(--surface2)", borderRadius:99, overflow:"hidden" }}>
            <div style={{ height:"100%", width:progress+"%", background:"var(--accent)", borderRadius:99, transition:"width 0.4s" }} />
          </div>
        </div>

        {/* Success banner after submitting */}
        {justVoted && (
          <div className="alert alert-success" style={{ marginBottom:"1rem" }}>
            🎉 Your vote has been recorded for the new posts!
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {/* NEW posts — still need to vote */}
        {pendingPosts.length > 0 && (
          <>
            {donePosts.length > 0 && (
              <div className="section-label" style={{ marginBottom:"0.75rem", color:"var(--accent)" }}>
                🆕 New posts — cast your vote
              </div>
            )}
            {pendingPosts.map(post => (
              <div className="card" key={post.id} style={{ marginBottom:"1rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
                  <div className="card-title">{post.title}</div>
                  {selections[post.id]
                    ? <span className="badge badge-green">✓ Selected</span>
                    : <span className="badge" style={{ background:"#fef3c7", color:"#92400e" }}>Required</span>}
                </div>
                {post.candidates.map((c, i) => {
                  const col = COLORS[i % COLORS.length];
                  const selected = selections[post.id] === c.id;
                  return (
                    <label key={c.id} className={`candidate-opt${selected ? " selected" : ""}`}
                      onClick={() => setSelections(s => ({ ...s, [post.id]: c.id }))}>
                      <input type="radio" name={post.id} value={c.id} checked={selected}
                        onChange={() => setSelections(s => ({ ...s, [post.id]: c.id }))} />
                      <div className="avatar" style={{ background:col.bg, color:col.fg }}>{initials(c.name)}</div>
                      <span style={{ fontWeight:500, fontSize:"0.95rem" }}>{c.name}</span>
                    </label>
                  );
                })}
              </div>
            ))}

            <button className="btn btn-primary btn-lg" style={{ width:"100%", marginTop:"0.5rem" }}
              onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Cast my vote 🗳️"}
            </button>
            <p style={{ fontSize:"0.78rem", color:"var(--text3)", textAlign:"center", marginTop:8 }}>
              You can only vote once per post.
            </p>
          </>
        )}

        {/* DONE posts — already voted, shown as read-only */}
        {donePosts.length > 0 && (
          <>
            <div className="section-label" style={{ margin: pendingPosts.length > 0 ? "2rem 0 0.75rem" : "0 0 0.75rem" }}>
              {allDone ? "✅ All votes recorded" : "Already voted"}
            </div>

            {allDone && (
              <div style={{ marginBottom:"1rem", display:"flex", gap:10 }}>
                <Link to={`/results/${electionId}`} className="btn btn-primary">View live results</Link>
                <Link to="/elections" className="btn btn-secondary">All elections</Link>
              </div>
            )}

            {donePosts.map(post => {
              const votedCandidateId = votedMap[post.id];
              return (
                <div className="card" key={post.id} style={{ marginBottom:"1rem", opacity:0.75 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
                    <div className="card-title">{post.title}</div>
                    <span className="badge badge-green">✓ Voted</span>
                  </div>
                  {post.candidates.map((c, i) => {
                    const col = COLORS[i % COLORS.length];
                    const wasSelected = c.id === votedCandidateId;
                    return (
                      <div key={c.id} className={`candidate-opt${wasSelected ? " selected" : ""}`}
                        style={{ cursor:"default", opacity: wasSelected ? 1 : 0.5 }}>
                        <input type="radio" readOnly checked={wasSelected} style={{ pointerEvents:"none" }} />
                        <div className="avatar" style={{ background:col.bg, color:col.fg }}>{initials(c.name)}</div>
                        <span style={{ fontWeight: wasSelected ? 600 : 400, fontSize:"0.95rem" }}>{c.name}</span>
                        {wasSelected && <span style={{ marginLeft:"auto", fontSize:"0.8rem", color:"var(--accent)", fontWeight:500 }}>Your choice</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
