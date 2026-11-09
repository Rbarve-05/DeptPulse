# DebtPulse

A premium, dark-mode receivables dashboard prototype for boutique creative agencies.

## Features
- Outstanding balance, overdue invoice count, and average delinquency stats
- Add-invoice modal with client, email, amount, and overdue-day fields
- Searchable and filterable chase queue
- Three personalized escalation email templates (Day 1, Day 5, Day 14)
- Copy-ready email previews and interactive sequence activation state
- Responsive layout with Tailwind CSS and Lucide icons

## Run locally
```bash
npm install
npm run dev
```

## Notes
This is a frontend-only demonstration. Invoice data is held in React state and resets on refresh. Activating a sequence changes the local demo state only; no emails are sent and no database or background scheduler is connected.
