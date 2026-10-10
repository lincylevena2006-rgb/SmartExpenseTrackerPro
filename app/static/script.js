
"use strict";

const API_BASE = "";

const selectedMonth = document.getElementById("selected-month");
const expenseForm = document.getElementById("expense-form");
const budgetForm = document.getElementById("budget-form");
const showExpenseFormButton = document.getElementById("show-expense-form");
const cancelExpenseFormButton = document.getElementById("cancel-expense-form");

const expenseMessage = document.getElementById("expense-message");
const budgetMessage = document.getElementById("budget-message");
const expenseList = document.getElementById("expense-list");
const categoryBreakdown = document.getElementById("category-breakdown");
const expenseSearch = document.getElementById("expense-search");
const categoryFilter = document.getElementById("category-filter");
const exportCsvButton = document.getElementById("export-csv-button");
const expenseCount = document.getElementById("expense-count");

let allExpenses = [];

function formatMoney(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(value) || 0);
}

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDate(value) {
    if (!value) return "—";
    const parts = value.split("-");
    if (parts.length !== 3) return value;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function showMessage(element, message, isError = false) {
    if (!element) return;
    element.textContent = message;
    element.style.color = isError ? "#d9485f" : "#19a77a";
}

async function apiRequest(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        let message = data.detail || `Request failed: ${response.status}`;

        if (Array.isArray(data.detail)) {
            message = data.detail.map(item => item.msg).join(", ");
        }

        throw new Error(message);
    }

    return data;
}

function getFilteredExpenses() {
    const searchText = (expenseSearch?.value || "").trim().toLowerCase();
    const selectedCategory = categoryFilter?.value || "all";

    return allExpenses.filter(expense => {
        const title = (expense.title || "").toLowerCase();
        const category = (expense.category || "").toLowerCase();
        const notes = (expense.notes || "").toLowerCase();

        const matchesSearch =
            title.includes(searchText) ||
            category.includes(searchText) ||
            notes.includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            selectedCategory === "" ||
            expense.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });
}

async function loadDashboard() {
    const month = selectedMonth.value;
    if (!month) return;

    try {
        const data = await apiRequest(
            `/api/dashboard?month=${encodeURIComponent(month)}`
        );

        document.getElementById("total-spending").textContent =
            formatMoney(data.total_spending);

        document.getElementById("monthly-spending").textContent =
            formatMoney(data.monthly_spending);

        document.getElementById("monthly-budget").textContent =
            formatMoney(data.monthly_budget);

        document.getElementById("remaining-budget").textContent =
            formatMoney(data.remaining_budget);

        updateBudgetProgress(data);
        renderCategories(data.category_breakdown || []);
    } catch (error) {
        console.error("Dashboard loading error:", error);
        showMessage(expenseMessage, error.message, true);
    }
}

function updateBudgetProgress(data) {
    const budget = Number(data.monthly_budget) || 0;
    const spending = Number(data.monthly_spending) || 0;
    const percentage = budget > 0 ? (spending / budget) * 100 : 0;

    document.getElementById("budget-percentage").textContent =
        `${Math.round(percentage)}%`;

    const fill = document.getElementById("budget-progress-fill");
    fill.style.width = `${Math.min(percentage, 100)}%`;
    fill.style.background = percentage > 100
        ? "#e05260"
        : "linear-gradient(90deg, #9b7cff, #6746d8)";

    const track = document.getElementById("budget-progress-track");

    if (track) {
        track.setAttribute(
            "aria-valuenow",
            String(Math.min(Math.round(percentage), 100))
        );
    }

    const status = document.getElementById("budget-status");

    if (budget <= 0) {
        status.textContent = "Save a monthly budget to track your progress.";
    } else if (spending > budget) {
        status.textContent =
            `You exceeded your budget by ${formatMoney(spending - budget)}.`;
    } else {
        status.textContent =
            `${formatMoney(budget - spending)} remaining for this month.`;
    }
}

function renderCategories(categories) {
    categoryBreakdown.replaceChildren();

    if (categories.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-state";
        message.textContent = "No expenses recorded for this month yet.";
        categoryBreakdown.appendChild(message);
        return;
    }

    const maximum = Math.max(
        ...categories.map(item => Number(item.total) || 0),
        1
    );

    categories.forEach(item => {
        const card = document.createElement("div");
        card.className = "category-item";

        const title = document.createElement("h3");
        title.textContent = item.category;

        const amount = document.createElement("strong");
        amount.textContent = formatMoney(item.total);

        const track = document.createElement("div");
        track.className = "category-track";

        const fill = document.createElement("div");
        fill.className = "category-fill";
        fill.style.width =
            `${((Number(item.total) || 0) / maximum) * 100}%`;

        track.appendChild(fill);
        card.append(title, amount, track);
        categoryBreakdown.appendChild(card);
    });
}

async function loadExpenses() {
    try {
        allExpenses = await apiRequest("/api/expenses");
        renderExpenses();
    } catch (error) {
        console.error("Expenses loading error:", error);
        showMessage(
            expenseMessage,
            `Could not load expenses: ${error.message}`,
            true
        );
    }
}

function renderExpenses() {
    const expenses = getFilteredExpenses();
    expenseList.replaceChildren();

    if (expenseCount) {
        expenseCount.textContent =
            `${expenses.length} of ${allExpenses.length} expense(s)`;
    }

    if (expenses.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.className = "empty-state";
        cell.textContent = allExpenses.length === 0
            ? "No expenses yet. Add your first expense!"
            : "No expenses match your search or category.";

        row.appendChild(cell);
        expenseList.appendChild(row);
        return;
    }

    expenses.forEach(expense => {
        const row = document.createElement("tr");

        const titleCell = document.createElement("td");
        titleCell.textContent = expense.title;

        const categoryCell = document.createElement("td");
        categoryCell.textContent = expense.category;

        const dateCell = document.createElement("td");
        dateCell.textContent = formatDate(expense.expense_date);

        const amountCell = document.createElement("td");
        amountCell.textContent = formatMoney(expense.amount);

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", async () => {
            if (!window.confirm(`Delete "${expense.title}"?`)) return;

            try {
                await apiRequest(`/api/expenses/${expense.id}`, {
                    method: "DELETE"
                });

                showMessage(expenseMessage, "Expense deleted successfully!");
                await refreshDashboard();
            } catch (error) {
                showMessage(expenseMessage, error.message, true);
            }
        });

        actionCell.appendChild(deleteButton);
        row.append(
            titleCell,
            categoryCell,
            dateCell,
            amountCell,
            actionCell
        );

        expenseList.appendChild(row);
    });
}

async function loadBudgetForm() {
    const month = selectedMonth.value;
    if (!month) return;

    document.getElementById("budget-month").value = month;

    try {
        const budgets = await apiRequest("/api/budgets");
        const currentBudget = budgets.find(item => item.month === month);

        document.getElementById("budget-amount").value =
            currentBudget ? currentBudget.amount : "";
    } catch (error) {
        console.error("Budget loading error:", error);
    }
}

async function refreshDashboard() {
    await Promise.all([
        loadDashboard(),
        loadExpenses()
    ]);
}

function exportExpensesToCSV() {
    const expenses = getFilteredExpenses();

    if (expenses.length === 0) {
        showMessage(
            expenseMessage,
            "No expenses to export. Change your search or filter.",
            true
        );
        return;
    }

    const headers = [
        "ID",
        "Title",
        "Amount (INR)",
        "Category",
        "Expense Date",
        "Notes"
    ];

    function escapeCsv(value, isText = false) {
        let text = String(value ?? "");

        if (isText && /^[\s]*[=+\-@]/.test(text)) {
            text = "'" + text;
        }

        return `"${text.replace(/"/g, '""')}"`;
    }

    const rows = expenses.map(expense => [
        escapeCsv(expense.id),
        escapeCsv(expense.title, true),
        escapeCsv(Number(expense.amount).toFixed(2)),
        escapeCsv(expense.category, true),
        escapeCsv(expense.expense_date),
        escapeCsv(expense.notes || "", true)
    ]);

    const csvContent = [
        headers.map(header => escapeCsv(header)).join(","),
        ...rows.map(row => row.join(","))
    ].join("\r\n");

    const blob = new Blob(
        ["\uFEFF", csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `expenses-${selectedMonth.value || "all"}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    showMessage(
        expenseMessage,
        `${expenses.length} expense(s) exported successfully!`
    );
}

showExpenseFormButton.addEventListener("click", () => {
    expenseForm.classList.remove("hidden");
    document.getElementById("expense-date").value = getToday();
    document.getElementById("expense-title").focus();
});

cancelExpenseFormButton.addEventListener("click", () => {
    expenseForm.reset();
    expenseForm.classList.add("hidden");
    document.getElementById("expense-date").value = getToday();
    showMessage(expenseMessage, "");
});

expenseForm.addEventListener("submit", async event => {
    event.preventDefault();

    const expense = {
        title: document.getElementById("expense-title").value.trim(),
        amount: Number(document.getElementById("expense-amount").value),
        category: document.getElementById("expense-category").value,
        expense_date: document.getElementById("expense-date").value,
        notes: document.getElementById("expense-notes").value.trim()
    };

    if (
        !expense.title ||
        !expense.expense_date ||
        !Number.isFinite(expense.amount) ||
        expense.amount <= 0
    ) {
        showMessage(
            expenseMessage,
            "Enter an expense name, a positive amount, and a valid date.",
            true
        );
        return;
    }

    try {
        await apiRequest("/api/expenses", {
            method: "POST",
            body: JSON.stringify(expense)
        });

        expenseForm.reset();
        expenseForm.classList.add("hidden");
        document.getElementById("expense-date").value = getToday();

        showMessage(expenseMessage, "Expense saved successfully!");
        await refreshDashboard();
    } catch (error) {
        showMessage(expenseMessage, error.message, true);
    }
});

budgetForm.addEventListener("submit", async event => {
    event.preventDefault();

    const month = document.getElementById("budget-month").value;
    const amount = Number(
        document.getElementById("budget-amount").value
    );

    if (!month || !Number.isFinite(amount) || amount < 0) {
        showMessage(
            budgetMessage,
            "Enter a valid month and a non-negative budget.",
            true
        );
        return;
    }

    try {
        await apiRequest("/api/budgets", {
            method: "POST",
            body: JSON.stringify({ month, amount })
        });

        selectedMonth.value = month;
        showMessage(budgetMessage, "Monthly budget saved successfully!");

        await refreshDashboard();
        await loadBudgetForm();
    } catch (error) {
        showMessage(budgetMessage, error.message, true);
    }
});

selectedMonth.addEventListener("change", async () => {
    document.getElementById("budget-month").value = selectedMonth.value;
    await refreshDashboard();
    await loadBudgetForm();
});

if (expenseSearch) {
    expenseSearch.addEventListener("input", renderExpenses);
}

if (categoryFilter) {
    categoryFilter.addEventListener("change", renderExpenses);
}

if (exportCsvButton) {
    exportCsvButton.addEventListener("click", exportExpensesToCSV);
}

async function initializeDashboard() {
    document.getElementById("expense-date").value = getToday();
    document.getElementById("budget-month").value = selectedMonth.value;

    await refreshDashboard();
    await loadBudgetForm();
}

initializeDashboard();
