import json
import uuid
from typing import AsyncGenerator
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.schemas.chat import ChatRequest
from app.services.ai_service import ai_service
from app.core.logging import logger
from app.api.deps import get_current_user
from app.db.session import get_db
from app.db.models import User, Conversation, Message

router = APIRouter()

async def get_or_create_conversation(db: AsyncSession, user_id: uuid.UUID, conversation_id: uuid.UUID | None, first_message: str) -> uuid.UUID:
    if conversation_id:
        stmt = select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == user_id)
        result = await db.execute(stmt)
        conv = result.scalar_one_or_none()
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        return conversation_id
    
    # Create new conversation
    title = first_message[:40] + ("..." if len(first_message) > 40 else "")
    new_conv = Conversation(user_id=user_id, title=title)
    db.add(new_conv)
    await db.commit()
    await db.refresh(new_conv)
    return new_conv.id

@router.post("")
async def chat_endpoint(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Log metadata, NOT the full content of messages
    logger.info(f"Received chat request containing {len(request.messages)} messages for user {current_user.id}")
    
    # 1. Enforce IDOR and resolve conversation
    conv_uuid = None
    if request.conversation_id:
        try:
            conv_uuid = uuid.UUID(request.conversation_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid conversation_id format")

    conv_id = await get_or_create_conversation(db, current_user.id, conv_uuid, request.messages[0].content if request.messages else "New Chat")
    
    # 2. Persist user message
    last_user_msg = request.messages[-1]
    db_msg = Message(
        conversation_id=conv_id,
        role=last_user_msg.role,
        content=last_user_msg.content
    )
    db.add(db_msg)
    await db.commit()

    # 3. Generator for streaming & saving assistant response
    async def stream_and_save() -> AsyncGenerator[str, None]:
        accumulated_content = ""
        has_error = False

        try:
            async for sse_chunk in ai_service.stream_chat(request.messages):
                yield sse_chunk
                
                if "event: message" in sse_chunk:
                    try:
                        data_part = sse_chunk.split("data: ")[1].strip()
                        payload = json.loads(data_part)
                        if payload.get("type") == "message" and "content" in payload:
                            accumulated_content += payload["content"]
                    except Exception as e:
                        logger.error(f"Error parsing SSE chunk for accumulation: {e}")
                elif "event: error" in sse_chunk:
                    has_error = True
                    
        except Exception as e:
            has_error = True
            logger.error(f"Stream interrupted: {e}")
            raise
        finally:
            if not has_error and accumulated_content:
                try:
                    assistant_msg = Message(
                        conversation_id=conv_id,
                        role="assistant",
                        content=accumulated_content
                    )
                    db.add(assistant_msg)
                    await db.commit()
                except Exception as e:
                    logger.error(f"Failed to persist assistant message: {e}")
            
            # Send conversation id to the client as an event if it was newly created or resolved
            if not has_error:
                conv_payload = json.dumps({"type": "conversation_id", "conversation_id": str(conv_id)})
                yield f"event: message\ndata: {conv_payload}\n\n"

    return StreamingResponse(
        stream_and_save(),
        media_type="text/event-stream"
    )

@router.get("/health")
async def health_check():
    return {"status": "ok"}
