
from datetime import date

from pydantic import BaseModel, Field


class ExpenseCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=100,
        description="Name or description of the expense",
    )

    amount: float = Field(
        gt=0,
        le=100000000,
        description="Expense amount must be positive",
    )

    category: str = Field(
        min_length=1,
        max_length=50,
    )

    expense_date: date

    notes: str = Field(
        default="",
        max_length=500,
    )


class BudgetCreate(BaseModel):
    month: str = Field(
        pattern=r"^\d{4}-(0[1-9]|1[0-2])$",
        description="Budget month in YYYY-MM format",
    )

    amount: float = Field(
        ge=0,
        le=100000000,
    )
