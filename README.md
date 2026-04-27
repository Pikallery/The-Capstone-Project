# The Capstone Project — Village API Platform

A production-grade SaaS platform providing a comprehensive REST API for India's complete village-level geographical data. Built for B2B clients who need reliable, standardized address data for dropdowns and form autocomplete.

---

## What It Does

- **619,000+ villages** across all 30 Indian states, normalized into a 5-level hierarchy:  
  `India → State → District → Sub-District → Village`
- **B2B API** with key-based auth, rate limiting, and tiered plans (Free → Unlimited)
- **Admin Panel** to manage users, monitor API usage, and browse the village master list
- **B2B Portal** for self-registration, API key generation, and usage analytics
- **Demo Client** — a contact form showing live autocomplete integration

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
| Hosting | Vercel |

---

## Project Structure

```
├── backend/          Express.js API + Prisma
│   ├── prisma/       Database schema
│   └── src/
│       ├── routes/
│       │   ├── v1/       Public API (search, autocomplete, states…)
│       │   ├── admin/    Admin panel API
│       │   ├── b2b/      B2B portal API
│       │   └── auth/     Login, register
│       ├── middleware/   JWT + API key auth, rate limiting
│       └── services/     Redis cache
├── frontend/         React + Vite + Tailwind
│   └── src/
│       ├── pages/
│       │   ├── admin/    Dashboard, Users, Villages, Logs
│       │   ├── b2b/      Dashboard, API Keys, Docs
│       │   └── auth/     Login, Register
│       └── components/   AdminLayout, B2BLayout, StatCard
├── data-import/      Python scripts to import MDDS Excel dataset
│   └── import_all.py
├── demo/             Standalone demo contact form
└── vercel.json       Vercel deployment config
```

---

## API Endpoints

All public endpoints require `X-API-Key` header.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/states` | List all states |
| GET | `/api/v1/states/:id/districts` | Districts by state |
| GET | `/api/v1/districts/:id/subdistricts` | Sub-districts by district |
| GET | `/api/v1/subdistricts/:id/villages` | Villages by sub-district |
| GET | `/api/v1/search?q=` | Full-text village search |
| GET | `/api/v1/autocomplete?q=` | Typeahead suggestions |

---

## Setup

See [SETUP.md](SETUP.md) for full local setup instructions.

**Quick start:**
```bash
# 1. Configure environment
cp backend/.env.example backend/.env
# Fill in DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

# 2. Push schema to database
cd backend && npm install && npx prisma db push

# 3. Import village data (~619k rows, takes 15–20 min)
cd data-import && pip install -r requirements.txt && python import_all.py

# 4. Start servers
cd backend && npm run dev      # API on :3000
cd frontend && npm run dev     # Dashboard on :5173
```

---

## Features

- **Dark mode** — toggle in top bar, persisted across sessions
- **Real-time notifications** — admin bell icon polls for new user registrations
- **Rate limiting** — per-plan daily quotas with Redis (Free: 5k/day → Unlimited: 1M/day)
- **State-level access control** — grant specific states per B2B client
- **API logs** — full request history with response times and status codes
