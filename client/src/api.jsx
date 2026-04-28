import axios from "axios";

// In production (Netlify), set VITE_API_URL to your Render backend URL
// e.g. https://ballotbox-api.onrender.com
// In development, the Vite proxy handles /api → localhost:5000
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

// ─── Admin token helpers ───────────────────────────────────────────────────────
export function getAdminToken() { return sessionStorage.getItem("adminToken"); }
export function setAdminToken(t) { sessionStorage.setItem("adminToken", t); }
export function clearAdminToken() { sessionStorage.removeItem("adminToken"); sessionStorage.removeItem("admin"); }

function adminHeaders() {
  return { "x-admin-token": getAdminToken() };
}

// ─── Admin auth ────────────────────────────────────────────────────────────────
export const adminLogin = (name, password) =>
  axios.post(`${BASE}/admin/login`, { name, password }).then(r => r.data);
export const adminLogout = () =>
  axios.post(`${BASE}/admin/logout`, {}, { headers: adminHeaders() }).then(r => r.data);
export const adminVerify = () =>
  axios.get(`${BASE}/admin/verify`, { headers: adminHeaders() }).then(r => r.data);

// ─── Public ────────────────────────────────────────────────────────────────────
export const getElections = () => axios.get(`${BASE}/elections`).then(r => r.data);
export const getPosts = (electionId) => axios.get(`${BASE}/elections/${electionId}/posts`).then(r => r.data);
export const checkVote = (electionId, phone) => axios.get(`${BASE}/elections/${electionId}/check-vote/${encodeURIComponent(phone)}`).then(r => r.data);
export const submitVote = (electionId, data) => axios.post(`${BASE}/elections/${electionId}/vote`, data).then(r => r.data);
export const getResults = (electionId) => axios.get(`${BASE}/elections/${electionId}/results`).then(r => r.data);
export const registerVoter = (name, phone) => axios.post(`${BASE}/voters/register`, { name, phone }).then(r => r.data);

// ─── Admin-only ────────────────────────────────────────────────────────────────
export const createElection = (data) => axios.post(`${BASE}/elections`, data, { headers: adminHeaders() }).then(r => r.data);
export const toggleElection = (id) => axios.put(`${BASE}/elections/${id}/toggle`, {}, { headers: adminHeaders() }).then(r => r.data);
export const deleteElection = (id) => axios.delete(`${BASE}/elections/${id}`, { headers: adminHeaders() }).then(r => r.data);
export const createPost = (electionId, data) => axios.post(`${BASE}/elections/${electionId}/posts`, data, { headers: adminHeaders() }).then(r => r.data);
export const deletePost = (postId) => axios.delete(`${BASE}/posts/${postId}`, { headers: adminHeaders() }).then(r => r.data);
export const createCandidate = (postId, data) => axios.post(`${BASE}/posts/${postId}/candidates`, data, { headers: adminHeaders() }).then(r => r.data);
export const deleteCandidate = (id) => axios.delete(`${BASE}/candidates/${id}`, { headers: adminHeaders() }).then(r => r.data);
export const getAdminVoters = () => axios.get(`${BASE}/admin/voters`, { headers: adminHeaders() }).then(r => r.data);

export const deleteVoter = (id) => axios.delete(`${BASE}/admin/voters/${id}`, { headers: adminHeaders() }).then(r => r.data);
