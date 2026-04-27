const mongoose = require("mongoose");

// ─── Global transform: _id → id, remove __v ───────────────────────────────────
function transform(doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  // Also stringify any ObjectId fields so frontend gets plain strings
  if (ret.electionId) ret.electionId = ret.electionId.toString();
  if (ret.postId) ret.postId = ret.postId.toString();
  if (ret.candidateId) ret.candidateId = ret.candidateId.toString();
  return ret;
}

const options = {
  toJSON: { transform },
  toObject: { transform },
};

// ─── Admin ─────────────────────────────────────────────────────────────────────
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, options);
const Admin = mongoose.model("Admin", adminSchema);

// ─── Voter ─────────────────────────────────────────────────────────────────────
const voterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  registeredAt: { type: Date, default: Date.now },
}, options);
const Voter = mongoose.model("Voter", voterSchema);

// ─── Election ──────────────────────────────────────────────────────────────────
const electionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  isOpen: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, options);
const Election = mongoose.model("Election", electionSchema);

// ─── Post ──────────────────────────────────────────────────────────────────────
const postSchema = new mongoose.Schema({
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: "Election", required: true },
  title: { type: String, required: true },
}, options);
const Post = mongoose.model("Post", postSchema);

// ─── Candidate ─────────────────────────────────────────────────────────────────
const candidateSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: "Election", required: true },
  name: { type: String, required: true },
}, options);
const Candidate = mongoose.model("Candidate", candidateSchema);

// ─── Vote ──────────────────────────────────────────────────────────────────────
const voteSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
  createdAt: { type: Date, default: Date.now },
}, options);
voteSchema.index({ phone: 1, postId: 1 }, { unique: true });
const Vote = mongoose.model("Vote", voteSchema);

module.exports = { Admin, Voter, Election, Post, Candidate, Vote };
