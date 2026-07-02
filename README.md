# SmartBill Nepal

![Django](https://img.shields.io/badge/Django-3.2-success)
![Python](https://img.shields.io/badge/Python-3.9+-blue)
![License](https://img.shields.io/badge/license-MIT-yellow)

**SmartBill Nepal** is an intelligent billing and inventory management system built with Django, designed specifically for small and medium-sized businesses in Nepal. It simplifies billing, tracks inventory in real-time, manages customers, and provides insightful analytics to help businesses grow.

## ✨ Features

- 🧾 **Smart Invoicing**: Generate professional, customizable invoices in seconds
- 📦 **Real-Time Inventory**: Track stock levels with low-stock alerts and automated updates
- 👥 **Customer Management**: Maintain a complete customer database with purchase history
- 📈 **Analytics Dashboard**: Visualize sales trends, top products, and business insights
- 🌓 **Dark Mode**: Beautiful dark theme for comfortable late-night billing
- 🤖 **AI Assistant**: AI-powered product recommendations and smart analytics (future)
- 🔐 **Secure Authentication**: Built-in authentication with secure password management
- 📊 **Multi-Currency Support**: Handle transactions in NPR and other currencies

## 🛠️ Tech Stack

- **Framework**: [Django 4.2](https://www.djangoproject.com/)
- **Language**: [Python 3.9+](https://python.org/)
- **Database**: PostgreSQL (via `django-environ`)
- **Frontend**: HTML, CSS, JavaScript (Django Templates)
- **Authentication**: Django's built-in authentication system

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- PostgreSQL 10+
- pip (Python package installer)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smartbill_nepal.git
   cd smartbill_nepal
   ```

2. **Create a virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   Copy the example environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Edit `.env` with your database credentials:
   ```env
   SECRET_KEY=your_secret_key
   DEBUG=True
   DATABASE_URL=postgresql://username:password@host:port/dbname
   ```

5. **Apply database migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create a superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run the development server**
   ```bash
   python manage.py runserver
   ```
   Open [http://localhost:8000/](http://localhost:8000/) in your browser.

## 📂 Project Structure

```
smartbill_nepal/
├── backend/
│   ├── core/
│   │   ├── models.py
│   │   ├── admin.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── smartbill/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── .env
├── templates/
├── static/
└── manage.py
```

## 🔌 API Endpoints

### Customers
- `GET /api/customers/` - List all customers
- `POST /api/customers/` - Create a new customer
- `GET /api/customers/{id}/` - Retrieve a customer
- `PUT /api/customers/{id}/` - Update a customer
- `DELETE /api/customers/{id}/` - Delete a customer

### Products
- `GET /api/products/` - List all products
- `POST /api/products/` - Create a new product
- `GET /api/products/{id}/` - Retrieve a product
- `PUT /api/products/{id}/` - Update a product
- `DELETE /api/products/{id}/` - Delete a product

### Invoices
- `GET /api/invoices/` - List all invoices
- `POST /api/invoices/` - Create a new invoice
- `GET /api/invoices/{id}/` - Retrieve an invoice
- `PUT /api/invoices/{id}/` - Update an invoice
- `DELETE /api/invoices/{id}/` - Delete an invoice

## 🎨 Dark Mode

SmartBill Nepal comes with a beautiful dark mode enabled by default. You can switch between light and dark mode using the toggle in the navigation bar.

## 🤖 AI Features

In the future, SmartBill Nepal will include:
- **AI Product Recommendations**: Suggest products based on customer purchase history
- **Smart Analytics**: AI-powered insights and trend analysis
- **Automated Inventory Management**: Predictive inventory ordering

## 🤝 Contributing

Contributions are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Dlytica**
- [Website](https://dlytica.com)
- [LinkedIn](https://linkedin.com/company/dlytica)
- [GitHub](https://github.com/dlytica)

## 🙏 Acknowledgments

- [Django Project](https://www.djangoproject.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [django-environ](https://github.com/joke2k/django-environ)

---

**Built with ❤️ for Nepali Businesses**
