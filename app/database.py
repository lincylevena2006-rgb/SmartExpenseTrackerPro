
import sqlite3
from pathlib import Path

# Find the app folder
BASE_DIR = Path(__file__).resolve().parent

# Database file location
DATABASE_PATH = BASE_DIR / "expenses.db"


def get_connection():
    """Create a connection to the SQLite database."""
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    """Create the database tables if they do not exist."""
    with get_connection() as connection:

        # Table for recording expenses
        connection.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                amount REAL NOT NULL CHECK(amount > 0),
                category TEXT NOT NULL,
                expense_date TEXT NOT NULL,
                notes TEXT DEFAULT '',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Table for monthly budgets
        connection.execute("""
            CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                month TEXT NOT NULL UNIQUE,
                amount REAL NOT NULL CHECK(amount >= 0)
            )
        """)

    print("Database initialized successfully!")
