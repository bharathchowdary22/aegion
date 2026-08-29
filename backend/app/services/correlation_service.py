from typing import List, Tuple
from datetime import datetime, timedelta
from app.db.models import SecurityEvent, SecurityAlert
from app.schemas.intelligence import IOCIndicator

class CorrelationService:
    def __init__(self):
        # Time window for correlation: 24 hours
        self.CORRELATION_WINDOW_HOURS = 24

    def filter_by_window(self, target_time: datetime, events: List[SecurityEvent]) -> List[SecurityEvent]:
        """Filter events that fall within the 24 hour window before the target time."""
        window_start = target_time - timedelta(hours=self.CORRELATION_WINDOW_HOURS)
        return [e for e in events if window_start <= e.timestamp <= target_time]

    def correlate_event(self, event: SecurityEvent, history: List[SecurityEvent]) -> Tuple[List[SecurityEvent], str]:
        """Returns related events and a correlation summary/context."""
        related = []
        recent_history = self.filter_by_window(event.timestamp, history)

        for h in recent_history:
            if h.id == event.id:
                continue
            
            is_related = False
            # Correlate by IP
            if event.source_ip and h.source_ip == event.source_ip:
                is_related = True
            # Correlate by Username
            if event.username and h.username == event.username:
                is_related = True
                
            if is_related:
                related.append(h)

        context = f"Found {len(related)} related events within the last {self.CORRELATION_WINDOW_HOURS} hours."
        return related, context

    def calculate_risk_score(self, base_severity: str, event_volume: int, alert_volume: int, ioc_count: int) -> Tuple[int, str, str]:
        """
        Deterministic Risk Score Calculation.
        Severity Base: INFO=10, LOW=20, MEDIUM=40, HIGH=60, CRITICAL=80
        + Event Volume: up to +10 (1 point per event up to 10)
        + Alert Volume: up to +15 (5 points per related alert up to 3)
        + IOC Presence: +5 if any IOCs exist
        Max Score: 100
        
        Ranges:
        0–29    LOW
        30–59   MEDIUM
        60–79   HIGH
        80–100  CRITICAL
        """
        score = 0
        
        severity_map = {
            "INFO": 10,
            "LOW": 20,
            "MEDIUM": 40,
            "HIGH": 60,
            "CRITICAL": 80
        }
        score += severity_map.get(base_severity.upper(), 10)
        
        score += min(event_volume, 10)
        score += min(alert_volume * 5, 15)
        
        if ioc_count > 0:
            score += 5
            
        # Cap at 100
        score = min(score, 100)
        
        if score < 30:
            level = "LOW"
        elif score < 60:
            level = "MEDIUM"
        elif score < 80:
            level = "HIGH"
        else:
            level = "CRITICAL"
            
        evidence = f"Base severity {base_severity} ({severity_map.get(base_severity.upper(), 10)} pts) + {min(event_volume, 10)} pts for event volume + {min(alert_volume * 5, 15)} pts for alert volume"
        if ioc_count > 0:
            evidence += f" + 5 pts for IOC presence"
            
        return score, level, evidence

correlation_service = CorrelationService()
