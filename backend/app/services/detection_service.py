import uuid
from typing import List, Dict, Optional, Any
from app.db.models import SecurityEvent, SecurityAlert

class DetectionRule:
    rule_id: str
    name: str
    category: str
    severity: str
    description: str

    def evaluate(self, event: SecurityEvent, history: List[SecurityEvent]) -> Optional[SecurityAlert]:
        raise NotImplementedError()

class BruteForceDetectionRule(DetectionRule):
    rule_id = "AEG-001"
    name = "Brute Force Authentication"
    category = "Authentication"
    severity = "HIGH"
    description = "Multiple failed authentication attempts from the same source within a short time window."

    def evaluate(self, event: SecurityEvent, history: List[SecurityEvent]) -> Optional[SecurityAlert]:
        if event.event_type != "login_failed":
            return None
        
        # Consider event and history
        failed_count = 1 # current event
        for h in history:
            if h.event_type == "login_failed" and h.source_ip == event.source_ip:
                failed_count += 1
                
        if failed_count >= 5:
            return SecurityAlert(
                id=uuid.uuid4(),
                user_id=event.user_id,
                event_id=event.id,
                rule_id=self.rule_id,
                title=self.name,
                severity=self.severity,
                category=self.category,
                description=f"{failed_count} failed login attempts from IP {event.source_ip}",
                status="OPEN"
            )
        return None

class SQLInjectionRule(DetectionRule):
    rule_id = "AEG-002"
    name = "SQL Injection Indicator"
    category = "Injection"
    severity = "CRITICAL"
    description = "Detected common SQL injection patterns in event payload."

    def evaluate(self, event: SecurityEvent, history: List[SecurityEvent]) -> Optional[SecurityAlert]:
        payload = event.raw_event or event.message or ""
        payload = payload.lower()
        
        indicators = ["' or 1=1", "union select", "drop table", "--;"]
        if any(ind in payload for ind in indicators):
            return SecurityAlert(
                id=uuid.uuid4(),
                user_id=event.user_id,
                event_id=event.id,
                rule_id=self.rule_id,
                title=self.name,
                severity=self.severity,
                category=self.category,
                description=f"SQL Injection pattern detected from {event.source_ip or 'unknown source'}",
                status="OPEN"
            )
        return None

class CommandInjectionRule(DetectionRule):
    rule_id = "AEG-003"
    name = "Command Injection Indicator"
    category = "Injection"
    severity = "CRITICAL"
    description = "Detected common shell metacharacters indicating command injection."

    def evaluate(self, event: SecurityEvent, history: List[SecurityEvent]) -> Optional[SecurityAlert]:
        payload = event.raw_event or event.message or ""
        
        # very basic signature for synthetic testing
        indicators = ["; cat /etc/passwd", "| /bin/sh", "$(whoami)", "`whoami`", "curl http"]
        if any(ind in payload for ind in indicators):
            return SecurityAlert(
                id=uuid.uuid4(),
                user_id=event.user_id,
                event_id=event.id,
                rule_id=self.rule_id,
                title=self.name,
                severity=self.severity,
                category=self.category,
                description=f"Command Injection pattern detected.",
                status="OPEN"
            )
        return None

class PrivilegeEscalationRule(DetectionRule):
    rule_id = "AEG-004"
    name = "Suspicious Privilege Escalation"
    category = "Access Control"
    severity = "HIGH"
    description = "Unexpected or unauthorized privilege changes detected."

    def evaluate(self, event: SecurityEvent, history: List[SecurityEvent]) -> Optional[SecurityAlert]:
        if event.event_type == "privilege_escalation" or "granted admin" in (event.message or "").lower():
            return SecurityAlert(
                id=uuid.uuid4(),
                user_id=event.user_id,
                event_id=event.id,
                rule_id=self.rule_id,
                title=self.name,
                severity=self.severity,
                category=self.category,
                description=f"Privilege escalation detected for user {event.username or 'unknown'}.",
                status="OPEN"
            )
        return None

class UnauthorizedAccessRule(DetectionRule):
    rule_id = "AEG-005"
    name = "Repeated Unauthorized Access"
    category = "Access Control"
    severity = "MEDIUM"
    description = "Multiple authorization failures indicating potential enumeration or unauthorized access."

    def evaluate(self, event: SecurityEvent, history: List[SecurityEvent]) -> Optional[SecurityAlert]:
        if event.event_type != "unauthorized_access":
            return None
            
        fail_count = 1
        for h in history:
            if h.event_type == "unauthorized_access" and h.username == event.username:
                fail_count += 1
                
        if fail_count >= 3:
            return SecurityAlert(
                id=uuid.uuid4(),
                user_id=event.user_id,
                event_id=event.id,
                rule_id=self.rule_id,
                title=self.name,
                severity=self.severity,
                category=self.category,
                description=f"{fail_count} unauthorized access attempts for user {event.username or 'unknown'}.",
                status="OPEN"
            )
        return None

class DeterministicDetectionEngine:
    def __init__(self):
        self.rules: List[DetectionRule] = [
            BruteForceDetectionRule(),
            SQLInjectionRule(),
            CommandInjectionRule(),
            PrivilegeEscalationRule(),
            UnauthorizedAccessRule(),
        ]

    def analyze_event(self, event: SecurityEvent, history: List[SecurityEvent]) -> List[SecurityAlert]:
        alerts = []
        for rule in self.rules:
            try:
                alert = rule.evaluate(event, history)
                if alert:
                    alerts.append(alert)
            except Exception as e:
                # Log safely in real app, ignore here
                pass
        return alerts

detection_engine = DeterministicDetectionEngine()
