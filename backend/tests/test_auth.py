import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user
import uuid

def mock_get_current_user():
    raise HTTPException(status_code=401, detail="Unauthorized")

@pytest.fixture
def unauth_client():
    app.dependency_overrides[get_current_user] = mock_get_current_user
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_missing_auth_chat(unauth_client):
    response = unauth_client.post("/api/v1/chat", json={"messages": [{"role": "user", "content": "Hi"}]})
    assert response.status_code == 401

def test_missing_auth_conversations(unauth_client):
    response = unauth_client.get("/api/v1/conversations/")
    assert response.status_code == 401
