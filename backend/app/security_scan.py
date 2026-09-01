import sys
import argparse
import os
import json
from app.services.scanner_service import scanner_service

def scan_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        findings = scanner_service.scan_code(content)
        # enrich with location
        for finding in findings:
            finding.location = filepath
        return findings
    except Exception as e:
        print(f"Error scanning {filepath}: {e}", file=sys.stderr)
        return []

def main():
    parser = argparse.ArgumentParser(description="AEGION Security Scanner CI Integration")
    parser.add_argument("target", help="File or directory to scan")
    parser.add_argument("--format", choices=["json", "text"], default="text", help="Output format")
    args = parser.parse_args()
    
    target = args.target
    all_findings = []
    
    if os.path.isfile(target):
        all_findings.extend(scan_file(target))
    elif os.path.isdir(target):
        for root, _, files in os.walk(target):
            # Safe skip list
            if any(ignored in root for ignored in ['.git', 'node_modules', '.venv', '__pycache__', '.next', 'tests', 'test']):
                continue
            for file in files:
                if file.endswith(('.py', '.ts', '.tsx', '.json', '.js', '.yml', '.yaml')):
                    # Skip the scanner itself to avoid self-detection
                    if file in ('security_scan.py', 'scanner_service.py'):
                        continue
                    filepath = os.path.join(root, file)
                    all_findings.extend(scan_file(filepath))
    else:
        print(f"Target '{target}' not found.", file=sys.stderr)
        sys.exit(1)
                    
    # Policy evaluation
    counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}
    failed_policy = False
    
    for f in all_findings:
        if f.severity in counts:
            counts[f.severity] += 1
        if f.severity in ["CRITICAL", "HIGH"]:
            failed_policy = True
            
    if args.format == "json":
        report = {
            "total_findings": len(all_findings),
            "counts": counts,
            "failed_policy": failed_policy,
            "findings": [f.model_dump() for f in all_findings]
        }
        print(json.dumps(report, indent=2))
    else:
        print(f"AEGION Security Scan Report")
        print(f"===========================")
        print(f"Total Findings: {len(all_findings)}")
        print(f"CRITICAL: {counts['CRITICAL']}")
        print(f"HIGH: {counts['HIGH']}")
        print(f"MEDIUM: {counts['MEDIUM']}")
        print(f"LOW: {counts['LOW']}")
        print(f"INFO: {counts['INFO']}")
        print(f"===========================\n")
        
        for f in all_findings:
            print(f"[{f.severity}] {f.title}")
            print(f"  Location: {f.location}")
            print(f"  Category: {f.category}")
            print(f"  Evidence: {f.evidence}")
            print()
            
    if failed_policy:
        print("CI Policy Failed: CRITICAL or HIGH vulnerabilities detected.", file=sys.stderr)
        sys.exit(1)
    else:
        print("CI Policy Passed.", file=sys.stderr)
        sys.exit(0)

if __name__ == "__main__":
    main()
