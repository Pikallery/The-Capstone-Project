# Capstone Project — Setup Guide

## Prerequisites
- Node.js 18+
- Python 3.9+
- A NeonDB account (free tier works: neon.tech)
- An Upstash Redis account (free tier works: upstash.com) — optional for local dev

---

## Step 1 — Database Setup (NeonDB)

1. Go to https://neon.tech → create a new project
2. Copy the **Connection String** (looks like `postgresql://user:pass@host/dbname?sslmode=require`)

---

## Step 2 — Backend Configuration

```bash
cd "Capstone Project/backend"
cp .env.example .env
# Edit .env and fill in:
#   DATABASE_URL = your NeonDB connection string
#   JWT_SECRET   = any long random string
#   ADMIN_EMAIL  = your admin login email
#   ADMIN_PASSWORD = your admin password
```

---

## Step 3 — Initialize the Database

```bash
cd "Capstone Project/backend"
npm install
npx prisma db push          # creates all tables
npx prisma generate         # generates Prisma client
```

---

## Step 4 — Import Village Data

```bash
cd "Capstone Project/data-import"
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set DATABASE_URL (same as backend)
# Optional: set DATASET_PATH if your XLS files are elsewhere

python import_all.py
# This imports all 30 state files (~600,000 villages)
# Takes 5–15 minutes depending on your connection
```

---

## Step 5 — Run Locally

```bash
# Terminal 1 — Backend (API on port 3000)
cd "Capstone Project/backend"
npm run dev

# Terminal 2 — Frontend (Dashboard on port 5173)
cd "Capstone Project/frontend"
npm install
npm run dev
```

Open:
- Admin dashboard: http://localhost:5173 → login with your ADMIN_EMAIL/ADMIN_PASSWORD
- API: http://localhost:3000/health

---

## Step 6 — Create Your First API Key

1. Login to the admin dashboard
2. Go to Admin → Users → approve your B2B test user (or register one)
3. Login as B2B user → Portal → API Keys → Create Key
4. Copy the key and secret

---

## Step 7 — Test the API

```bash
curl -H "X-API-Key: ak_your_key" "http://localhost:3000/api/v1/states"
curl -H "X-API-Key: ak_your_key" "http://localhost:3000/api/v1/search?q=Manibeli"
curl -H "X-API-Key: ak_your_key" "http://localhost:3000/api/v1/autocomplete?q=Mani"
```

---

## Step 8 — Demo Client

Open `demo/index.html` in a browser. Edit the `API_URL` and `API_KEY` variables at the bottom of the file to point to your running backend.

---

## Deployment (Vercel)

1. Push this folder to a GitHub repo
2. Import into Vercel
3. Set all environment variables from `backend/.env` in Vercel project settings
4. Deploy — Vercel handles the rest

---

## Project Structure

```
Capstone Project/
├── backend/              Express.js API + Prisma
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── index.js      Entry point
│   │   ├── middleware/   Auth, rate limiting
│   │   ├── routes/
│   │   │   ├── v1/       Public API (search, autocomplete, etc.)
│   │   │   ├── admin/    Admin panel API
│   │   │   ├── b2b/      B2B portal API
│   │   │   └── auth/     Login, register
│   │   └── services/     Cache (Redis), seeding
├── frontend/             React + Vite + Tailwind
│   └── src/pages/
│       ├── admin/        Dashboard, Users, Villages, Logs
│       ├── b2b/          Dashboard, API Keys, Docs
│       └── auth/         Login, Register
├── data-import/          Python import scripts
│   └── import_all.py     Processes all 30 state XLS files
├── demo/                 Standalone demo contact form
│   └── index.html
└── vercel.json           Vercel deployment config
```
