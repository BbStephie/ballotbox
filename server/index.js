require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Admin, Voter, Election, Post, Candidate, Vote } = require("./models");

const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","x-admin-token"],
}));
app.use(express.json());

// ─── Config ────────────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ballotbox";
const activeSessions = new Set();

// ─── Connect to MongoDB ────────────────────────────────────────────────────────
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => { console.error("❌ MongoDB connection error:", err.message); process.exit(1); });

// ─── Helpers ───────────────────────────────────────────────────────────────────
function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, "");
  return digits.startsWith("237") ? digits : "237" + digits;
}

// Convert mongoose doc(s) to plain JSON with id instead of _id
function toJSON(doc) {
  if (Array.isArray(doc)) return doc.map(d => d.toJSON());
  return doc.toJSON();
}

function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: "Unauthorized. Admin access required." });
  }
  next();
}

// ─── Admin auth ────────────────────────────────────────────────────────────────

app.post("/api/admin/login", async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
    if (!password) return res.status(400).json({ error: "Password is required" });
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Incorrect password" });

    let admin = await Admin.findOne({ name: name.trim() });
    if (!admin) admin = await Admin.create({ name: name.trim() });

    const token = new mongoose.Types.ObjectId().toString() + "-" + new mongoose.Types.ObjectId().toString();
    activeSessions.add(token);
    res.json({ token, name: admin.name, adminId: admin.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  activeSessions.delete(req.headers["x-admin-token"]);
  res.json({ message: "Logged out" });
});

app.get("/api/admin/verify", requireAdmin, (req, res) => res.json({ valid: true }));

app.get("/api/admin/admins", requireAdmin, async (req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: 1 });
    res.json(toJSON(admins));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Voter registration ────────────────────────────────────────────────────────

app.post("/api/voters/register", async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
    if (!phone?.trim()) return res.status(400).json({ error: "Phone number is required" });

    const normalized = normalizePhone(phone.trim());
    if (normalized.length < 9) return res.status(400).json({ error: "Enter a valid Cameroonian phone number" });

    const existing = await Voter.findOne({ phone: normalized });
    if (existing) return res.json({ voter: toJSON(existing), isNew: false });

    const voter = await Voter.create({ name: name.trim(), phone: normalized });
    res.status(201).json({ voter: toJSON(voter), isNew: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Elections ─────────────────────────────────────────────────────────────────

app.get("/api/elections", async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });
    res.json(toJSON(elections));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/elections", requireAdmin, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });
    const election = await Election.create({ title, description: description || "" });
    res.status(201).json(toJSON(election));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/api/elections/:id/toggle", requireAdmin, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ error: "Not found" });
    election.isOpen = !election.isOpen;
    await election.save();
    res.json(toJSON(election));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/elections/:id", requireAdmin, async (req, res) => {
  try {
    const posts = await Post.find({ electionId: req.params.id });
    const postIds = posts.map(p => p._id);
    await Vote.deleteMany({ postId: { $in: postIds } });
    await Candidate.deleteMany({ electionId: req.params.id });
    await Post.deleteMany({ electionId: req.params.id });
    await Election.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Posts ─────────────────────────────────────────────────────────────────────

app.get("/api/elections/:electionId/posts", async (req, res) => {
  try {
    const posts = await Post.find({ electionId: req.params.electionId });
    const enriched = await Promise.all(posts.map(async post => {
      const candidates = await Candidate.find({ postId: post._id });
      return { ...toJSON(post), candidates: toJSON(candidates) };
    }));
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/elections/:electionId/posts", requireAdmin, async (req, res) => {
  try {
    const { title, candidates: candNames = [] } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });
    const election = await Election.findById(req.params.electionId);
    if (!election) return res.status(404).json({ error: "Election not found" });

    const post = await Post.create({ electionId: req.params.electionId, title });
    const newCandidates = await Promise.all(
      candNames.map(n => n.trim()).filter(Boolean)
        .map(name => Candidate.create({ postId: post._id, electionId: req.params.electionId, name }))
    );
    res.status(201).json({ ...toJSON(post), candidates: toJSON(newCandidates) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/posts/:id", requireAdmin, async (req, res) => {
  try {
    await Vote.deleteMany({ postId: req.params.id });
    await Candidate.deleteMany({ postId: req.params.id });
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Candidates ────────────────────────────────────────────────────────────────

app.post("/api/posts/:postId/candidates", requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    const candidate = await Candidate.create({ postId: post._id, electionId: post.electionId, name });
    res.status(201).json(toJSON(candidate));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/candidates/:id", requireAdmin, async (req, res) => {
  try {
    await Vote.deleteMany({ candidateId: req.params.id });
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Votes ─────────────────────────────────────────────────────────────────────

app.get("/api/elections/:electionId/check-vote/:phone", async (req, res) => {
  try {
    const normalized = normalizePhone(req.params.phone);
    const posts = await Post.find({ electionId: req.params.electionId });
    const postIds = posts.map(p => p._id);
    const voterVotes = await Vote.find({ phone: normalized, postId: { $in: postIds } });
    const votedMap = {};
    voterVotes.forEach(v => { votedMap[v.postId.toString()] = v.candidateId.toString(); });
    res.json({
      hasVoted: voterVotes.length > 0,
      votedPostIds: voterVotes.map(v => v.postId.toString()),
      votedMap,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/elections/:electionId/vote", async (req, res) => {
  try {
    const { phone, ballots } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone is required" });
    if (!Array.isArray(ballots) || ballots.length === 0) return res.status(400).json({ error: "Ballots are required" });

    const election = await Election.findById(req.params.electionId);
    if (!election) return res.status(404).json({ error: "Election not found" });
    if (!election.isOpen) return res.status(403).json({ error: "This election is closed" });

    const normalized = normalizePhone(phone);
    const postIds = ballots.map(b => b.postId);

    const existing = await Vote.findOne({ phone: normalized, postId: { $in: postIds } });
    if (existing) return res.status(403).json({ error: "You have already voted on one or more of these posts" });

    await Vote.insertMany(ballots.map(b => ({
      phone: normalized,
      postId: b.postId,
      candidateId: b.candidateId,
    })));
    res.status(201).json({ message: "Vote cast successfully" });
  } catch (err) {
    if (err.code === 11000) return res.status(403).json({ error: "You have already voted on one or more posts" });
    res.status(500).json({ error: err.message });
  }
});

// ─── Results ───────────────────────────────────────────────────────────────────

app.get("/api/elections/:electionId/results", async (req, res) => {
  try {
    const posts = await Post.find({ electionId: req.params.electionId });
    const results = await Promise.all(posts.map(async post => {
      const postCandidates = await Candidate.find({ postId: post._id });
      const totalVotes = await Vote.countDocuments({ postId: post._id });
      const ranked = await Promise.all(postCandidates.map(async c => {
        const count = await Vote.countDocuments({ postId: post._id, candidateId: c._id });
        return { ...toJSON(c), votes: count, percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0 };
      }));
      ranked.sort((a, b) => b.votes - a.votes);
      return { post: toJSON(post), candidates: ranked, totalVotes };
    }));
    const postIds = posts.map(p => p._id);
    const uniqueVoters = await Vote.distinct("phone", { postId: { $in: postIds } });
    res.json({ results, totalVoters: uniqueVoters.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Admin voters list ─────────────────────────────────────────────────────────

app.get("/api/admin/voters", requireAdmin, async (req, res) => {
  try {
    const voters = await Voter.find().sort({ registeredAt: -1 });
    const enriched = await Promise.all(voters.map(async v => ({
      ...toJSON(v),
      voteCount: await Vote.countDocuments({ phone: v.phone }),
    })));
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
