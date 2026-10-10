
from pathlib import Path
from datetime import date

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.database import get_connection, init_db
from app.models import ExpenseCreate, BudgetCreate


# --------------------------------------------------
# Application configuration
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(
    title="Smart Expense Tracker Pro",
    description="A personal expense and budget tracking application",
    version="1.0.0",
)

app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR / "static"),
    name="static",
)

templates = Jinja2Templates(
    directory=BASE_DIR / "templates"
)


# --------------------------------------------------
# Database initialization
# --------------------------------------------------

@app.on_event("startup")
async def startup_event():
    init_db()


# --------------------------------------------------
# Homepage
# --------------------------------------------------

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"app_name": "Smart Expense Tracker Pro"},
    )


# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.get("/api/health", tags=["General"])
def health_check():
    return {
        "status": "healthy",
        "app": "Smart Expense Tracker Pro",
    }


# --------------------------------------------------
# Expense APIs
# --------------------------------------------------

@app.post("/api/expenses", status_code=201, tags=["Expenses"])
def create_expense(expense: ExpenseCreate):
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO expenses
                (title, amount, category, expense_date, notes)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                expense.title.strip(),
                expense.amount,
                expense.category.strip(),
                expense.expense_date.isoformat(),
                expense.notes.strip(),
            ),
        )

        expense_id = cursor.lastrowid

        row = connection.execute(
            "SELECT * FROM expenses WHERE id = ?",
            (expense_id,),
        ).fetchone()

    return dict(row)


@app.get("/api/expenses", tags=["Expenses"])
def list_expenses():
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM expenses
            ORDER BY expense_date DESC, id DESC
            """
        ).fetchall()

    return [dict(row) for row in rows]


@app.delete(
    "/api/expenses/{expense_id}",
    tags=["Expenses"],
)
def delete_expense(expense_id: int):
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM expenses WHERE id = ?",
            (expense_id,),
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Expense not found",
            )

    return {
        "message": "Expense deleted successfully",
        "expense_id": expense_id,
    }


# --------------------------------------------------
# Monthly budget APIs
# --------------------------------------------------

@app.post("/api/budgets", status_code=201, tags=["Budgets"])
def create_or_update_budget(budget: BudgetCreate):
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO budgets (month, amount)
            VALUES (?, ?)
            ON CONFLICT(month)
            DO UPDATE SET amount = excluded.amount
            """,
            (budget.month, budget.amount),
        )

        row = connection.execute(
            "SELECT * FROM budgets WHERE month = ?",
            (budget.month,),
        ).fetchone()

    return dict(row)


@app.get("/api/budgets", tags=["Budgets"])
def list_budgets():
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM budgets ORDER BY month DESC"
        ).fetchall()

    return [dict(row) for row in rows]


# --------------------------------------------------
# Dashboard summary API
# --------------------------------------------------

@app.get("/api/dashboard", tags=["Dashboard"])
def get_dashboard(month: str):
    # Validate the month format: YYYY-MM
    try:
        if (
            len(month) != 7
            or month[4] != "-"
            or not month[:4].isdigit()
            or not month[5:].isdigit()
        ):
            raise ValueError

        parsed_month = date.fromisoformat(f"{month}-01")

        if parsed_month.strftime("%Y-%m") != month:
            raise ValueError

    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Month must use YYYY-MM format, such as 2026-10",
        )

    with get_connection() as connection:

        # Total spending across all dates
        total_row = connection.execute(
            """
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            """
        ).fetchone()

        # Spending for the selected month
        monthly_row = connection.execute(
            """
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE substr(expense_date, 1, 7) = ?
            """,
            (month,),
        ).fetchone()

        # Budget for the selected month
        budget_row = connection.execute(
            """
            SELECT amount
            FROM budgets
            WHERE month = ?
            """,
            (month,),
        ).fetchone()

        # Spending grouped by category
        category_rows = connection.execute(
            """
            SELECT category, SUM(amount) AS total
            FROM expenses
            WHERE substr(expense_date, 1, 7) = ?
            GROUP BY category
            ORDER BY total DESC
            """,
            (month,),
        ).fetchall()

    total_spending = float(total_row["total"])
    monthly_spending = float(monthly_row["total"])

    monthly_budget = (
        float(budget_row["amount"])
        if budget_row is not None
        else 0.0
    )

    remaining_budget = monthly_budget - monthly_spending

    return {
        "month": month,
        "total_spending": round(total_spending, 2),
        "monthly_spending": round(monthly_spending, 2),
        "monthly_budget": round(monthly_budget, 2),
        "remaining_budget": round(remaining_budget, 2),
        "category_breakdown": [
            {
                "category": row["category"],
                "total": round(float(row["total"]), 2),
            }
            for row in category_rows
        ],
    }
