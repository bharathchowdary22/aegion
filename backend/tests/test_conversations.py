import uuid
import pytest
from fastapi.testclient import TestClient
from fastapi import HTTPException
from app.main import app
from app.db.models import User
from app.api.deps import get_current_user

# Mock users for IDOR testing
mock_user_a = User(id=uuid.uuid4(), email="usera@example.com")
mock_user_b = User(id=uuid.uuid4(), email="userb@example.com")

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from app.core.config import settings
from sqlalchemy import text
from app.api.deps import get_db
import pytest

# Create an engine with NullPool specifically to prevent 'another operation is in progress' errors
# caused by FastAPI TestClient's dependency teardown race conditions with asyncpg's QueuePool.
test_engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)

async def override_get_db():
    async with TestSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True, scope="module")
def setup_users_fixture():
    async def _setup():
        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
        async with SessionLocal() as session:
            user_a = await session.get(User, mock_user_a.id)
            if not user_a:
                session.add(User(id=mock_user_a.id, email=mock_user_a.email))
            user_b = await session.get(User, mock_user_b.id)
            if not user_b:
                session.add(User(id=mock_user_b.id, email=mock_user_b.email))
            try:
                await session.commit()
            except Exception:
                await session.rollback()
        await engine.dispose()
    
    asyncio.run(_setup())
    yield
    
    async def _teardown():
        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
        async with SessionLocal() as session:
            try:
                await session.execute(text(f"DELETE FROM conversations WHERE user_id IN ('{mock_user_a.id}', '{mock_user_b.id}')"))
                await session.execute(text(f"DELETE FROM users WHERE id IN ('{mock_user_a.id}', '{mock_user_b.id}')"))
                await session.commit()
            except Exception:
                await session.rollback()
        await engine.dispose()
                
    asyncio.run(_teardown())

shared_conv_id = None

def override_user_a():
    return mock_user_a

def override_user_b():
    return mock_user_b

def override_unauth():
    raise HTTPException(status_code=401, detail="Not authenticated")

def test_unauthenticated_cannot_access():
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_unauth
    with TestClient(app) as client:
        # Cannot retrieve conversations
        res = client.get("/api/v1/conversations/")
        assert res.status_code == 401
        
        # Cannot create conversations
        res = client.post("/api/v1/conversations/", json={"title": "Test"})
        assert res.status_code == 401
    
    app.dependency_overrides.clear()

def test_authenticated_user_flows():
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user_a
    with TestClient(app) as client:
        # 1. User A can create a conversation
        res = client.post("/api/v1/conversations/", json={"title": "My First Chat"})
        assert res.status_code == 200
        conv_id = res.json()["id"]
        
        # 2. User A can retrieve their conversations
        res = client.get("/api/v1/conversations/")
        assert res.status_code == 200
        assert len(res.json()) >= 1
        
        # 3. User A can retrieve their own conversation
        res = client.get(f"/api/v1/conversations/{conv_id}")
        assert res.status_code == 200
        assert res.json()["id"] == conv_id
        
        global shared_conv_id
        shared_conv_id = conv_id
    
    app.dependency_overrides.clear()

def test_user_b_cannot_access_user_a_conversation():
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user_b
    with TestClient(app) as client:
        # 7. User B cannot read User A's conversation
        res = client.get(f"/api/v1/conversations/{shared_conv_id}")
        assert res.status_code == 404
        
        # 9. User B cannot delete User A's conversation
        res = client.delete(f"/api/v1/conversations/{shared_conv_id}")
        assert res.status_code == 404
        
        # 10. User B cannot append messages to User A's conversation
        res = client.post("/api/v1/chat", json={
            "conversation_id": str(shared_conv_id),
            "messages": [{"role": "user", "content": "hello"}]
        })
        assert res.status_code == 404
    
    app.dependency_overrides.clear()

def test_invalid_conversation_id_handled_safely():
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user_a
    with TestClient(app) as client:
        # 11. Invalid conversation IDs handled safely
        res = client.get("/api/v1/conversations/not-a-uuid")
        assert res.status_code == 422
        
        res = client.post("/api/v1/chat", json={
            "conversation_id": "not-a-uuid",
            "messages": [{"role": "user", "content": "hi"}]
        })
        assert res.status_code == 400
    
    app.dependency_overrides.clear()

def test_empty_conversation_history_handled():
    # Use a brand new mock user so they have 0 history
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: User(id=uuid.uuid4(), email="empty@example.com")
    with TestClient(app) as client:
        # 12. Empty conversation history handled correctly
        res = client.get("/api/v1/conversations/")
        assert res.status_code == 200
        assert len(res.json()) == 0
    
    app.dependency_overrides.clear()
