
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_homepage_loads():
    response = client.get("/")
    assert response.status_code == 200


def test_dashboard_api_responds():
    response = client.get("/api/dashboard?month=2026-10")
    assert response.status_code == 200


def test_expenses_api_responds():
    response = client.get("/api/expenses")
    assert response.status_code == 200


def test_budgets_api_responds():
    response = client.get("/api/budgets")
    assert response.status_code == 200
