from typing import Dict, Any

class ThreatIntelResult:
    def __init__(self, indicator: str, match: bool, source: str, confidence: str, tags: list, description: str):
        self.indicator = indicator
        self.match = match
        self.source = source
        self.confidence = confidence
        self.tags = tags
        self.description = description
        
    def dict(self) -> Dict[str, Any]:
        return {
            "indicator": self.indicator,
            "match": self.match,
            "source": self.source,
            "confidence": self.confidence,
            "tags": self.tags,
            "description": self.description
        }

class ThreatIntelProvider:
    def lookup_indicator(self, indicator: str, indicator_type: str) -> ThreatIntelResult:
        raise NotImplementedError()

class LocalThreatIntelProvider(ThreatIntelProvider):
    def __init__(self):
        # A static list of known indicators for testing purposes
        self.known_bad_ips = {"192.168.1.100", "203.0.113.5", "203.0.113.6"}
        self.known_bad_domains = {"malicious-test.example.com"}

    def lookup_indicator(self, indicator: str, indicator_type: str) -> ThreatIntelResult:
        indicator_lower = indicator.lower()
        
        if indicator_type == "IPv4" and indicator_lower in self.known_bad_ips:
            return ThreatIntelResult(
                indicator=indicator,
                match=True,
                source="Local Threat Intelligence",
                confidence="HIGH",
                tags=["scanner_test", "synthetic"],
                description="Known test indicator for synthetic attacks."
            )
            
        if indicator_type == "Domain" and indicator_lower in self.known_bad_domains:
            return ThreatIntelResult(
                indicator=indicator,
                match=True,
                source="Local Threat Intelligence",
                confidence="HIGH",
                tags=["malware_c2_test"],
                description="Known test indicator for malicious domain."
            )
            
        return ThreatIntelResult(
            indicator=indicator,
            match=False,
            source="Local Threat Intelligence",
            confidence="NONE",
            tags=[],
            description="External threat intelligence unavailable. No local match found."
        )

threat_intel_service = LocalThreatIntelProvider()
