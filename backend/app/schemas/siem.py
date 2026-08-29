from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Any, Dict
from datetime import datetime
from uuid import UUID

class SecurityEventCreate(BaseModel):
    source: str
    event_type: str
    severity: str
    category: str
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    hostname: Optional[str] = None
    username: Optional[str] = None
    message: Optional[str] = None
    raw_event: Optional[str] = None
    timestamp: Optional[datetime] = None

class SecurityEventResponse(BaseModel):
    id: UUID
    user_id: UUID
    timestamp: datetime
    source: str
    event_type: str
    severity: str
    category: str
    source_ip: Optional[str]
    destination_ip: Optional[str]
    hostname: Optional[str]
    username: Optional[str]
    message: Optional[str]
    raw_event: Optional[str]
    status: str
    detection_rule: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class SecurityAlertResponse(BaseModel):
    id: UUID
    user_id: UUID
    event_id: UUID
    rule_id: str
    title: str
    severity: str
    category: str
    description: Optional[str]
    timestamp: datetime
    status: str

    model_config = ConfigDict(from_attributes=True)

class AlertStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(OPEN|IN REVIEW|RESOLVED|FALSE POSITIVE)$")

class PaginatedEventsResponse(BaseModel):
    items: List[SecurityEventResponse]
    total: int
    page: int
    page_size: int

class PaginatedAlertsResponse(BaseModel):
    items: List[SecurityAlertResponse]
    total: int
    page: int
    page_size: int

class EventIngestionResponse(BaseModel):
    event_id: UUID
    status: str
    detected_rules: List[str]

class BulkEventIngestionResponse(BaseModel):
    processed: int
    failed: int
    results: List[EventIngestionResponse]
