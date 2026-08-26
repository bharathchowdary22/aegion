from pydantic import BaseModel, UUID4, Field
from typing import List, Optional
from datetime import datetime

class MessageResponse(BaseModel):
    id: UUID4
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: UUID4
    title: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ConversationDetailResponse(ConversationResponse):
    messages: List[MessageResponse]

class CreateConversationRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=100)
