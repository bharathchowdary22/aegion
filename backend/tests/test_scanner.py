from app.services.scanner_service import scanner_service

def test_scanner_detects_secrets():
    code = "api_key = 'AKIAIOSFODNN7EXAMPLE'"
    findings = scanner_service.scan_code(code)
    assert len(findings) == 1
    assert findings[0].severity == "HIGH"
    assert "Secret" in findings[0].title

def test_scanner_detects_sql_injection():
    code = "query = 'SELECT * FROM users WHERE username = \\'' + username + '\\''"
    findings = scanner_service.scan_code(code)
    assert len(findings) == 1
    assert findings[0].severity == "CRITICAL"
    assert "SQL" in findings[0].title

def test_scanner_detects_command_injection():
    code = "import os\nos.system('rm -rf /')"
    findings = scanner_service.scan_code(code)
    assert len(findings) == 1
    assert findings[0].severity == "HIGH"
    assert "Command" in findings[0].title

def test_scanner_detects_insecure_cors():
    code = "allow_origins=['*']"
    findings = scanner_service.scan_code(code)
    assert len(findings) == 1
    assert findings[0].severity == "MEDIUM"
    assert "CORS" in findings[0].title

def test_scanner_safe_code():
    code = "print('hello world')"
    findings = scanner_service.scan_code(code)
    assert len(findings) == 0
