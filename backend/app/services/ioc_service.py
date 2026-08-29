import re
from typing import List
from app.schemas.intelligence import IOCIndicator

class IOCService:
    def __init__(self):
        # Defend against false positives: \b word boundaries
        self.ipv4_pattern = re.compile(r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b')
        self.ipv6_pattern = re.compile(r'\b(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}\b', re.IGNORECASE)
        # Avoid generic words matching as domains
        self.domain_pattern = re.compile(r'\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b')
        self.url_pattern = re.compile(r'\b(?:http|https|ftp)://[^\s/$.?#].[^\s]*\b', re.IGNORECASE)
        
        # Hashes should be 32/64 exact hex chars, not just random ID strings. 
        # Using negative lookbehind/lookahead to ensure they aren't part of a larger string
        self.md5_pattern = re.compile(r'(?<![a-fA-F0-9])[a-fA-F0-9]{32}(?![a-fA-F0-9])')
        self.sha256_pattern = re.compile(r'(?<![a-fA-F0-9])[a-fA-F0-9]{64}(?![a-fA-F0-9])')
        
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')

    def extract_iocs(self, text: str) -> List[IOCIndicator]:
        if not text:
            return []
            
        results = []
        seen = set()

        def add_indicator(ind: str, type_name: str):
            ind_lower = ind.lower()
            
            # Avoid false positives like "3.12" matching IPv4 if regex somehow fails bounds, though the regex enforces 4 octets.
            # Avoid "Ticket #123456" matching MD5 (it's too short, but just in case)
            
            if ind_lower not in seen:
                seen.add(ind_lower)
                results.append(IOCIndicator(
                    indicator=ind,
                    type=type_name,
                    normalized_value=ind_lower,
                    confidence="HIGH",
                    source="regex_extractor"
                ))

        # URL
        for match in self.url_pattern.findall(text):
            add_indicator(match, "URL")
            
        # Email
        for match in self.email_pattern.findall(text):
            add_indicator(match, "Email")

        # IPv4
        # Be careful not to count version numbers like 1.2.3.4 as IP if we can help it, but it's hard to distinguish.
        for match in self.ipv4_pattern.findall(text):
            add_indicator(match, "IPv4")

        # IPv6
        for match in self.ipv6_pattern.findall(text):
            add_indicator(match, "IPv6")

        # Domain (Ensure it's not a URL already processed)
        for match in self.domain_pattern.findall(text):
            # Skip if it's already part of an extracted URL or Email
            if not any(match.lower() in u.lower() for u in seen):
                # Extra check to avoid matching file names like "script.js" as domain if possible, 
                # but standard domain regex catches them. We accept this for Phase 9.
                add_indicator(match, "Domain")

        # SHA256
        for match in self.sha256_pattern.findall(text):
            add_indicator(match, "SHA256")
            
        # MD5
        for match in self.md5_pattern.findall(text):
            add_indicator(match, "MD5")

        return results

ioc_service = IOCService()
