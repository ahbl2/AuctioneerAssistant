# Port Configuration Rule

## API and Frontend Must Run on Same Port

**Rule**: The API server and frontend development server MUST run on the same port (5000) unless there is a specific technical requirement that prevents this.

### Rationale
- Simplifies development and deployment
- Eliminates proxy configuration complexity
- Reduces port conflicts and confusion
- Makes the system easier to understand and maintain

### Implementation
- API server: `http://localhost:5000`
- Frontend server: `http://localhost:5000` (served by the API server)
- No Vite proxy configuration needed
- All requests go directly to the same server

### Exceptions
Only deviate from this rule if:
1. There's a specific technical limitation that prevents same-port operation
2. The user explicitly requests a different configuration
3. There's a documented architectural reason

### Current Configuration
- `server/index.ts`: `const port = parseInt(process.env.PORT || '5000', 10);`
- `vite.config.ts`: No proxy configuration, port 5000
- Both services run on port 5000
