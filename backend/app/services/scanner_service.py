import re
from typing import List
from pydantic import BaseModel

class SecurityFinding(BaseModel):
    id: str
    title: str
    severity: str
    category: str
    description: str
    location: str
    evidence: str
    confidence: str

class ScannerService:
    def scan_code(self, code: str) -> List[SecurityFinding]:
        findings = []
        
        # 1. Hardcoded Secret
        if re.search(r'(?i)(api[_-]?key|secret|password|token)\s*=\s*[\'"][a-zA-Z0-9_\-]{8,}[\'"]', code):
            findings.append(SecurityFinding(
                id="SEC-001",
                title="Potential Hardcoded Secret",
                severity="HIGH",
                category="Authentication/Secrets",
                description="Found a string that looks like a hardcoded secret or API key.",
                location="source_code",
                evidence="Hardcoded credential assignment detected",
                confidence="MEDIUM"
            ))
            
        # 2. SQL Injection
        if re.search(r'(?i)SELECT\s+.*FROM\s+.*[\'"]\s*\+\s*[a-zA-Z0-9_]+', code) or \
           re.search(r'(?i)SELECT\s+.*FROM\s+.*%\s*[a-zA-Z0-9_]+', code) or \
           re.search(r'(?i)f[\'"]SELECT\s+.*FROM\s+.*\{.*\}', code):
            findings.append(SecurityFinding(
                id="SEC-002",
                title="Potential SQL Injection",
                severity="CRITICAL",
                category="Injection",
                description="String concatenation or interpolation used in SQL queries.",
                location="source_code",
                evidence="Unsafe SQL string formatting detected",
                confidence="HIGH"
            ))
            
        # 3. Command Injection
        if re.search(r'(?i)(os\.system|subprocess\.Popen|subprocess\.call|eval|exec)\s*\(', code):
            findings.append(SecurityFinding(
                id="SEC-003",
                title="Potential Command Injection",
                severity="HIGH",
                category="Injection",
                description="Use of system command execution which may be unsafe.",
                location="source_code",
                evidence="OS command execution or eval detected",
                confidence="MEDIUM"
            ))
            
        # 4. Insecure CORS
        if re.search(r'(?i)allow_origins\s*=\s*\[\s*[\'"]\*[\'"]\s*\]', code):
            findings.append(SecurityFinding(
                id="SEC-004",
                title="Insecure CORS Configuration",
                severity="MEDIUM",
                category="Configuration",
                description="CORS is configured to allow all origins (\'*\').",
                location="source_code",
                evidence="allow_origins=[\'*\']",
                confidence="HIGH"
            ))

        return findings

scanner_service = ScannerService()
