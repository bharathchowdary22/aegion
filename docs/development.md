# Development Guide

## Prerequisites

* Docker
* Docker Compose
* Git
* Node.js 20+ (for frontend)
* Python 3.11+ (for backend)

## Local Development Approach

Aegion uses Docker Compose to provide a consistent local development environment. The frontend, backend, PostgreSQL database, and Redis cache will run in separate containers.

## Environment Variables

Copy `.env.example` to `.env` in the root directory. This file is ignored by Git to prevent secrets from being committed. Fill out the necessary environment variables. The `.env.example` file contains placeholders and documents which variables are expected by the system.

## Git Workflow

* Use feature branches for new development (`feature/feature-name`).
* Use bugfix branches for fixes (`bugfix/bug-name`).
* Commit messages should be clear and descriptive.
* Never commit secrets or API keys. Check your changes carefully before pushing.

## Testing Strategy

* **Frontend**: Unit testing via Jest/React Testing Library, E2E testing (TBD).
* **Backend**: Unit and integration testing via pytest.
* **CI/CD**: GitHub actions will run linting, static analysis, and automated tests on all pull requests.

## Docker Usage

To start the local environment:

```bash
docker-compose up -d
```

To view logs for all services:

```bash
docker-compose logs -f
```

To stop services:

```bash
docker-compose down
```
