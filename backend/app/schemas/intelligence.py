from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class SecurityIntelligenceBase(BaseModel):
    source_type: str
    source_id: str
    risk_score: Optional[int] = None
    confidence: Optional[str] = None
    summary: Optional[str] = None
    evidence: Optional[str] = None
    indicators: Optional[str] = None
    related_events: Optional[str] = None
    related_alerts: Optional[str] = None
    recommended_actions: Optional[str] = None

class SecurityIntelligenceCreate(SecurityIntelligenceBase):
    pass

class SecurityIntelligenceResponse(SecurityIntelligenceBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class IOCExtractionRequest(BaseModel):
    text: str

class IOCIndicator(BaseModel):
    indicator: str
    type: str
    normalized_value: str
    confidence: str
    source: str
