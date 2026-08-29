import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.session import get_db
from app.db.models import User, SecurityEvent, SecurityAlert, SecurityIntelligence
from app.api.deps import get_current_user
from app.schemas.intelligence import SecurityIntelligenceResponse, IOCExtractionRequest, IOCIndicator
from app.services.ioc_service import ioc_service
from app.services.correlation_service import correlation_service
from app.services.threat_intel_service import threat_intel_service
from app.services.ai_service import ai_service

router = APIRouter()

async def get_recent_events(db: AsyncSession, user_id: uuid.UUID) -> List[SecurityEvent]:
    stmt = select(SecurityEvent).where(SecurityEvent.user_id == user_id).order_by(SecurityEvent.timestamp.desc()).limit(100)
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def analyze_target(target, source_type: str, db: AsyncSession, current_user: User):
    """Core analysis logic for both Alerts and Events."""
    # Base extraction
    text_to_analyze = target.title if source_type == "ALERT" else target.event_type
    text_to_analyze += " " + (target.description if source_type == "ALERT" else (target.message or ""))
    text_to_analyze += " " + (target.event.raw_event if source_type == "ALERT" and target.event.raw_event else (target.raw_event if source_type == "EVENT" and getattr(target, 'raw_event', None) else ""))
    
    iocs = ioc_service.extract_iocs(text_to_analyze)
    
    history = await get_recent_events(db, current_user.id)
    
    event = target.event if source_type == "ALERT" else target
    related_events, correlation_context = correlation_service.correlate_event(event, history)
    
    # Calculate Risk Score
    severity = target.severity
    event_vol = len(related_events)
    alert_vol = 1 if source_type == "ALERT" else 0
    score, level, evidence_str = correlation_service.calculate_risk_score(severity, event_vol, alert_vol, len(iocs))
    
    # AI Enrichment
    context_str = f"Source Type: {source_type}\nSource ID: {target.id}\nSeverity: {severity}\n"
    context_str += f"Title/Type: {target.title if source_type == 'ALERT' else target.event_type}\n"
    context_str += f"Raw Event Data: {text_to_analyze[:1000]}\n"
    context_str += f"Related Events Found: {event_vol}\n"
    context_str += f"IOCs Found: {[i.indicator for i in iocs]}\n"
    
    ai_analysis = await ai_service.analyze_security_context(context_str)
    
    # Save Intelligence
    intel = SecurityIntelligence(
        user_id=current_user.id,
        source_type=source_type,
        source_id=str(target.id),
        risk_score=str(score),
        confidence=ai_analysis.get("confidence", "MEDIUM"),
        summary=ai_analysis.get("summary", ""),
        evidence=evidence_str + "\n" + ai_analysis.get("evidence", ""),
        indicators=json.dumps([i.model_dump() for i in iocs]),
        related_events=json.dumps([str(e.id) for e in related_events]),
        related_alerts=json.dumps([str(target.id)] if source_type == "ALERT" else []),
        recommended_actions=ai_analysis.get("recommended_mitigation", "")
    )
    
    db.add(intel)
    await db.commit()
    await db.refresh(intel)
    return intel

@router.post("/analyze-alert/{alert_id}", response_model=SecurityIntelligenceResponse)
async def analyze_alert(
    alert_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(SecurityAlert).where(SecurityAlert.id == alert_id, SecurityAlert.user_id == current_user.id)
    result = await db.execute(stmt)
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    # Eager load event if not loaded
    if not alert.event:
        stmt_ev = select(SecurityEvent).where(SecurityEvent.id == alert.event_id)
        res_ev = await db.execute(stmt_ev)
        alert.event = res_ev.scalar_one()

    return await analyze_target(alert, "ALERT", db, current_user)

@router.post("/analyze-event/{event_id}", response_model=SecurityIntelligenceResponse)
async def analyze_event(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(SecurityEvent).where(SecurityEvent.id == event_id, SecurityEvent.user_id == current_user.id)
    result = await db.execute(stmt)
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    return await analyze_target(event, "EVENT", db, current_user)

@router.get("/alert/{alert_id}", response_model=List[SecurityIntelligenceResponse])
async def get_alert_intelligence(
    alert_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Enforce alert ownership check first
    stmt = select(SecurityAlert).where(SecurityAlert.id == alert_id, SecurityAlert.user_id == current_user.id)
    result = await db.execute(stmt)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Alert not found")
        
    stmt_intel = select(SecurityIntelligence).where(
        SecurityIntelligence.source_id == str(alert_id),
        SecurityIntelligence.source_type == "ALERT",
        SecurityIntelligence.user_id == current_user.id
    ).order_by(SecurityIntelligence.created_at.desc())
    
    res = await db.execute(stmt_intel)
    return res.scalars().all()

@router.get("/event/{event_id}", response_model=List[SecurityIntelligenceResponse])
async def get_event_intelligence(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(SecurityEvent).where(SecurityEvent.id == event_id, SecurityEvent.user_id == current_user.id)
    result = await db.execute(stmt)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Event not found")
        
    stmt_intel = select(SecurityIntelligence).where(
        SecurityIntelligence.source_id == str(event_id),
        SecurityIntelligence.source_type == "EVENT",
        SecurityIntelligence.user_id == current_user.id
    ).order_by(SecurityIntelligence.created_at.desc())
    
    res = await db.execute(stmt_intel)
    return res.scalars().all()

@router.get("/{intelligence_id}", response_model=SecurityIntelligenceResponse)
async def get_intelligence(
    intelligence_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(SecurityIntelligence).where(SecurityIntelligence.id == intelligence_id, SecurityIntelligence.user_id == current_user.id)
    result = await db.execute(stmt)
    intel = result.scalar_one_or_none()
    if not intel:
        raise HTTPException(status_code=404, detail="Intelligence not found")
    return intel

@router.get("/investigations", response_model=List[SecurityIntelligenceResponse])
async def list_investigations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(SecurityIntelligence).where(SecurityIntelligence.user_id == current_user.id).order_by(SecurityIntelligence.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())

@router.post("/ioc/extract", response_model=List[IOCIndicator])
async def extract_iocs(
    request: IOCExtractionRequest,
    current_user: User = Depends(get_current_user)
):
    # Prevent extremely large inputs
    if len(request.text) > 50000:
        raise HTTPException(status_code=400, detail="Text too large")
    return ioc_service.extract_iocs(request.text)

@router.get("/ioc/{indicator}")
async def lookup_ioc(
    indicator: str,
    indicator_type: str = "Unknown",
    current_user: User = Depends(get_current_user)
):
    res = threat_intel_service.lookup_indicator(indicator, indicator_type)
    return res.dict()
