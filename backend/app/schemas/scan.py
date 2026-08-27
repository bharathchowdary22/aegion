from pydantic import BaseModel, Field

class ScanRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=50000, description="Source code or configuration content to scan.")
