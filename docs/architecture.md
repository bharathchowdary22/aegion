# Architecture

## High-level architecture

```mermaid
flowchart TD
    U[User] -->|Interacts| F[Next.js Frontend]
    F -->|API Calls| B[FastAPI Backend]
    B -->|Orchestrates| O[AI Orchestrator]
    O -->|Generates| M[Model]
    O -->|Retrieves/Acts| T[Tools / RAG / Memory]
    B -->|Persists Data| P[PostgreSQL]
    B -->|Caches Data| R[Redis]
```

## Future AI architecture

**IMPLEMENTED IN PHASE 2**

* AI orchestrator (Basic service layer)
* Model integration (OpenAI streaming)
* Authentication (Supabase Auth & JWKS validation)
* PostgreSQL Persistence (SQLAlchemy & Alembic)
* User & Conversation identity isolation (IDOR protection)

**FUTURE COMPONENTS - NOT IMPLEMENTED YET**

* Model router (Multi-provider)
* Memory
* RAG
* Tool system
* Agent system
* Security/guardrails
* Audit logging

## Future cybersecurity architecture

**FUTURE COMPONENTS - NOT IMPLEMENTED IN PHASE 0**

* Security Agent
* SOC Agent
* Threat Intelligence Agent
* GRC Agent
* DevSecOps Agent
* Cloud Security Agent
