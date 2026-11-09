# DebtPulse

A premium receivables dashboard for boutique creative agencies, built with React, Vite, Express, and MongoDB.

## Features
- MongoDB-backed invoice persistence
- REST API to list and create invoices and activate a chase sequence
- Starter demo invoices inserted only when the database is empty
- Searchable and filterable chase queue with live dashboard totals
- Three personalized escalation email templates (Day 1, Day 5, Day 14)
- Responsive dark UI with Tailwind CSS and Lucide icons

## Setup
1. Install dependencies: `npm install`
2. Create a free MongoDB Atlas cluster and database user. In Atlas Network Access, allow your current IP address.
3. Copy `.env.example` to `.env` in the project root and replace the placeholder `MONGODB_URI` with your Atlas connection string. Never commit your real `.env` file.
4. Start backend and frontend together: `npm run dev:full`

Frontend: http://localhost:5173  
API health: http://localhost:5000/api/health

You can also run `npm run server` and `npm run dev` in separate terminals.

## API
- `GET /api/invoices` — list invoices
- `POST /api/invoices` — create an invoice
- `PATCH /api/invoices/:id/activate` — persist sequence activation status
- `GET /api/health` — API and database status

## Current limitations
Invoice records and sequence activation are persisted. Email delivery, scheduled jobs, authentication, and multi-workspace access are not implemented yet. Starter records are demo data and are inserted only when the collection is empty.
