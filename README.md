# DebtPulse

A premium receivables dashboard for boutique creative agencies, built with React, Vite, Express, and MongoDB.

## Features
- MongoDB-backed invoice persistence
- REST API to list and create invoices and activate a chase sequence
- Starter demo invoices inserted only when the database is empty
- Searchable and filterable chase queue with live dashboard totals
- Three personalized escalation email templates (Day 1, Day 5, Day 14)
- Opt-in scheduled email reminders through Resend
- Responsive dark UI with Tailwind CSS and Lucide icons

## Setup
1. Install dependencies: `npm install`
2. Create a free MongoDB Atlas cluster and database user. In Atlas Network Access, allow your current IP address.
3. Copy `.env.example` to `.env` in the project root and replace the placeholder `MONGODB_URI` with your Atlas connection string. Never commit your real `.env` file.
4. Start backend and frontend together: `npm run dev:full`

Frontend: http://localhost:5173  
API health: http://localhost:5000/api/health

## Email reminders (optional)
1. Create a Resend account and generate an API key.
2. Verify a sending domain in Resend. For real customer emails, use an address on that verified domain as `EMAIL_FROM`. Resend's onboarding sender is only suitable for limited testing.
3. Add these values to your private local `.env` file:
   - `RESEND_API_KEY=re_...`
   - `EMAIL_FROM=DebtPulse <billing@your-verified-domain.com>`
   - `EMAIL_AUTOMATION_ENABLED=false`
4. Restart the backend. Confirm the Resend sender/domain is verified and test with an address you control before enabling customer reminders.
5. Only after testing, set `EMAIL_AUTOMATION_ENABLED=true` and restart the backend.

The scheduler checks every 15 minutes. A reminder is eligible only when the invoice's sequence has been explicitly activated and the global email switch is enabled. It sends the highest currently due stage (Day 1, Day 5, or Day 14), then records the successful send in MongoDB. Failed sends are logged and can be retried on the next scheduler run. Existing demo records are not opted into email automation.

## API
- `GET /api/invoices` — list invoices
- `POST /api/invoices` — create an invoice
- `PATCH /api/invoices/:id/activate` — activate a sequence for that invoice
- `GET /api/health` — API, database, and email configuration status

## Current limitations
Email reminders are opt-in and require a Resend API key plus a verified sender domain. This first version runs its scheduler inside the API process, so the API must remain running for scheduled checks. Authentication, multi-workspace access, payment reconciliation, and production-grade distributed job locking are not implemented yet.
