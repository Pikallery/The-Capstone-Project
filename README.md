# The Capstone Project — Village API Platform

A production-grade SaaS platform providing a comprehensive REST API for India's complete village-level geographical data. Built for B2B clients who need reliable, standardized address data for dropdowns and form autocomplete.

---

## Live Demo

| | URL |
|---|---|
| **Platform** | https://the-capstone-project-gamma.vercel.app |
| **Admin Login** | https://the-capstone-project-gamma.vercel.app/login |
| **API Health** | https://the-capstone-project-gamma.vercel.app/health |

### Admin Credentials
| Field | Value |
|---|---|
| Email | `admin@villageapi.com` |
| Password | `Admin@1234` |

---

## Complete Walkthrough

### Step 1 — Admin logs in
Go to the live URL and sign in with the admin credentials above.  
You land on the **Admin Dashboard** showing:
- Total villages in the database (619,245)
- Active users, today's API requests, average response time
- Charts: API requests over 30 days, users by plan, top states by village count

---

### Step 2 — A business registers
A B2B client visits the platform and clicks **"Register here"** on the login page.

They fill in:
- Business email (no Gmail/Yahoo — must be a company email)
- Business name, password, phone, GST (optional)

After submitting, their account status is **PENDING_APPROVAL**. They cannot generate API keys yet.

---

### Step 3 — Admin approves the user
In the Admin Panel → **Users**, the new registration appears.

The admin can:
- **Approve** the user (green tick) — account becomes ACTIVE
- **Suspend** or **Reject** if needed
- Change their **plan** (Free / Premium / Pro / Unlimited) inline
- Click into the user to set **state-level access** (which Indian states they can query) and add internal notes

---

### Step 4 — B2B user generates an API key
Once approved, the B2B user logs in and goes to **API Keys** in their portal.

They:
1. Enter a key name (e.g. "Production Server")
2. Click **Create Key**
3. Copy the **API Key** and **API Secret** — the secret is shown only once

---

### Step 5 — B2B client integrates the API
Using the key from Step 4, they start making API calls:

```bash
# List all states
curl "https://the-capstone-project-gamma.vercel.app/api/v1/states" \
  -H "X-API-Key: ak_your_key_here"

# Search for a village
curl "https://the-capstone-project-gamma.vercel.app/api/v1/search?q=Manibeli" \
  -H "X-API-Key: ak_your_key_here"

# Autocomplete (typeahead)
curl "https://the-capstone-project-gamma.vercel.app/api/v1/autocomplete?q=Mani" \
  -H "X-API-Key: ak_your_key_here"

# Get districts for a state (use state ID from /states response)
curl "https://the-capstone-project-gamma.vercel.app/api/v1/states/50/districts" \
  -H "X-API-Key: ak_your_key_here"

# Get sub-districts for a district
curl "https://the-capstone-project-gamma.vercel.app/api/v1/districts/477/subdistricts" \
  -H "X-API-Key: ak_your_key_here"
```

The API returns standardized address data ready for dropdowns:
```json
{
  "value": "village_id_456798",
  "label": "Manibeli",
  "fullAddress": "Manibeli, Akkalkuwa, Nandurbar, Maharashtra, India",
  "hierarchy": {
    "village": "Manibeli",
    "subDistrict": "Akkalkuwa",
    "district": "Nandurbar",
    "state": "Maharashtra",
    "country": "India"
  }
}
```

---

### Step 6 — B2B user monitors usage
In their portal **Dashboard**, the B2B user sees:
- Today's request count vs their daily limit
- Remaining quota for the day
- Request history chart (last 7 days)
- Average response time

Rate limits by plan:

| Plan | Daily Requests | Price |
|---|---|---|
| Free | 5,000 | $0 |
| Premium | 50,000 | $49/mo |
| Pro | 300,000 | $199/mo |
| Unlimited | 1,000,000 | $499/mo |

---

### Step 7 — Admin monitors everything
Back in the Admin Panel:
- **API Logs** — every request logged with endpoint, response time, status code, IP
- **Dashboard charts** — real-time request trends, response time p50/p95/p99
- **Notification bell** — pings every 8 seconds, shows new registrations instantly

---

## API Reference

All public endpoints require `X-API-Key` header.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/states` | All 30 states |
| GET | `/api/v1/states/:id/districts` | Districts for a state |
| GET | `/api/v1/districts/:id/subdistricts` | Sub-districts for a district |
| GET | `/api/v1/subdistricts/:id/villages` | Villages for a sub-district |
| GET | `/api/v1/search?q=` | Full-text village search |
| GET | `/api/v1/autocomplete?q=` | Typeahead suggestions (min 2 chars) |

---

## What's Inside

- **619,245 villages** across all 30 Indian states
- **5-level hierarchy**: Country → State → District → Sub-District → Village
- **Normalized** from the MDDS (Ministry of Drinking Water and Sanitation) dataset

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express.js |
| Database | NeonDB (PostgreSQL) + Prisma ORM |
| Caching | Upstash Redis (optional) |
| Frontend | React 18 + Vite + Tailwind CSS |
| Charts | Recharts |
| State | Zustand + React Query |
| Auth | JWT + bcrypt |
| Hosting | Vercel (serverless) |

---

## Project Structure

```
├── api/              Vercel serverless entry point
├── backend/          Express.js API + Prisma
│   ├── prisma/       Database schema (9 models)
│   └── src/
│       ├── routes/
│       │   ├── v1/       Public API endpoints
│       │   ├── admin/    Admin panel API
│       │   ├── b2b/      B2B portal API
│       │   └── auth/     Login, register
│       ├── middleware/   JWT + API key auth, rate limiting
│       └── services/     Redis cache
├── frontend/         React + Vite + Tailwind dashboard
│   └── src/
│       ├── pages/
│       │   ├── admin/    Dashboard, Users, Villages, Logs
│       │   ├── b2b/      Dashboard, API Keys, Docs
│       │   └── auth/     Login, Register
│       └── components/
├── data-import/      Python scripts — imports MDDS Excel dataset
├── scripts/          Vercel build scripts
├── demo/             Standalone demo contact form
└── vercel.json       Vercel deployment config
```

---

## Local Setup

See [SETUP.md](SETUP.md) for full local setup instructions.

```bash
# 1. Configure environment
cp backend/.env.example backend/.env
# Fill in: DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

# 2. Push schema to database
cd backend && npm install && npx prisma db push

# 3. Import village data (~619k rows, 15–20 min)
cd data-import && pip install -r requirements.txt && python import_all.py

# 4. Start servers
cd backend && npm run dev      # API → http://localhost:3000
cd frontend && npm run dev     # Dashboard → http://localhost:5173
```
