import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.logging import RequestIdMiddleware, request_id_ctx_var

app = FastAPI()
app.add_middleware(RequestIdMiddleware)

@app.get("/test")
async def dummy_route(request: Request):
    # Retrieve the request_id from context during the request
    req_id = request_id_ctx_var.get()
    return {"req_id": req_id}

client = TestClient(app)

def test_request_id_middleware():
    response = client.get("/test")
    assert response.status_code == 200
    data = response.json()
    
    # 1. response contains X-Request-ID header
    assert "X-Request-ID" in response.headers
    header_req_id = response.headers["X-Request-ID"]
    
    # 2. X-Request-ID is a valid UUID
    import uuid
    try:
        uuid_obj = uuid.UUID(header_req_id, version=4)
    except ValueError:
        pytest.fail("X-Request-ID is not a valid UUID4")
        
    # 3. request ID is available to context during the request
    assert data["req_id"] == header_req_id

def test_request_id_context_var_reset():
    # 4. ContextVar is reset after the request
    # Outside a request, it should be the default ("-")
    assert request_id_ctx_var.get() == "-"
