import json
from typing import AsyncGenerator, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.db.models import User
from app.schemas.scan import ScanRequest
from app.services.scanner_service import scanner_service
from app.services.ai_service import ai_service
from app.schemas.chat import Message
from app.core.logging import logger

router = APIRouter()

class ScanAnalyzeResponse(BaseModel):
    findings: List[Dict[str, Any]]
    summary: Dict[str, int]

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

@router.post("/analyze", response_model=ScanAnalyzeResponse)
async def analyze_code(
    request: ScanRequest,
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Received analyze request of length {len(request.content)} from user {current_user.id}")
    findings = scanner_service.scan_code(request.content)
    
    summary = {
        "CRITICAL": 0,
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0,
        "INFO": 0,
        "total": len(findings)
    }
    
    findings_dicts = []
    for f in findings:
        if f.severity in summary:
            summary[f.severity] += 1
        
        d = f.model_dump()
        d["status"] = "OPEN"
        d["impact"] = "Potential security compromise if exploited."
        d["mitigation"] = "Review the provided evidence and implement secure coding practices."
        d["verification"] = "Verify the fix by running the security scanner again."
        findings_dicts.append(d)
        
    return ScanAnalyzeResponse(findings=findings_dicts, summary=summary)
