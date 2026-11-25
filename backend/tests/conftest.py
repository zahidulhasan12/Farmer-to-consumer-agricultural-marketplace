import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from main import app


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(scope="session")
def admin_headers(client: TestClient) -> dict[str, str]:
    res = client.post("/api/v1/auth/login", json={"email": "admin@agroconnect.com", "password": "Admin123!"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def farmer_headers(client: TestClient) -> dict[str, str]:
    res = client.post("/api/v1/auth/login", json={"email": "farmer.rahim@agroconnect.com", "password": "Farmer123!"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def consumer_headers(client: TestClient) -> dict[str, str]:
    res = client.post("/api/v1/auth/login", json={"email": "consumer.sourov@agroconnect.com", "password": "Consumer123!"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
