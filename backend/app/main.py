from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.chat import router as chat_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.scan import router as scan_router
from app.api.v1.siem import router as siem_router
from app.core.config import settings
from app.core.logging import setup_logging, RequestIdMiddleware

setup_logging()

app = FastAPI(title="Aegion API", version="1.0.0")

@app.get("/health")
async def health_check():
    return {"status": "ok"}

app.add_middleware(RequestIdMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(conversations_router, prefix="/api/v1/conversations", tags=["conversations"])
app.include_router(scan_router, prefix="/api/v1/scan", tags=["scan"])
app.include_router(siem_router, prefix="/api/v1/siem", tags=["siem"])
