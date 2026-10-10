# Smart Expense Tracker Pro 💸

A simple and modern expense-tracking web application built with Python, FastAPI, SQLite, HTML, CSS, and JavaScript.

## ✨ Features

- 📊 Dashboard with expense summaries
- 💰 Monthly budget management
- 📈 Budget progress and remaining balance
- 🧾 Add and delete expenses
- 🔍 Search and filter expenses
- 🗂️ Category-wise expense breakdown
- 📥 Export expenses to CSV
- 🗄️ SQLite database for storing expense records
- 🧪 Automated tests using Pytest

## 🛠️ Technologies Used

- **Backend:** Python, FastAPI
- **Database:** SQLite
- **Frontend:** HTML, CSS, JavaScript
- **Testing:** Pytest, HTTPX
- **Server:** Uvicorn

## 📁 Project Structure

```text
SmartExpenseTrackerPro/
├── app/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── templates/
│   │   └── index.html
│   └── static/
│       ├── style.css
│       ├── script.js
│       └── favicon.png
├── tests/
│   └── test_main.py
├── requirements.txt
└── .gitignore
```

## 🚀 Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/lincylevena2006-rgb/SmartExpenseTrackerPro.git
cd SmartExpenseTrackerPro
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

### 3. Activate the virtual environment

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

### 4. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 5. Run the application

```bash
python -m uvicorn app.main:app --port 8001
```

### 6. Open the application

Visit the following URLs in your browser:

- **Web application:** http://127.0.0.1:8001/
- **API documentation:** http://127.0.0.1:8001/docs

Keep the terminal running while using the application.

## 🧪 Run Tests

Run the automated tests using:

```bash
python -m pytest -v
```

## 🎯 Project Goal

The goal of Smart Expense Tracker Pro is to provide a convenient way to record expenses, monitor monthly budgets, and understand spending patterns through a simple web interface.

## 👩‍💻 Author

**Lincy M.**

B.Tech Information Technology Student

GitHub: [lincylevena2006-rgb](https://github.com/lincylevena2006-rgb)

---

*Built as a learning project to practice Python backend development, database integration, frontend development, API creation, and software testing.*
