import logging
import sys
import contextvars

# Context variable to store the request ID for the current request
request_id_ctx_var: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="-")

import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        token = request_id_ctx_var.set(request_id)
        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            request_id_ctx_var.reset(token)

class RequestIdFilter(logging.Filter):
    """Adds the request_id to the log record."""
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx_var.get()
        return True

def setup_logging():
    logger = logging.getLogger("aegion")
    logger.setLevel(logging.INFO)
    
    # Check if handler already exists to avoid duplicate logs in dev
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [req_id=%(request_id)s] - %(message)s'
        )
        handler.setFormatter(formatter)
        handler.addFilter(RequestIdFilter())
        logger.addHandler(handler)
        
    # Apply filter to uvicorn loggers as well
    for log_name in ["uvicorn", "uvicorn.error", "uvicorn.access"]:
        uv_logger = logging.getLogger(log_name)
        has_filter = any(isinstance(f, RequestIdFilter) for f in uv_logger.filters)
        if not has_filter:
            uv_logger.addFilter(RequestIdFilter())

    return logger

logger = setup_logging()
