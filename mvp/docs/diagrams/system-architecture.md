# System Architecture Diagram

```mermaid
graph TB
    Browser[Browser<br/>HTMX + Alpine.js] --> Nginx[Nginx<br/>TLS Termination]
    Nginx --> FastAPI[FastAPI App<br/>Uvicorn]
    
    subgraph FastAPI[FastAPI Application]
        API[API Routes<br/>/api/v1/*]
        Services[Services<br/>Business Logic]
        Workers[ARQ Workers<br/>Background Jobs]
        Templates[Jinja2 Templates<br/>Server-rendered HTML]
    end
    
    FastAPI --> PostgreSQL[(PostgreSQL 16)]
    FastAPI --> Redis[(Redis 7<br/>Sessions + Queue)]
    
    Workers --> GitHub[GitHub API]
    Workers --> Notion[Notion API]
    Workers --> SMTP[SMTP<br/>Email]
    
    style Browser fill:#e1f5fe
    style Nginx fill:#fff3e0
    style FastAPI fill:#e8f5e9
    style PostgreSQL fill:#fce4ec
    style Redis fill:#fce4ec
    style GitHub fill:#f3e5f5
    style Notion fill:#f3e5f5
    style SMTP fill:#f3e5f5
```

## Component Descriptions

| Component | Role | Technology |
|---|---|---|
| Browser | User interface | HTML + HTMX + Alpine.js + Tailwind CSS |
| Nginx | Reverse proxy, TLS termination, static file serving | Nginx 1.24+ |
| FastAPI App | API server, template rendering, business logic | Python 3.12+ / FastAPI |
| PostgreSQL | Primary data store | PostgreSQL 16 |
| Redis | Session cache, job queue | Redis 7 |
| ARQ Workers | Background provisioning/deprovisioning | Python ARQ |
| GitHub API | External integration | REST API |
| Notion API | External integration | REST API |
| SMTP | Email sending | External mail provider |
