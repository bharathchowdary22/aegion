# API Design

**Note: These endpoints represent future architectural plans and are not implemented in Phase 0.**

## Planned Endpoints

### Authentication
* `POST /api/v1/auth/login`
* `POST /api/v1/auth/logout`
* `POST /api/v1/auth/refresh`

### Chat & Messaging
* `GET /api/v1/chat/conversations`
* `POST /api/v1/chat/conversations`
* `GET /api/v1/chat/conversations/{id}`
* `GET /api/v1/chat/conversations/{id}/messages`
* `POST /api/v1/chat` (Phase 1 Implemented)

#### Aegion SSE Stream Protocol
The `POST /api/v1/chat` endpoint returns a `text/event-stream` response. Aegion normalizes all AI provider responses into this documented contract.

**1. Message Event**
```text
event: message
data: {"type": "message", "content": "Hello", "request_id": "123"}
```

**2. Done Event**
```text
event: done
data: {"type": "done", "request_id": "123"}
```

**3. Error Event**
```text
event: error
data: {"type": "error", "code": "PROVIDER_ERROR", "message": "The AI provider is temporarily unavailable.", "request_id": "123"}
```

*(Note: Future events like `tool_start`, `tool_result`, `agent_start`, `agent_result`, and `citation` are planned but not yet implemented.)*

### File Management & Knowledge
* `POST /api/v1/files/upload`
* `GET /api/v1/files/{id}`
* `POST /api/v1/knowledge/ingest`
* `GET /api/v1/knowledge/search`

### Memory
* `GET /api/v1/memory/entities`
* `POST /api/v1/memory/entities`

### Tools & Agents
* `GET /api/v1/tools`
* `GET /api/v1/agents`
* `POST /api/v1/agents/{id}/invoke`

### Security & GRC
* `GET /api/v1/security/incidents`
* `POST /api/v1/security/analyze`
* `GET /api/v1/grc/policies`
