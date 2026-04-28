import React, { useEffect, useState, useContext } from "react";
import { AdminContext } from "../App.jsx";
import { getAdminVoters,
  getElections, createElection, toggleElection, deleteElection,
  getPosts, createPost, deletePost,
  createCandidate, deleteCandidate, deleteVoter, getResults,
} from "../api.jsx";


export default function AdminPage() {
  const { admin } = useContext(AdminContext);
  const [elections, setElections] = useState([]);
  const [postsMap, setPostsMap] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [voters, setVoters] = useState([]);
  const [showVoters, setShowVoters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [elForm, setElForm] = useState({ title: "", description: "" });
  // New post form: { title, candidates: ["","",""] }
  const [postForm, setPostForm] = useState({ title: "", candidates: ["", ""] });
  const [showPostForm, setShowPostForm] = useState(null); // electionId
  const [resultsModal, setResultsModal] = useState(null); // { election, data }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [els, vts] = await Promise.all([getElections(), getAdminVoters()]);
    setElections(els);
    setVoters(vts);
    setLoading(false);
  }

  async function handleDeleteVoter(id) {
    if (!window.confirm('Delete this voter and all their votes?')) return;
    await deleteVoter(id);
    setVoters(prev => prev.filter(v => v.id !== id));
  }

  async function handleViewResults(el) {
    const data = await getResults(el.id);
    setResultsModal({ election: el, data });
  }

  async function loadPosts(electionId) {
    const data = await getPosts(electionId);
    setPostsMap(m => ({ ...m, [electionId]: data }));
  }

  function toggleExpand(id) {
    const next = expanded === id ? null : id;
    setExpanded(next);
    if (next && !postsMap[next]) loadPosts(next);
  }

  async function handleCreateElection(e) {
    e.preventDefault();
    if (!elForm.title.trim()) return setError("Title is required");
    setError("");
    const el = await createElection({ title: elForm.title, description: elForm.description });
    setElections(p => [...p, el]);
    setElForm({ title: "", description: "" });
    setShowCreate(false);
    setExpanded(el.id);
    setPostsMap(m => ({ ...m, [el.id]: [] }));
  }

  async function handleToggle(id) {
    const updated = await toggleElection(id);
    setElections(p => p.map(e => e.id === id ? updated : e));
  }

  async function handleDeleteElection(id) {
    if (!window.confirm("Delete this election and all its data?")) return;
    await deleteElection(id);
    setElections(p => p.filter(e => e.id !== id));
    if (expanded === id) setExpanded(null);
  }

  async function handleAddPost(electionId) {
    const title = postForm.title.trim();
    if (!title) return;
    const cands = postForm.candidates.map(c => c.trim()).filter(Boolean);
    if (cands.length < 2) return alert("Please add at least 2 candidates.");
    const post = await createPost(electionId, { title, candidates: cands });
    setPostsMap(m => ({ ...m, [electionId]: [...(m[electionId] || []), post] }));
    setPostForm({ title: "", candidates: ["", ""] });
    setShowPostForm(null);
  }

  async function handleDeletePost(electionId, postId) {
    if (!window.confirm("Remove this post?")) return;
    await deletePost(postId);
    setPostsMap(m => ({ ...m, [electionId]: m[electionId].filter(p => p.id !== postId) }));
  }

  async function handleAddCandidate(electionId, postId) {
    const name = window.prompt("New candidate name:");
    if (!name?.trim()) return;
    const c = await createCandidate(postId, { name: name.trim() });
    setPostsMap(m => ({
      ...m,
      [electionId]: m[electionId].map(p => p.id === postId ? { ...p, candidates: [...p.candidates, c] } : p),
    }));
  }

  async function handleDeleteCandidate(electionId, postId, candId) {
    await deleteCandidate(candId);
    setPostsMap(m => ({
      ...m,
      [electionId]: m[electionId].map(p =>
        p.id === postId ? { ...p, candidates: p.candidates.filter(c => c.id !== candId) } : p
      ),
    }));
  }

  function updateCandInput(i, val) {
    setPostForm(f => {
      const cands = [...f.candidates];
      cands[i] = val;
      return { ...f, candidates: cands };
    });
  }

  function addCandField() {
    setPostForm(f => ({ ...f, candidates: [...f.candidates, ""] }));
  }

  function removeCandField(i) {
    setPostForm(f => ({ ...f, candidates: f.candidates.filter((_, idx) => idx !== i) }));
  }

  if (loading) return <div className="page"><div className="spinner-wrap"><div className="spinner" /></div></div>;

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="page-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome, <strong>{admin?.name}</strong>. Manage elections below.</p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-secondary" onClick={() => setShowVoters(v => !v)}>
              {showVoters ? "Hide voters" : `Voters (${voters.length})`}
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New election</button>
          </div>
        </div>


        {/* Results modal */}
        {resultsModal && (
          <div className="modal-overlay" onClick={() => setResultsModal(null)}>
            <div className="modal" style={{ maxWidth:620, maxHeight:"80vh", overflowY:"auto" }} onClick={e => e.stopPropagation()}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
                <h2 style={{ margin:0 }}>{resultsModal.election.title}</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setResultsModal(null)}>✕ Close</button>
              </div>

              <div style={{ display:"flex", gap:10, marginBottom:"1.25rem" }}>
                <div className="stat-card" style={{ flex:1 }}>
                  <div className="val">{resultsModal.data.totalVoters}</div>
                  <div className="lbl">Total voters</div>
                </div>
                <div className="stat-card" style={{ flex:1 }}>
                  <div className="val">{resultsModal.data.results.length}</div>
                  <div className="lbl">Posts</div>
                </div>
              </div>

              {resultsModal.data.results.length === 0 ? (
                <p style={{ color:"var(--text3)", textAlign:"center", padding:"1.5rem" }}>No votes yet.</p>
              ) : resultsModal.data.results.map(({ post, candidates, totalVotes }) => (
                <div key={post.id} style={{ marginBottom:"1.25rem", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.75rem" }}>
                    <span style={{ fontWeight:600 }}>{post.title}</span>
                    <span className="badge badge-gray">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
                  </div>
                  {candidates.map((c, i) => (
                    <div key={c.id} style={{ marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.875rem", marginBottom:4 }}>
                        <span style={{ fontWeight:500 }}>
                          {c.name}
                          {i === 0 && c.votes > 0 && <span className="badge badge-gold" style={{ marginLeft:8, fontSize:"0.7rem" }}>Leading</span>}
                        </span>
                        <span style={{ color:"var(--text2)" }}>{c.votes} · {c.percentage}%</span>
                      </div>
                      <div style={{ height:8, background:"var(--surface2)", borderRadius:99, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:c.percentage+"%", background: i===0 && c.votes>0 ? "#c09a3a" : "var(--accent)", borderRadius:99, transition:"width 0.4s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Voters panel */}
        {showVoters && (
          <div className="card" style={{ marginBottom:"1.5rem" }}>
            <div className="card-title" style={{ marginBottom:"1rem" }}>Registered voters</div>
            {voters.length === 0 ? (
              <p style={{ color:"var(--text3)", fontSize:"0.875rem" }}>No voters registered yet.</p>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid var(--border)" }}>
                    <th style={{ textAlign:"left", padding:"6px 8px", color:"var(--text2)", fontWeight:500 }}>Name</th>
                    <th style={{ textAlign:"left", padding:"6px 8px", color:"var(--text2)", fontWeight:500 }}>Phone</th>
                    <th style={{ textAlign:"left", padding:"6px 8px", color:"var(--text2)", fontWeight:500 }}>Votes cast</th>
                    <th style={{ textAlign:"left", padding:"6px 8px", color:"var(--text2)", fontWeight:500 }}>Registered</th>
                    <th style={{ padding:"6px 8px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {voters.map(v => (
                    <tr key={v.id} style={{ borderBottom:"1px solid var(--border)" }}>
                      <td style={{ padding:"8px" }}>{v.name}</td>
                      <td style={{ padding:"8px", fontFamily:"monospace", fontSize:"0.82rem" }}>
                        {"*".repeat(v.phone.length - 3) + v.phone.slice(-3)}
                      </td>
                      <td style={{ padding:"8px" }}>{v.voteCount}</td>
                      <td style={{ padding:"8px", color:"var(--text3)" }}>{new Date(v.registeredAt).toLocaleDateString()}</td>
                      <td style={{ padding:"8px" }}>
                        <button className="btn btn-danger-ghost btn-sm" onClick={() => handleDeleteVoter(v.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Create election modal */}
        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>New Election</h2>
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleCreateElection}>
                <div className="form-group">
                  <label className="form-label">Election title *</label>
                  <input className="form-input" value={elForm.title}
                    onChange={e => setElForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Student Council 2025" autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <textarea className="form-textarea" value={elForm.description}
                    onChange={e => setElForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description..." />
                </div>
                <p style={{ fontSize:"0.8rem", color:"var(--text3)", marginBottom:"1rem" }}>
                  Elections are created as <strong>Closed</strong> by default. Open them when ready to accept votes.
                </p>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add post modal */}
        {showPostForm && (
          <div className="modal-overlay" onClick={() => setShowPostForm(null)}>
            <div className="modal" style={{ maxWidth:520 }} onClick={e => e.stopPropagation()}>
              <h2>Add Post</h2>
              <div className="form-group">
                <label className="form-label">Post title *</label>
                <input className="form-input" value={postForm.title}
                  onChange={e => setPostForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. President, Secretary General..." autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Candidates *</label>
                {postForm.candidates.map((c, i) => (
                  <div key={i} style={{ display:"flex", gap:8, marginBottom:8 }}>
                    <input className="form-input" value={c}
                      onChange={e => updateCandInput(i, e.target.value)}
                      placeholder={`Candidate ${i + 1}`}
                      onKeyDown={e => e.key === "Enter" && i === postForm.candidates.length - 1 && addCandField()}
                    />
                    {postForm.candidates.length > 2 && (
                      <button type="button" className="btn btn-danger-ghost btn-sm" onClick={() => removeCandField(i)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-ghost btn-sm" onClick={addCandField}>+ Add candidate</button>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => { setShowPostForm(null); setPostForm({ title:"", candidates:["",""] }); }}>Cancel</button>
                <button className="btn btn-primary" onClick={() => handleAddPost(showPostForm)}>Add post</button>
              </div>
            </div>
          </div>
        )}

        {/* Elections list */}
        {elections.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <h3>No elections yet</h3>
            <p>Click "New election" to get started.</p>
          </div>
        ) : elections.map(el => (
          <div className="card" key={el.id} style={{ marginBottom:"1rem" }}>
            <div className="card-header">
              <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, cursor:"pointer" }} onClick={() => toggleExpand(el.id)}>
                <span style={{ fontSize:"1.1rem", color:"var(--text3)" }}>{expanded === el.id ? "▾" : "▸"}</span>
                <div>
                  <div className="card-title">{el.title}</div>
                  {el.description && <div className="card-subtitle">{el.description}</div>}
                </div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
                <span className={`badge ${el.isOpen ? "badge-green" : "badge-red"}`}>{el.isOpen ? "Open" : "Closed"}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => handleToggle(el.id)}>
                  {el.isOpen ? "Close voting" : "Open voting"}
                </button>
                <a href={`/results/${el.id}`} className="btn btn-secondary btn-sm">Results</a>
                <button className="btn btn-danger-ghost btn-sm" onClick={() => handleDeleteElection(el.id)}>Delete</button>
              </div>
            </div>

            {expanded === el.id && (
              <div>
                <hr className="divider" />
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
                  <div className="section-label">Posts & Candidates</div>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setShowPostForm(el.id); setPostForm({ title:"", candidates:["",""] }); }}>
                    + Add post
                  </button>
                </div>

                {(!postsMap[el.id] || postsMap[el.id].length === 0) ? (
                  <p style={{ fontSize:"0.875rem", color:"var(--text3)", textAlign:"center", padding:"1.5rem" }}>
                    No posts yet. Click "Add post" to create one with candidates.
                  </p>
                ) : postsMap[el.id].map(post => (
                  <div key={post.id} style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1rem", marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <span style={{ fontWeight:600, fontSize:"0.95rem" }}>{post.title}</span>
                      <button className="btn btn-danger-ghost btn-sm" onClick={() => handleDeletePost(el.id, post.id)}>Remove</button>
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:10 }}>
                      {post.candidates.map((c, i) => (
                        <span key={c.id} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 12px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:99, fontSize:"0.85rem" }}>
                          <span style={{ width:22, height:22, borderRadius:"50%", background:"var(--accent-light)", color:"var(--accent)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600 }}>
                            {c.name.slice(0,1).toUpperCase()}
                          </span>
                          {c.name}
                          <button onClick={() => handleDeleteCandidate(el.id, post.id, c.id)}
                            style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)", fontSize:14, padding:0, lineHeight:1 }}>×</button>
                        </span>
                      ))}
                      <button className="btn btn-ghost btn-sm" onClick={() => handleAddCandidate(el.id, post.id)}>+ Add</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
