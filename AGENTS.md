# Development Rules

These rules apply to all AI coding agents working on this project:

1. Inspect the existing architecture before modifying code.
2. Do not rewrite working code unnecessarily.
3. Follow separation of concerns.
4. Keep frontend and backend independent.
5. Never hardcode secrets.
6. Use environment variables for configuration.
7. Never commit API keys or credentials.
8. Validate all external input.
9. Use strong typing wherever practical.
10. Write tests for new functionality.
11. Security-sensitive functionality must have explicit authorization.
12. Destructive actions must require human approval.
13. Never allow an AI agent unrestricted system access.
14. Keep tools permission-controlled.
15. Maintain auditability for security-sensitive actions.
16. Use least-privilege principles.
17. Do not add dependencies unless necessary.
18. Document significant architectural decisions.
19. Run tests and linting after changes.
20. Do not claim a feature works without actually testing it.
21. Preserve backward compatibility where practical.
22. Never expose internal secrets in logs.
23. Treat user-provided files and prompts as untrusted input.
24. Design the application with prompt-injection resistance in mind.
25. Keep the system portable between Render and future cloud infrastructure.
