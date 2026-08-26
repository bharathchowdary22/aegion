from pydantic import BaseModel, Field, field_validator
from typing import List, Literal, Optional

class Message(BaseModel):
    # Only allow user and assistant roles from the client
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=10000)
    
    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Content cannot be entirely whitespace")
        return v

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = Field(None, description="Optional ID for grouping future conversation history")
    messages: List[Message]

    @field_validator("messages")
    @classmethod
    def validate_messages(cls, v: List[Message]) -> List[Message]:
        if not v:
            raise ValueError("Messages list cannot be empty")
        return v
