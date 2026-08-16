# SmartBill Nepal — Next.js frontend

## Setup

```bash
cd frontend
cp .env.example .env.local   # already points at http://127.0.0.1:8000
npm install
npm run dev
```

Open http://localhost:3000

## Backend

Run Django on port 8000:

```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

## Features in this app

- Register (creates store + 3-day trial)
- Login with JWT
- Trial banner + subscription plans (simulated eSewa/Khalti)
- Dashboard, products, customers, invoices
