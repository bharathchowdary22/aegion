import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user
from app.db.models import User
import asyncio

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from app.core.config import settings
from sqlalchemy import text
from app.api.deps import get_db

# Setup mock users
mock_user_a = User(id=uuid.uuid4(), email="usera_soc@example.com")
mock_user_b = User(id=uuid.uuid4(), email="userb_soc@example.com")

test_engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)

async def override_get_db():
    async with TestSessionLocal() as session:
        yield session

@pytest.fixture(autouse=True, scope="module")
def setup_users_fixture():
    async def _setup():
        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
        async with SessionLocal() as session:
            user_a = await session.get(User, mock_user_a.id)
            if not user_a: session.add(User(id=mock_user_a.id, email=mock_user_a.email))
            user_b = await session.get(User, mock_user_b.id)
            if not user_b: session.add(User(id=mock_user_b.id, email=mock_user_b.email))
            try: await session.commit()
            except Exception: await session.rollback()
        await engine.dispose()
    
    asyncio.run(_setup())
    yield
    
    async def _teardown():
        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
        async with SessionLocal() as session:
            try:
                await session.execute(text(f"DELETE FROM security_alerts WHERE user_id IN ('{mock_user_a.id}', '{mock_user_b.id}')"))
                await session.execute(text(f"DELETE FROM security_events WHERE user_id IN ('{mock_user_a.id}', '{mock_user_b.id}')"))
                await session.execute(text(f"DELETE FROM users WHERE id IN ('{mock_user_a.id}', '{mock_user_b.id}')"))
                await session.commit()
            except Exception: await session.rollback()
        await engine.dispose()
                
    asyncio.run(_teardown())

def override_user_a():
    return mock_user_a

def override_user_b():
    return mock_user_b

def override_unauth():
    raise Exception("Not authenticated")

@pytest.fixture(autouse=True)
def inject_db_override():
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()


def test_unauthenticated_ingestion():
    with TestClient(app) as client:
        res = client.post("/api/v1/siem/events", json={
            "source": "test",
            "event_type": "test",
            "severity": "INFO",
            "category": "Test"
        })
        assert res.status_code == 401

def test_ingest_event_and_retrieve():
    app.dependency_overrides[get_current_user] = override_user_a
    with TestClient(app) as client:
        # Ingest
        res = client.post("/api/v1/siem/events", json={
            "source": "firewall",
            "event_type": "connection_accepted",
            "severity": "INFO",
            "category": "Network",
            "source_ip": "1.1.1.1"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "processed"
        event_id = data["event_id"]

        # Retrieve
        res_get = client.get(f"/api/v1/siem/events/{event_id}")
        assert res_get.status_code == 200
        assert res_get.json()["source_ip"] == "1.1.1.1"

        # List
        res_list = client.get("/api/v1/siem/events")
        assert res_list.status_code == 200
        assert res_list.json()["total"] >= 1

def test_idor_events():
    # User A creates an event
    app.dependency_overrides[get_current_user] = override_user_a
    with TestClient(app) as client:
        res = client.post("/api/v1/siem/events", json={
            "source": "app",
            "event_type": "user_created",
            "severity": "INFO",
            "category": "Application"
        })
        event_id = res.json()["event_id"]

    # User B tries to read it
    app.dependency_overrides[get_current_user] = override_user_b
    with TestClient(app) as client:
        res_get = client.get(f"/api/v1/siem/events/{event_id}")
        assert res_get.status_code == 404

def test_brute_force_detection():
    app.dependency_overrides[get_current_user] = override_user_a
    with TestClient(app) as client:
        for i in range(5):
            res = client.post("/api/v1/siem/events", json={
                "source": "auth_server",
                "event_type": "login_failed",
                "severity": "LOW",
                "category": "Authentication",
                "source_ip": "10.0.0.5",
                "username": "admin"
            })
            assert res.status_code == 200
            
            if i == 4:
                # 5th attempt should trigger the alert
                data = res.json()
                assert "AEG-001" in data["detected_rules"]

        # Check alert list
        res_alerts = client.get("/api/v1/siem/alerts")
        alerts = res_alerts.json()["items"]
        assert any(a["rule_id"] == "AEG-001" for a in alerts)

def test_sql_injection_detection():
    app.dependency_overrides[get_current_user] = override_user_a
    with TestClient(app) as client:
        res = client.post("/api/v1/siem/events", json={
            "source": "waf",
            "event_type": "blocked_request",
            "severity": "HIGH",
            "category": "Web",
            "message": "User input contained ' OR 1=1 --;"
        })
        assert res.status_code == 200
        assert "AEG-002" in res.json()["detected_rules"]

def test_alert_status_update():
    app.dependency_overrides[get_current_user] = override_user_a
    with TestClient(app) as client:
        # Create an alert via cmd injection
        res = client.post("/api/v1/siem/events", json={
            "source": "ids",
            "event_type": "suspicious_payload",
            "severity": "CRITICAL",
            "category": "Network",
            "raw_event": "GET /?cmd=$(whoami) HTTP/1.1"
        })
        assert "AEG-003" in res.json()["detected_rules"]
        
        # Get alerts
        res_alerts = client.get("/api/v1/siem/alerts")
        alert = res_alerts.json()["items"][0]
        alert_id = alert["id"]
        
        # Update status
        res_patch = client.patch(f"/api/v1/siem/alerts/{alert_id}", json={"status": "IN REVIEW"})
        assert res_patch.status_code == 200
        assert res_patch.json()["status"] == "IN REVIEW"

def test_bulk_ingestion():
    app.dependency_overrides[get_current_user] = override_user_a
    with TestClient(app) as client:
        events = [
            {"source": "server1", "event_type": "ping", "severity": "INFO", "category": "Network"},
            {"source": "server2", "event_type": "ping", "severity": "INFO", "category": "Network"}
        ]
        res = client.post("/api/v1/siem/events/bulk", json=events)
        assert res.status_code == 200
        assert res.json()["processed"] == 2
        assert len(res.json()["results"]) == 2

def test_oversized_event():
    app.dependency_overrides[get_current_user] = override_user_a
    with TestClient(app) as client:
        res = client.post("/api/v1/siem/events", json={
            "source": "waf",
            "event_type": "test",
            "severity": "INFO",
            "category": "Web",
            "raw_event": "A" * 15000  # 15KB > 10KB limit
        })
        assert res.status_code == 400
