import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_user_registration(client: AsyncClient):
    payload = {
        "email": "newconsultant@example.com",
        "full_name": "Jordan Smith",
        "password": "SecurePassword123!",
        "role": "consultant"
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "newconsultant@example.com"
    assert data["user"]["full_name"] == "Jordan Smith"

@pytest.mark.asyncio
async def test_duplicate_registration_fails(client: AsyncClient):
    payload = {
        "email": "duplicate@example.com",
        "full_name": "Duplicate User",
        "password": "SecurePassword123!",
        "role": "consultant"
    }
    res1 = await client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = await client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"]

@pytest.mark.asyncio
async def test_user_login_success(client: AsyncClient, test_user_a):
    payload = {
        "email": "user_a@example.com",
        "password": "Password123!"
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "user_a@example.com"

@pytest.mark.asyncio
async def test_user_login_invalid_password(client: AsyncClient, test_user_a):
    payload = {
        "email": "user_a@example.com",
        "password": "WrongPassword999!"
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

@pytest.mark.asyncio
async def test_protected_me_endpoint(client: AsyncClient, auth_headers_a):
    response = await client.get("/api/v1/auth/me", headers=auth_headers_a)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "user_a@example.com"

@pytest.mark.asyncio
async def test_unauthorized_access_rejected(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
