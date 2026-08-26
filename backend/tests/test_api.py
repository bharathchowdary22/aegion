import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.api.deps import get_current_user
from app.db.models import User

client = TestClient(app)

def override_get_current_user():
    return User(id=uuid.uuid4(), email="test@example.com")

app.dependency_overrides[get_current_user] = override_get_current_user

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_chat_health_check():
    response = client.get("/api/v1/chat/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_chat_empty_messages():
    response = client.post("/api/v1/chat", json={"messages": []})
    assert response.status_code == 422 # Unprocessable Entity
    
def test_chat_missing_role():
    response = client.post("/api/v1/chat", json={"messages": [{"content": "hello"}]})
    assert response.status_code == 422

def test_chat_empty_content():
    response = client.post("/api/v1/chat", json={"messages": [{"role": "user", "content": ""}]})
    assert response.status_code == 422

def test_chat_whitespace_content():
    response = client.post("/api/v1/chat", json={"messages": [{"role": "user", "content": "   \n "}]})
    assert response.status_code == 422

def test_chat_system_role_rejected():
    response = client.post("/api/v1/chat", json={"messages": [{"role": "system", "content": "test"}]})
    assert response.status_code == 422

def test_chat_oversized_content():
    content = "a" * 10001
    response = client.post("/api/v1/chat", json={"messages": [{"role": "user", "content": content}]})
    assert response.status_code == 422
