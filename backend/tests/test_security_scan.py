import subprocess
import json
import os
import pytest
import sys

def test_security_scan_clean(tmp_path):
    safe_file = tmp_path / "safe.py"
    safe_file.write_text("print('hello world')")
    
    result = subprocess.run(
        [sys.executable, "-m", "app.security_scan", str(tmp_path), "--format", "json"],
        capture_output=True,
        text=True
    )
    
    assert result.returncode == 0
    report = json.loads(result.stdout)
    assert report["total_findings"] == 0
    assert report["failed_policy"] is False

def test_security_scan_critical(tmp_path):
    vuln_file = tmp_path / "vuln.py"
    vuln_file.write_text("query = 'SELECT * FROM users WHERE username = \\'' + username + '\\''")
    
    result = subprocess.run(
        [sys.executable, "-m", "app.security_scan", str(tmp_path), "--format", "json"],
        capture_output=True,
        text=True
    )
    
    assert result.returncode == 1
    report = json.loads(result.stdout)
    assert report["total_findings"] == 1
    assert report["counts"]["CRITICAL"] == 1
    assert report["failed_policy"] is True

def test_security_scan_medium(tmp_path):
    vuln_file = tmp_path / "medium_vuln.py"
    vuln_file.write_text("allow_origins=['*']")
    
    result = subprocess.run(
        [sys.executable, "-m", "app.security_scan", str(tmp_path), "--format", "json"],
        capture_output=True,
        text=True
    )
    
    assert result.returncode == 0
    report = json.loads(result.stdout)
    assert report["total_findings"] == 1
    assert report["counts"]["MEDIUM"] == 1
    assert report["failed_policy"] is False
