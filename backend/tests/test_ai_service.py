import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from app.services.ai_service import AIService
from app.schemas.chat import Message
import json
import openai

@pytest.fixture
def mock_messages():
    return [Message(role="user", content="Hello")]

@pytest.mark.asyncio
async def test_stream_chat_normal(mocker, mock_messages):
    mock_client = AsyncMock()
    mock_stream = AsyncMock()
    
    # Create chunks to yield
    chunk1 = MagicMock()
    chunk1.choices = [MagicMock()]
    chunk1.choices[0].delta.content = "Hel"
    
    chunk2 = MagicMock()
    chunk2.choices = [MagicMock()]
    chunk2.choices[0].delta.content = "lo!"
    
    async def mock_generator():
        yield chunk1
        yield chunk2
        
    mock_client.chat.completions.create.return_value = mock_generator()
    
    service = AIService()
    service.client = mock_client
    
    results = []
    async for item in service.stream_chat(mock_messages):
        results.append(item)
        
    assert len(results) == 3 # 2 messages + 1 done
    assert "event: message" in results[0]
    assert "event: message" in results[1]
    assert "event: done" in results[2]
    
    data1 = json.loads(results[0].split("data: ")[1])
    assert data1["type"] == "message"
    assert data1["content"] == "Hel"

@pytest.mark.asyncio
async def test_stream_chat_partial_error(mocker, mock_messages):
    mock_client = AsyncMock()
    
    chunk1 = MagicMock()
    chunk1.choices = [MagicMock()]
    chunk1.choices[0].delta.content = "Hel"
    
    async def mock_generator():
        yield chunk1
        raise openai.APIConnectionError(request=MagicMock())
        
    mock_client.chat.completions.create.return_value = mock_generator()
    
    service = AIService()
    service.client = mock_client
    
    results = []
    async for item in service.stream_chat(mock_messages):
        results.append(item)
        
    assert len(results) == 2 # 1 message + 1 error
    assert "event: message" in results[0]
    assert "event: error" in results[1]
    
    err_data = json.loads(results[1].split("data: ")[1])
    assert err_data["type"] == "error"
    assert err_data["code"] == "NETWORK_ERROR"

@pytest.mark.asyncio
async def test_stream_chat_cancellation(mocker, mock_messages):
    mock_client = AsyncMock()
    
    chunk1 = MagicMock()
    chunk1.choices = [MagicMock()]
    chunk1.choices[0].delta.content = "Hel"
    
    async def mock_generator():
        yield chunk1
        raise asyncio.CancelledError()
        
    mock_client.chat.completions.create.return_value = mock_generator()
    
    service = AIService()
    service.client = mock_client
    
    results = []
    with pytest.raises(asyncio.CancelledError):
        async for item in service.stream_chat(mock_messages):
            results.append(item)
            
    assert len(results) == 1
    assert "event: message" in results[0]
