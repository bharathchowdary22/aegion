import pytest
from httpx import AsyncClient, ASGITransport
from fastapi import HTTPException
from app.main import app
from app.db.models import User
from app.api.deps import get_current_user

@pytest.fixture
def mock_user():
    return User(id="123e4567-e89b-12d3-a456-426614174000", email="test@example.com")

@pytest.mark.asyncio
async def test_scan_unauthenticated():
    def override_get_current_user():
        raise HTTPException(status_code=401, detail="Not authenticated")
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/scan", json={"content": "print('hello')"})
    assert response.status_code == 401
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/scan/analyze", json={"content": "print('hello')"})
    assert response.status_code == 401
    
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_scan_empty_input(mock_user):
    app.dependency_overrides[get_current_user] = lambda: mock_user
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/scan", json={"content": ""})
    assert response.status_code == 422
    
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_scan_too_large(mock_user):
    app.dependency_overrides[get_current_user] = lambda: mock_user
    
    large_input = "a" * 50001
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/scan", json={"content": large_input})
    assert response.status_code == 422
    
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_scan_analyze(mock_user):
    app.dependency_overrides[get_current_user] = lambda: mock_user
    
    code = "query = 'SELECT * FROM users WHERE username = \\'' + username + '\\''"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/scan/analyze", json={"content": code})
        
    assert response.status_code == 200
    data = response.json()
    assert "findings" in data
    assert "summary" in data
    assert data["summary"]["CRITICAL"] == 1
    assert data["findings"][0]["severity"] == "CRITICAL"
    assert data["findings"][0]["status"] == "OPEN"
    
    app.dependency_overrides.clear()
