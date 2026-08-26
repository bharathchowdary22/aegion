# AEGION

AI-Powered Cybersecurity & DevSecOps Platform

**Status: Frozen at Phase 2**

AEGION
══════════════════════════════════
* Phase 0      ✅ COMPLETE (Foundation)
* Phase 1      ✅ COMPLETE (Basic AI Core)
* Phase 1.5    ✅ COMPLETE (Hardening)
* Phase 2      🟢 IMPLEMENTATION COMPLETE / 🟡 RUNTIME VERIFICATION PENDING
* Phase 3      ⏸️ FROZEN

## Project Vision

Aegion is an AI-powered cybersecurity and DevSecOps platform inspired by modern AI assistants. The goal is to provide a production-quality AI platform rather than a simple chatbot or API wrapper, featuring general conversational AI, long-term memory, RAG-based document intelligence, and multi-agent orchestration for specialized cybersecurity tasks.

## Planned Features

* General conversational AI
* Context-aware conversations
* Long-term/project memory
* RAG-based document intelligence
* Code analysis and generation
* Cybersecurity analysis
* Vulnerability analysis
* SOC investigation assistance
* Threat intelligence assistance
* Cloud security assistance
* DevSecOps assistance
* GRC/compliance assistance
* Tool calling
* Specialized AI agents
* Multi-agent orchestration
* Human approval for sensitive actions
* Secure automation
* Observability and audit logging

## Local Development (Frozen at Phase 2)

### Prerequisites
* Docker
* Docker Compose
* Git
* Node.js 20+ (for frontend)
* Python 3.11+ (for backend)

### Setup
1. **Clone the repository**: `git clone <repository_url>`
2. **Environment Configuration**: Copy `.env.example` to `.env` and fill in the required placeholders (no real secrets needed yet).
3. **Start the environment**: Run `docker-compose up -d --build` to start all services.
4. **Access the application**: 
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000/api/v1/chat/health](http://localhost:8000/api/v1/chat/health)

## Architecture

See `docs/architecture.md` for a detailed breakdown of the components.

## Development Guidelines

Please refer to `AGENTS.md` and `docs/development.md` for coding standards and workflow rules.

## Security

Please refer to `docs/security.md` for security principles and guidelines.
