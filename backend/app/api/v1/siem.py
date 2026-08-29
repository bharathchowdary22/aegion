from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List, Optional
import uuid

from app.db.session import get_db
from app.db.models import User, SecurityEvent, SecurityAlert
from app.api.deps import get_current_user
from app.schemas.siem import (
    SecurityEventCreate, 
    SecurityEventResponse, 
    SecurityAlertResponse,
    PaginatedEventsResponse,
    PaginatedAlertsResponse,
    EventIngestionResponse,
    BulkEventIngestionResponse,
    AlertStatusUpdate
)
from app.services.detection_service import detection_engine

router = APIRouter()

@router.post("/events", response_model=EventIngestionResponse)
async def ingest_event(
    event_in: SecurityEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Enforce safe constraints
    if event_in.raw_event and len(event_in.raw_event) > 10000:
        raise HTTPException(status_code=400, detail="raw_event too large")
    
    event = SecurityEvent(
        user_id=current_user.id,
        source=event_in.source[:255],
        event_type=event_in.event_type[:255],
        severity=event_in.severity[:50],
        category=event_in.category[:100],
        source_ip=event_in.source_ip[:255] if event_in.source_ip else None,
        destination_ip=event_in.destination_ip[:255] if event_in.destination_ip else None,
        hostname=event_in.hostname[:255] if event_in.hostname else None,
        username=event_in.username[:255] if event_in.username else None,
        message=event_in.message[:1000] if event_in.message else None,
        raw_event=event_in.raw_event,
        timestamp=event_in.timestamp
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    # Get recent history for detection (last 100 events)
    stmt = select(SecurityEvent).where(
        SecurityEvent.user_id == current_user.id
    ).order_by(SecurityEvent.timestamp.desc()).limit(100)
    result = await db.execute(stmt)
    history = list(result.scalars().all())

    alerts = detection_engine.analyze_event(event, history)
    detected_rules = []
    
    for alert in alerts:
        db.add(alert)
        detected_rules.append(alert.rule_id)
        
    if alerts:
        event.detection_rule = ",".join(detected_rules)
        db.add(event)
        await db.commit()
        
    return EventIngestionResponse(
        event_id=event.id,
        status="processed",
        detected_rules=detected_rules
    )

@router.post("/events/bulk", response_model=BulkEventIngestionResponse)
async def ingest_events_bulk(
    events_in: List[SecurityEventCreate],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if len(events_in) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 events per bulk request")
        
    results = []
    processed = 0
    failed = 0
    
    for event_in in events_in:
        try:
            # We reuse the logic but in a production setting we'd optimize the DB calls
            event = SecurityEvent(
                user_id=current_user.id,
                source=event_in.source[:255],
                event_type=event_in.event_type[:255],
                severity=event_in.severity[:50],
                category=event_in.category[:100],
                source_ip=event_in.source_ip[:255] if event_in.source_ip else None,
                destination_ip=event_in.destination_ip[:255] if event_in.destination_ip else None,
                hostname=event_in.hostname[:255] if event_in.hostname else None,
                username=event_in.username[:255] if event_in.username else None,
                message=event_in.message[:1000] if event_in.message else None,
                raw_event=event_in.raw_event,
                timestamp=event_in.timestamp
            )
            db.add(event)
            await db.commit()
            await db.refresh(event)
            
            stmt = select(SecurityEvent).where(
                SecurityEvent.user_id == current_user.id
            ).order_by(SecurityEvent.timestamp.desc()).limit(100)
            res = await db.execute(stmt)
            history = list(res.scalars().all())
            
            alerts = detection_engine.analyze_event(event, history)
            detected_rules = []
            
            for alert in alerts:
                db.add(alert)
                detected_rules.append(alert.rule_id)
                
            if alerts:
                event.detection_rule = ",".join(detected_rules)
                db.add(event)
                await db.commit()
                
            results.append(EventIngestionResponse(
                event_id=event.id,
                status="processed",
                detected_rules=detected_rules
            ))
            processed += 1
        except Exception:
            failed += 1
            
    return BulkEventIngestionResponse(processed=processed, failed=failed, results=results)

@router.get("/events", response_model=PaginatedEventsResponse)
async def list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    severity: Optional[str] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(SecurityEvent).where(SecurityEvent.user_id == current_user.id)
    if severity and severity != "ALL":
        stmt = stmt.where(SecurityEvent.severity == severity)
    if category and category != "ALL":
        stmt = stmt.where(SecurityEvent.category == category)
        
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = await db.scalar(count_stmt)
    
    stmt = stmt.order_by(desc(SecurityEvent.timestamp)).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    items = result.scalars().all()
    
    return PaginatedEventsResponse(items=items, total=total, page=page, page_size=page_size)

@router.get("/events/{event_id}", response_model=SecurityEventResponse)
async def get_event(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(SecurityEvent).where(SecurityEvent.id == event_id, SecurityEvent.user_id == current_user.id)
    result = await db.execute(stmt)
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.get("/alerts", response_model=PaginatedAlertsResponse)
async def list_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(SecurityAlert).where(SecurityAlert.user_id == current_user.id)
    if severity and severity != "ALL":
        stmt = stmt.where(SecurityAlert.severity == severity)
    if status and status != "ALL":
        stmt = stmt.where(SecurityAlert.status == status)
        
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = await db.scalar(count_stmt)
    
    stmt = stmt.order_by(desc(SecurityAlert.timestamp)).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    items = result.scalars().all()
    
    return PaginatedAlertsResponse(items=items, total=total, page=page, page_size=page_size)

@router.get("/alerts/{alert_id}", response_model=SecurityAlertResponse)
async def get_alert(
    alert_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(SecurityAlert).where(SecurityAlert.id == alert_id, SecurityAlert.user_id == current_user.id)
    result = await db.execute(stmt)
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.patch("/alerts/{alert_id}", response_model=SecurityAlertResponse)
async def update_alert(
    alert_id: uuid.UUID,
    update_data: AlertStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(SecurityAlert).where(SecurityAlert.id == alert_id, SecurityAlert.user_id == current_user.id)
    result = await db.execute(stmt)
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.status = update_data.status
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert
