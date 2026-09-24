# SmartBill Nepal

AI-powered billing, inventory, and business management system for Nepali small and medium businesses.

[![Live Demo](https://img.shields.io/badge/Live-smartbill--nepal.vercel.app-blue)](https://smartbill-nepal.vercel.app/)
[![Backend API](https://img.shields.io/badge/API-smartbillnepal--production.up.railway.app%2Fapi-orange)](https://smartbillnepal-production.up.railway.app/api)
[![Django](https://img.shields.io/badge/Django-6.0.6-green)](https://www.djangoproject.com/)
[![Python](https://img.shields.io/badge/Python-3.12+-blue)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Required-blue)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Live Demo

- Frontend app: [https://smartbill-nepal.vercel.app/](https://smartbill-nepal.vercel.app/)
- Backend API: [https://smartbillnepal-production.up.railway.app/api](https://smartbillnepal-production.up.railway.app/api)
- GitHub: [https://github.com/sameer9860/smartbill_nepal](https://github.com/sameer9860/smartbill_nepal)
---

## Overview

SmartBill Nepal is a full-stack business platform built to simplify billing, inventory tracking, customer records, and sales analytics for Nepali businesses.

It includes:

- Product and stock management
- Customer and invoice management
- 13% Nepal VAT handling
- Printable invoices
- Low-stock alerts
- Sales reports and AI-driven insights
- Tenant-based multi-user data isolation

The project combines a modern Next.js frontend with a Django REST API and PostgreSQL database.

---

## Features

### Core business features

- Product catalog with pricing and stock levels
- Category-based inventory organization
- Customer management and purchase history
- Invoice creation with line items and discounts
- Nepal VAT calculation at 13%
- Paid, unpaid, and partial payment tracking
- Automatic invoice numbering
- Printable invoice view
- Stock movement logging
- Low-stock monitoring and alerts
- Business reporting dashboard

### AI & analytics features

- Stock risk prediction
- Sales forecasting
- ABC product analysis
- Trend detection
- Business health score
- Smart reorder recommendations
- Weekly order prioritization
- Category-wise revenue summaries

### Account features

- Login and logout
- Profile editing
- Password change
- Account deletion
- Admin management panel

### Nepal-specific support

- Nepali Rupee pricing
- Kathmandu timezone support
- VAT rules for Nepal
- Invoice format aligned for local SMB workflows

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, Tailwind CSS |
| Backend | Django, Django REST Framework |
| Database | PostgreSQL |
| AI / Analytics | scikit-learn, pandas, NumPy |
| Auth | Django auth + JWT support |
| Deployment | Vercel + Railway |
| Static assets | WhiteNoise |
| Version control | Git & GitHub |

---

## Architecture

The project uses a split deployment model:

- Frontend: Next.js app hosted on Vercel
- Backend API: Django app hosted on Railway
- Database: PostgreSQL instance
- Shared tenant logic: each user/business has isolated store data

Typical flow:

1. User logs into the frontend app
2. Frontend calls the Django API endpoints
3. API reads tenant-scoped data from PostgreSQL
4. AI analytics process invoice and product data
5. Dashboard displays metrics, alerts, and reports

---

## Project structure

```text
smartbill_nepal/
├── README.md
├── LICENSE
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── Procfile
│   ├── .env.example
│   ├── smartbill/
│   ├── accounts/
│   ├── core/
│   └── static/
├── frontend/
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── public/
│   └── src/
└── .gitignore
```

---

## Prerequisites

Before running locally, make sure you have:

- Python 3.12+
- PostgreSQL 14+
- Node.js 18+
- npm or yarn
- Git

---

## Local development setup

### 1. Clone the repository

```bash
git clone https://github.com/sameer9860/smartbill_nepal.git
cd smartbill_nepal
```

### 2. Set up the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Update the environment variables in `backend/.env`:

```env
SECRET_KEY=your-local-secret-key
DEBUG=True
DATABASE_URL=postgresql://smartbill_user:your_password@localhost:5432/smartbill_db
```

Create the database and migrate:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The API will run at:

- http://127.0.0.1:8000
- API base: http://127.0.0.1:8000/api

### 3. Set up the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at:

- http://localhost:3000

---

## Environment variables

### Backend

| Variable | Required | Example |
|---|---|---|
| `SECRET_KEY` | Yes | random-secret-string |
| `DEBUG` | Yes | `True` |
| `DATABASE_URL` | Yes | `postgresql://user:pass@host:5432/dbname` |

### Production notes

- For Railway deployment, set `DEBUG=False`
- Use the PostgreSQL service URL from Railway
- Keep `.env` files out of version control

---

## API access

The backend exposes its API at:

- [https://smartbillnepal-production.up.railway.app/api](https://smartbillnepal-production.up.railway.app/api)

Use this endpoint when integrating with the frontend or testing backend functionality directly.

---

## Multi-tenancy model

SmartBill uses a tenant-based architecture so each business has isolated data:

- Each user gets a dedicated tenant/store
- Data is scoped to the active tenant automatically
- Products, customers, invoices, and stock records remain separated by business

This allows multiple businesses to use the same deployment without sharing records.

---

## Deployment

### Frontend (Vercel)

- Project domain: [https://smartbill-nepal.vercel.app/](https://smartbill-nepal.vercel.app/)
- Use Vercel for the Next.js frontend deployment

### Backend (Railway)

- API host: [https://smartbillnepal-production.up.railway.app/api](https://smartbillnepal-production.up.railway.app/api)
- Use Railway for Django and PostgreSQL hosting

---

## Developed By

Samir Khatiwada: [https://samirkhatiwada.com.np/](https://samirkhatiwada.com.np/)

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
