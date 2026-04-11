# 🚌 Schuber — Safety First, Always

> A full-stack school transportation platform.
## 🏗️ Project Structure

```
schuber/
├── frontend/          # React app (GitHub Pages hosted)
│   ├── src/
│   │   ├── pages/     # LandingPage, Login, Register, Dashboards
│   │   ├── components/ # Layout, StatCard, LiveMap
│   │   ├── context/   # AuthContext (JWT auth)
│   │   └── api.js     # API service layer
│   └── package.json
├── backend/           # Node.js + Express API
│   ├── src/
│   │   ├── db.js      # SQLite schema + seed data
│   │   ├── index.js   # Server entry
│   │   ├── middleware.js # JWT middleware
│   │   └── routes/    # auth, trips, drivers, students
│   └── package.json
└── README.md
```

## 🎯 Features

- **🔐 Authentication** — JWT-based login/register for Parent, Driver, Admin roles
- **📍 Live Tracking** — Real-time GPS map (Leaflet) showing van location
- **✅ Attendance** — Driver marks student check-in/check-out per trip
- **🔔 Notifications** — Alerts for boarding, delays, emergencies
- **📊 Dashboards** — Role-specific dashboards (Parent / Driver / Admin)
- **🛡️ Driver Profiles** — Verified drivers with license, vehicle, route details
- **🗄️ SQLite DB** — Seeded with demo data for instant testing

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js **20 LTS** (recommended — use `nvm install 20 && nvm use 20`)
- npm 9+

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/schuber.git
cd schuber
```

### 2. Install dependencies
```bash
# Backend (Terminal 1)
cd backend
cp .env.example .env
npm install

# Frontend (Terminal 2 — new window)
cd frontend
cp .env.example .env
npm install
```

### 3. Start the backend
```bash
cd backend
npm run dev
# Runs on http://localhost:4000
# DB is auto-created and seeded on first run
```

### 4. Start the frontend
```bash
cd frontend
npm start
# Opens http://localhost:3000 automatically
```

### 5. Demo Accounts
| Role   | Email                  | Password    |
|--------|------------------------|-------------|
| Parent | priya@example.com      | parent123   |
| Driver | suresh@example.com     | driver123   |
| Admin  | admin@schuber.com      | admin123    |

### Troubleshooting
- **`better-sqlite3` build error** — You're likely on Node v25+. Switch to Node 20:
  ```bash
  nvm install 20 && nvm use 20
  rm -rf node_modules && npm install
  ```
- **`nodemon: command not found`** — Run `npm install` inside the `backend/` folder
- **Frontend can't reach backend** — Check `frontend/.env` contains `REACT_APP_API_URL=http://localhost:4000/api`

---

## 🌐 Deploying to GitHub Pages (Frontend)

GitHub Pages hosts **static files only** — perfect for the React frontend.
The backend needs a separate host (see Backend Hosting below).

### Step 1: Push your code to GitHub

```bash
git init
git add .
git commit -m "🚌 Initial commit — Schuber full-stack app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/schuber.git
git push -u origin main
```

### Step 2: Deploy the backend first

See **Backend Hosting** section below. Once deployed, copy your backend URL, e.g.:
`https://schuber-api.onrender.com`

### Step 3: Set the frontend API URL

Edit `frontend/.env`:
```env
REACT_APP_API_URL=https://schuber-api.onrender.com/api
```

Update `frontend/package.json` with your GitHub Pages URL:
```json
{
  "homepage": "https://YOUR_USERNAME.github.io/schuber"
}
```

### Step 4: Deploy to GitHub Pages

```bash
cd frontend
npm run deploy
```

This builds the app and pushes it to a `gh-pages` branch automatically.

### Step 5: Enable GitHub Pages

1. Go to your repo on GitHub → **Settings** → **Pages**
2. Under **Source**, select branch: `gh-pages`, folder: `/ (root)`
3. Click **Save**
4. Wait ~2 minutes, then visit: `https://YOUR_USERNAME.github.io/schuber`

---

## 🖥️ Backend Hosting — Render (Free)

### Step 1: Sign up
Go to **[render.com](https://render.com)** → sign up with your GitHub account.

### Step 2: Create a Web Service
1. Click **New +** → **Web Service**
2. Connect your GitHub repo (`schuber`)
3. Configure:

| Field | Value |
|---|---|
| **Name** | `schuber-api` |
| **Region** | Singapore |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

### Step 3: Add environment variables

| Key | Value |
|---|---|
| `JWT_SECRET` | `schuber_prod_secret_change_this` |
| `PORT` | `4000` |
| `NODE_ENV` | `production` |

### Step 4: Deploy
Click **Create Web Service**. Takes ~2–3 minutes.

Test it: visit `https://schuber-api.onrender.com/api/health`
```json
{ "status": "ok", "service": "Schuber API" }
```

### ⚠️ Keep it awake (free tier spins down after 15 min inactivity)
Set up a free monitor at **[uptimerobot.com](https://uptimerobot.com)**:
- Monitor Type: `HTTP(s)`
- URL: `https://schuber-api.onrender.com/api/health`
- Interval: Every 5 minutes

---

## 🔄 Auto-deploy on Push (GitHub Actions)

The `.github/workflows/deploy.yml` file is already included. It auto-deploys the frontend to GitHub Pages every time you push to `main`.

Add your backend URL as a GitHub Secret:
1. Go to repo → **Settings** → **Secrets and variables** → **Actions**
2. Add: `REACT_APP_API_URL` = `https://schuber-api.onrender.com/api`

---

## 🗄️ Database

SQLite via `better-sqlite3`. The `schuber.db` file is auto-created and seeded on first backend start.

| Table | Description |
|---|---|
| `users` | All users (parents, drivers, admins) |
| `students` | Children linked to parent accounts |
| `drivers` | Driver profiles linked to user accounts |
| `trips` | Trip records with status tracking |
| `trip_students` | Student attendance per trip (check-in/out) |
| `notifications` | In-app alerts per user |

---

## 🔌 API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| GET | /api/auth/me | Get current user |

### Trips
| Method | Path | Description |
|---|---|---|
| GET | /api/trips | Get trips for user |
| GET | /api/trips/active | Get active trip |
| POST | /api/trips/start | Start trip (driver) |
| POST | /api/trips/:id/complete | End trip (driver) |
| POST | /api/trips/:id/checkin/:sid | Check-in student |
| POST | /api/trips/:id/checkout/:sid | Check-out student |

### Students & Drivers
| Method | Path | Description |
|---|---|---|
| GET | /api/students | Get students for user |
| POST | /api/students | Add student (parent) |
| GET | /api/drivers | Get all drivers (admin) |
| GET | /api/drivers/me | Get own driver profile |
| PATCH | /api/drivers/location | Update GPS location |
| PATCH | /api/drivers/status | Update online status |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Leaflet |
| Backend | Node.js 20, Express 4 |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Hosting | GitHub Pages (frontend) + Render (backend) |
| Maps | Leaflet + OpenStreetMap |
| Fonts | Syne (headings) + DM Sans (body) |
| Keep-alive | UptimeRobot (pings /api/health every 5 min) |

---

## 👥 Team

| Name | Role |
|---|---|
| Karen Elisha Chezhiyan | Founder / Product |
| Imapan L | Scrum Master |
| Krishank D Boswan | Developer |
| Koushik D | Developer |
| Harshitha R | Developer |



---

## 📝 License
