# BallotBox — Voting App

A full-stack React + Node.js voting application.

## Project Structure

```
voting-app/
├── server/          # Express API (Node.js)
│   ├── index.js     # All routes and in-memory store
│   └── package.json
├── client/          # React frontend
│   ├── src/
│   │   ├── App.js            # Router + voter context
│   │   ├── api.js            # Axios API calls
│   │   ├── index.css         # Global styles
│   │   └── pages/
│   │       ├── HomePage.js   # List all elections
│   │       ├── AdminPage.js  # Manage elections/posts/candidates
│   │       ├── VotePage.js   # Cast a ballot
│   │       └── ResultsPage.js# View live results
│   └── package.json
└── package.json     # Root with concurrently
```

## Quick Start

> **Requirements**: Node.js 18+ recommended

### Option A — Run both together (recommended)

```bash
# 1. Install root dependencies
npm install

# 2. Install server + client dependencies
npm run install:all

# 3. Start both servers
npm run dev
```

- **React app**: http://localhost:3000  (Vite dev server)
- **API server**: http://localhost:5000 (Express)

---

### Option B — Run separately

```bash
# Terminal 1 — API server
cd server
npm install
npm run dev        # uses nodemon for auto-reload

# Terminal 2 — React app (Vite)
cd client
npm install
npm start          # runs vite on port 3000
```

---

## How to Use

### As Admin
1. Go to **Admin** tab
2. Create a new election (title + description)
3. Expand the election → add posts (e.g. President, Secretary)
4. Add candidates to each post
5. Toggle the election **Open** when ready

### As Voter
1. Go to **Elections** tab
2. Click **Vote** on an open election
3. Select one candidate per post
4. Submit — your vote is recorded once per voter ID

### Results
- Click **Results** on any election to see live bar chart
- Results update in real time; use the **Refresh** button

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/elections | List all elections |
| POST | /api/elections | Create election |
| PUT | /api/elections/:id/toggle | Open/close election |
| DELETE | /api/elections/:id | Delete election |
| GET | /api/elections/:id/posts | Get posts + candidates |
| POST | /api/elections/:id/posts | Create post |
| DELETE | /api/posts/:id | Delete post |
| POST | /api/posts/:id/candidates | Add candidate |
| DELETE | /api/candidates/:id | Delete candidate |
| GET | /api/elections/:id/check-vote/:voterId | Check if voted |
| POST | /api/elections/:id/vote | Submit ballot |
| GET | /api/elections/:id/results | Get results |

---

## Extending the App

### Add a real database (MongoDB)
```bash
cd server && npm install mongoose
```
Replace the in-memory arrays with Mongoose models.

### Add authentication
```bash
cd server && npm install jsonwebtoken bcryptjs
```
Protect admin routes with JWT middleware.

### Deploy
- **Server**: Deploy to Railway, Render, or Heroku
- **Client**: `npm run build --prefix client` → deploy `build/` to Netlify/Vercel
- Set `REACT_APP_API_URL` env var in production and update `api.js` accordingly
