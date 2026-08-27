import json
from typing import AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from app.api.deps import get_current_user
from app.db.models import User
from app.schemas.scan import ScanRequest
from app.services.scanner_service import scanner_service
from app.services.ai_service import ai_service
from app.schemas.chat import Message
from app.core.logging import logger

router = APIRouter()

@router.post("")
async def scan_endpoint(
    request: ScanRequest,
    current_user: User = Depends(get_current_user)
):
    # Log metadata, NEVER expose content in logs
    logger.info(f"Received scan request of length {len(request.content)} from user {current_user.id}")
    
    findings = scanner_service.scan_code(request.content)
    
    findings_text = "Security Scanner Findings:\n"
    if findings:
        for f in findings:
            findings_text += f"Finding: {f.title}\nSeverity: {f.severity}\nCategory: {f.category}\nLocation: {f.location}\nEvidence: {f.evidence}\nConfidence: {f.confidence}\n\n"
        findings_text += f"Target Source Code:\n```\n{request.content}\n```\n\nPlease enrich these findings. For each finding, provide: Finding, Severity, Category, Location, Evidence, Impact, Recommended Mitigation, Verification, and Confidence."
    else:
        findings_text += "No deterministic findings detected.\n"
        findings_text += f"Target Source Code:\n```\n{request.content}\n```\n\nPlease perform a manual security review on the code and output any findings in the required structured format. Do not claim a vulnerability without evidence."

    # Send to AI as a system-like request, wrapped in a user message
    messages = [Message(role="user", content=findings_text)]
    
    # We use ai_service.stream_chat, which already formats as SSE using _format_message
    return StreamingResponse(
        ai_service.stream_chat(messages),
        media_type="text/event-stream"
    )
