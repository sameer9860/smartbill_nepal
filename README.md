# SmartBill Nepal 🇳🇵

> AI-Powered Billing, Inventory, and Business Management System
> Built for small and medium businesses in Nepal

---

## 🚀 Features

- 📦 Product & Inventory Management with Low Stock Alerts
- 👥 Customer Management
- 🧾 Invoice & Billing with Nepal VAT (13%) Calculation
- 📊 Sales Dashboard with Monthly Revenue Charts
- 🤖 AI-Powered Stock Risk Prediction (Days Until Stockout)
- 📈 Sales Forecasting using Linear Regression (Scikit-learn)
- 💡 Smart Restock Recommendations by Revenue
- 🖨️ Printable Invoice Template
- 📂 Stock Movement Log

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, Django |
| Database | PostgreSQL |
| Frontend | Bootstrap 5, Chart.js |
| AI/ML | Scikit-learn, Pandas, NumPy |
| Version Control | Git & GitHub |

---

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/smartbill-nepal.git
cd smartbill-nepal
```

### 2. Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Create PostgreSQL Database
```sql
CREATE DATABASE smartbill_db;
```

### 5. Configure Environment
```bash
# Edit smartbill/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'smartbill_db',
        'USER': 'your_postgres_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### 6. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 7. Create Superuser
```bash
python manage.py createsuperuser
```

### 8. Load Sample Data (Optional)
```bash
python manage.py shell < sample_data.py
```

### 9. Run Server
```bash
python manage.py runserver
```

Visit: `http://127.0.0.1:8000`

---

## 📁 Project Structure
smartbill_nepal/
├── smartbill/          # Project settings
├── core/               # Main application
│   ├── models.py       # Database models
│   ├── views.py        # View logic
│   ├── urls.py         # URL routing
│   ├── forms.py        # Django forms
│   ├── ai.py           # AI/ML features
│   ├── utils.py        # Utility functions
│   ├── admin.py        # Admin configuration
│   └── templates/      # HTML templates
├── static/             # CSS, JS assets
├── requirements.txt
└── README.md

---

## 🤖 AI Features

### Stock Risk Prediction
Calculates average daily sales per product and predicts
days until stockout. Classifies risk as:
- 🔴 CRITICAL — 7 days or less
- 🟠 HIGH — 14 days or less
- 🟡 MEDIUM — 30 days or less
- 🟢 LOW — More than 30 days

### Sales Forecasting
Uses Linear Regression (Scikit-learn) trained on
90 days of historical revenue data to forecast
the next 30 days of expected sales.

### Restock Recommendations
Ranks products by revenue generated in last 30 days
and recommends optimal restock quantities based on
sales velocity and current stock levels.

---

## 🇳🇵 Built for Nepal

- Nepal VAT (13%) built in
- Invoice numbering format: INV-YYYYMMDD-000001
- Nepali Rupee (Rs) currency throughout
- Designed for local small business workflows

---

## 👨‍💻 Developer

**Samir Khatiwada**
30 Days of Learning Challenge — Dlytica Academy

---

## 📄 License

MIT License — free to use, modify, and sell.