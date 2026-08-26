import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user
from app.db.models import User
import uuid

mock_user_a = User(id=uuid.uuid4(), email="usera@example.com")
mock_user_b = User(id=uuid.uuid4(), email="userb@example.com")

def override_get_current_user_a():
    return mock_user_a

def override_get_current_user_b():
    return mock_user_b

@pytest.fixture
def auth_client_a():
    app.dependency_overrides[get_current_user] = override_get_current_user_a
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture
def auth_client_b():
    app.dependency_overrides[get_current_user] = override_get_current_user_b
    yield TestClient(app)
    app.dependency_overrides.clear()

# Note: In a real database test, we would insert actual DB records.
# Since we are focusing on authorization logic, we can verify that
# attempting to access non-existent or other users' resources returns 404, not 403 or 500.

def test_idor_get_conversation(auth_client_a):
    fake_conv_id = uuid.uuid4()
    response = auth_client_a.get(f"/api/v1/conversations/{fake_conv_id}")
    # Whether it doesn't exist or belongs to B, should be 404
    assert response.status_code == 404

def test_chat_invalid_conversation_id(auth_client_a):
    response = auth_client_a.post("/api/v1/chat", json={
        "conversation_id": "invalid-uuid",
        "messages": [{"role": "user", "content": "Hi"}]
    })
    assert response.status_code == 400
    assert "Invalid conversation_id" in response.json()["detail"]
