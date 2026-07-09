# SmartBill Nepal

> AI-powered billing, inventory, and business management system built for small and medium businesses in Nepal.

[![Live Demo](https://img.shields.io/badge/Live-smartbillnepal--production.up.railway.app-blue)](https://smartbillnepal-production.up.railway.app)
[![Django](https://img.shields.io/badge/Django-6.0.6-green)](https://www.djangoproject.com/)
[![Python](https://img.shields.io/badge/Python-3.12+-blue)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Required-blue)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Live Demo & Credentials

| | |
|---|---|
| **Live App** | [https://smartbillnepal-production.up.railway.app](https://smartbillnepal-production.up.railway.app) |
| **Login Page** | [https://smartbillnepal-production.up.railway.app/accounts/login/](https://smartbillnepal-production.up.railway.app/accounts/login/) |
| **GitHub Repository** | [https://github.com/sameer9860/smartbill_nepal](https://github.com/sameer9860/smartbill_nepal) |
| **Demo Username** | `demo` |
| **Demo Password** | `Demo@1234` |

**Project submission summary**

SmartBill Nepal is an AI-powered billing, inventory, and business management web app built for small and medium businesses in Nepal. It includes product & inventory management, customer management, invoice billing with 13% Nepal VAT, printable invoices, low-stock alerts, sales reports, and AI features such as stock risk prediction, sales forecasting, ABC analysis, and smart restock recommendations.

- **Live Demo:** [smartbillnepal-production.up.railway.app](https://smartbillnepal-production.up.railway.app)
- **Source Code:** [github.com/sameer9860/smartbill_nepal](https://github.com/sameer9860/smartbill_nepal)
- **Login:** `demo` / `Demo@1234`
- **Stack:** Python, Django 6.0.6, PostgreSQL, Bootstrap 5, Chart.js, scikit-learn
- **Deployed on:** [Railway](https://railway.app)
- **Developer:** Samir Khatiwada — Dlytica Academy (30 Days of Learning Challenge)

---

## Table of Contents

- [Live Demo & Credentials](#live-demo--credentials)
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Application Routes](#application-routes)
- [AI & Analytics Features](#ai--analytics-features)
- [Multi-Tenancy](#multi-tenancy)
- [Deployment (Railway)](#deployment-railway)
- [Troubleshooting](#troubleshooting)
- [Developer](#developer)
- [License](#license)

---

## Overview

**SmartBill Nepal** is a full-stack Django web application that helps Nepali businesses manage products, customers, invoices, and inventory from a single dashboard. It includes built-in Nepal VAT (13%) calculation, printable invoices, stock movement tracking, and AI-driven insights for stock risk, sales forecasting, and restock planning.

Each registered user gets their own isolated store (tenant), so data from one business never mixes with another.

**Repository:** [github.com/sameer9860/smartbill_nepal](https://github.com/sameer9860/smartbill_nepal)  
**Live demo:** [smartbillnepal-production.up.railway.app](https://smartbillnepal-production.up.railway.app)

---

## Features

### Core Business

- **Product & inventory management** — categories, pricing, stock levels, low-stock thresholds
- **Customer management** — contact details, address, purchase history via invoices
- **Invoice & billing** — line items, discounts, Nepal VAT (13%), paid/unpaid/partial status
- **Auto invoice numbering** — format `INV-YYYYMMDD-000001`, unique per store
- **Stock movement log** — track stock in / stock out with reasons
- **Low stock alerts** — dashboard badge and dedicated alerts page
- **Printable invoices** — print-ready invoice template
- **Sales reports** — revenue and business reporting views

### AI & Analytics

- **Stock risk prediction** — days until stockout based on sales velocity
- **Sales forecasting** — 30-day revenue forecast using Linear Regression (scikit-learn)
- **ABC analysis** — Pareto-based product classification (A/B/C by revenue)
- **Trend detection** — rising and declining product trends
- **Business health score** — composite score from sales, stock, and customer metrics
- **Smart reorder plan** — restock recommendations by revenue and lead time
- **Weekly order list** — prioritized products to reorder this week
- **Category sales summary** — revenue breakdown by product category

### User & Account

- Login / logout with session authentication
- User profile management
- Password change
- Account deletion
- Django admin panel at `/admin/`

### Nepal-Specific

- 13% VAT built into invoice calculations
- Nepali Rupee (Rs) throughout the UI
- Timezone: `Asia/Kathmandu`
- Invoice format designed for local SMB workflows

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.12+, Django 6.0.6 |
| Database | PostgreSQL |
| ORM / Config | Django ORM, django-environ |
| Frontend | Django Templates, Bootstrap 5, Chart.js |
| AI / ML | scikit-learn, pandas, NumPy |
| Production server | Gunicorn |
| Static files | WhiteNoise |
| Deployment | Railway (Nixpacks) |
| Version control | Git & GitHub |

---

## Architecture

```
┌─────────────┐     HTTPS      ┌──────────────────┐     SQL      ┌────────────┐
│   Browser   │ ─────────────► │  Django + Gunicorn│ ───────────► │ PostgreSQL │
│ Bootstrap 5 │                │  WhiteNoise       │              │            │
└─────────────┘                │  TenantMiddleware │              └────────────┘
                               └──────────────────┘
                                        │
                               ┌────────┴────────┐
                               │  core.ai (ML)  │
                               │  scikit-learn   │
                               └─────────────────┘
```

**Request flow:**

1. User authenticates via the `accounts` app.
2. `TenantMiddleware` attaches the user's store (tenant) to each request.
3. All business data (products, customers, invoices) is filtered by tenant automatically.
4. AI features in `core/ai.py` read tenant-scoped sales data and return insights to the dashboard.

---

## Project Structure

```
smartbill_nepal/
├── README.md
├── .gitignore
└── backend/
    ├── manage.py                 # Django management entry point
    ├── Procfile                  # Railway start command
    ├── requirements.txt          # Python dependencies
    ├── .env.example              # Environment variable template
    ├── smartbill/                # Project configuration
    │   ├── settings.py           # Django settings
    │   ├── urls.py               # Root URL routing
    │   ├── wsgi.py               # WSGI entry (Gunicorn)
    │   └── asgi.py
    ├── accounts/                 # Authentication & user profile
    │   ├── views.py
    │   ├── forms.py
    │   ├── urls.py
    │   └── templates/accounts/
    ├── core/                     # Main business logic
    │   ├── models.py             # Tenant, Product, Invoice, etc.
    │   ├── views.py              # Dashboard, CRUD, reports
    │   ├── urls.py
    │   ├── forms.py
    │   ├── ai.py                 # ML / analytics functions
    │   ├── utils.py              # Invoice numbers, tenant context
    │   ├── middleware.py         # TenantMiddleware
    │   ├── context_processors.py # Low stock count in navbar
    │   ├── migrations/
    │   └── templates/core/
    └── static/                   # CSS, JS, images (favicon)
```

---

## Prerequisites

Before setting up locally, install:

| Tool | Version |
|------|---------|
| Python | 3.12 or newer |
| PostgreSQL | 14+ recommended |
| pip | Latest |
| Git | Any recent version |

Optional for deployment:

| Tool | Purpose |
|------|---------|
| Railway account | [railway.app](https://railway.app) |
| Railway CLI | `npm i -g @railway/cli` |

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/sameer9860/smartbill_nepal.git
cd smartbill_nepal/backend
```

### 2. Create and activate a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate        # Linux / macOS
 venv\Scripts\activate         # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

> After any change to `requirements.txt`, re-run this command inside your activated venv.

### 4. Create a PostgreSQL database

```sql
CREATE DATABASE smartbill_db;
CREATE USER smartbill_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE smartbill_db TO smartbill_user;
```

### 5. Configure environment variables

Copy the example file and edit it:

```bash
cp .env.example .env
```

Set values in `backend/.env`:

```env
SECRET_KEY=your-local-secret-key
DEBUG=True
DATABASE_URL=postgresql://smartbill_user:your_password@localhost:5432/smartbill_db
```

Generate a secret key:

```bash
python manage.py shell -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 6. Run database migrations

```bash
python manage.py migrate
```

### 7. Create a superuser

```bash
python manage.py createsuperuser
```

### 8. Start the development server

```bash
python manage.py runserver
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

---

## Environment Variables

| Variable | Required | Local example | Production (Railway) |
|----------|----------|---------------|----------------------|
| `SECRET_KEY` | Yes | Random string | Strong unique secret |
| `DEBUG` | Yes | `True` | `False` |
| `DATABASE_URL` | Yes | `postgresql://user:pass@localhost:5432/smartbill_db` | `${{Postgres.DATABASE_URL}}` |
| `RAILWAY_PUBLIC_DOMAIN` | Auto | — | Set automatically by Railway |
| `PORT` | Auto | — | Set automatically by Railway |

Never commit `.env` to version control.

---

## Application Routes

### Authentication (`/accounts/`)

| URL | Name | Description |
|-----|------|-------------|
| `/accounts/login/` | `login` | User login |
| `/accounts/logout/` | `logout` | User logout |
| `/accounts/profile/` | `profile` | View / edit profile |
| `/accounts/change-password/` | `change_password` | Change password |
| `/accounts/delete-account/` | `delete_account` | Delete account |

### Core app (`/`)

| URL | Name | Description |
|-----|------|-------------|
| `/` | `dashboard` | Main sales dashboard |
| `/categories/` | `category_list` | List categories |
| `/categories/add/` | `category_add` | Add category |
| `/products/` | `product_list` | List products |
| `/products/add/` | `product_add` | Add product |
| `/customers/` | `customer_list` | List customers |
| `/customers/add/` | `customer_add` | Add customer |
| `/invoices/` | `invoice_list` | List invoices |
| `/invoices/create/` | `invoice_create` | Create invoice |
| `/invoices/<id>/` | `invoice_detail` | Invoice detail |
| `/invoices/<id>/print/` | `invoice_print` | Printable invoice |
| `/reports/` | `reports` | Business reports |
| `/low-stock/` | `low_stock_alerts` | Low stock alerts |
| `/ai/` | `ai_dashboard` | AI insights dashboard |
| `/admin/` | — | Django admin |

---

## AI & Analytics Features

All AI logic lives in `backend/core/ai.py`.

### Stock risk prediction

Calculates average daily sales per product over the last 30 days and estimates days until stockout.

| Risk level | Days until stockout |
|------------|---------------------|
| CRITICAL | 7 days or less |
| HIGH | 14 days or less |
| MEDIUM | 30 days or less |
| LOW | More than 30 days |

### Sales forecasting

Uses **Linear Regression** (scikit-learn) on 90 days of paid invoice revenue to forecast the next 30 days. Returns historical chart data, forecast totals, and trend direction (UP / DOWN).

### ABC analysis

Classifies products using the Pareto (80/20) principle based on 30-day revenue:

- **A** — top products contributing ~80% of revenue
- **B** — next ~15%
- **C** — remaining ~5%

### Additional analytics

| Function | Purpose |
|----------|---------|
| `detect_trends()` | Identifies rising and declining products |
| `business_health_score()` | Composite business health metric |
| `smart_reorder_plan()` | Restock quantities based on sales velocity and lead time |
| `weekly_order_list()` | Prioritized weekly reorder list |
| `get_category_sales_summary()` | Revenue by category |

> AI features work best after you have paid invoices and sales history. New stores with no data will show empty or default results.

---

## Multi-Tenancy

SmartBill uses a **single-database, shared-schema** multi-tenant model:

- Each user gets a `Tenant` (store) created automatically on registration.
- `UserProfile` links a Django `User` to their `Tenant`.
- `TenantModel` base class and `TenantManager` automatically scope queries to the current tenant.
- `TenantMiddleware` sets the active tenant on every authenticated request.

**Tenant-scoped models:** `Category`, `Product`, `Customer`, `Invoice`, `StockMovement`

This means two businesses can use the same deployed app without seeing each other's data.

---

## Deployment (Railway)

The project is configured for [Railway](https://railway.app) with:

- `backend/Procfile` — migrate, collectstatic, and start Gunicorn
- `whitenoise` — serve static files in production
- `ALLOWED_HOSTS` — includes `.railway.app`
- `CSRF_TRUSTED_ORIGINS` — auto-configured via `RAILWAY_PUBLIC_DOMAIN`

### Step 1 — Push code to GitHub

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

### Step 2 — Create Railway project

1. Go to [railway.app](https://railway.app) and log in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `sameer9860/smartbill_nepal`.

### Step 3 — Configure the web service

Open the Django service → **Settings**:

| Setting | Value |
|---------|-------|
| **Root Directory** | `backend` |
| **Start Command** | Leave empty (uses `Procfile`) |

### Step 4 — Add PostgreSQL

1. On the project canvas, click **+ Create** → **Database** → **PostgreSQL**.
2. Wait for the database to come online.

### Step 5 — Set environment variables

On the **web service** → **Variables** → **RAW Editor**:

```env
SECRET_KEY=your-production-secret-key
DEBUG=False
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

> If your Postgres service has a different name, adjust the reference (e.g. `${{PostgreSQL.DATABASE_URL}}`).

### Step 6 — Generate a public domain

Service → **Settings** → **Networking** → **Generate Domain**

Example: `smartbillnepal-production.up.railway.app`

### Step 7 — Create admin user

Link your local folder to Railway and run createsuperuser with production database credentials:

```bash
cd backend
npm i -g @railway/cli    # if not installed
railway login
railway link --project "your-project-name"
# Select: production → smartbill_nepal (web service, NOT Postgres)

source venv/bin/activate
railway run python manage.py createsuperuser
```

> `railway run` executes locally with Railway env vars injected. Activate your venv first so `python` is available.

**Alternative:** use the Railway dashboard **Shell** on the web service:

```bash
python manage.py createsuperuser
```

### What happens on each deploy

The `Procfile` runs automatically:

```procfile
web: python manage.py migrate && python manage.py collectstatic --noinput && gunicorn smartbill.wsgi --bind 0.0.0.0:$PORT
```

1. Applies database migrations
2. Collects static files into `staticfiles/`
3. Starts Gunicorn on Railway's `$PORT`

### Production checklist

- [ ] `DEBUG=False`
- [ ] Strong `SECRET_KEY` set
- [ ] Root directory = `backend`
- [ ] PostgreSQL service running
- [ ] `DATABASE_URL` references Postgres service
- [ ] Public domain generated
- [ ] `createsuperuser` completed
- [ ] Login and dashboard tested

### Known production limitations

| Topic | Note |
|-------|------|
| **Media uploads** | Files in `MEDIA_ROOT` are stored on ephemeral disk and are lost on redeploy. Use S3 or similar for persistent uploads. |
| **Build time** | ML packages (scikit-learn, pandas, numpy) make the first build take 5–15 minutes. |
| **Costs** | Railway uses usage-based billing. Monitor usage in your account dashboard. |

---

## Troubleshooting

### `ModuleNotFoundError: No module named 'whitenoise'`

Your venv is missing packages after a `requirements.txt` update:

```bash
source venv/bin/activate
pip install -r requirements.txt
```

### `python: command not found` with `railway run`

Activate your virtual environment or use `python3`:

```bash
source venv/bin/activate
railway run python manage.py createsuperuser
```

### `No such file or directory` from `railway run`

Same as above — `railway run` runs commands **on your machine**, not on Railway's servers.

### Railway can't find `manage.py`

Set **Root Directory** to `backend` in the Railway service settings.

### CSRF error on login after deploy

Ensure a public domain is generated so Railway sets `RAILWAY_PUBLIC_DOMAIN`. Redeploy after generating the domain.

### Database connection errors

Verify `DATABASE_URL=${{Postgres.DATABASE_URL}}` matches your Postgres service name exactly.

### Empty AI dashboard

AI features need historical paid invoice data. Create products, invoices, and mark them as paid to populate forecasts and risk scores.

---

## Developer

**Samir Khatiwada**  
30 Days of Learning Challenge — Dlytica Academy

---

## License

MIT License — free to use, modify, and distribute.
