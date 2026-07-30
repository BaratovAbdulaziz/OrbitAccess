# Coding Standards

## 1. Overview

Defines coding standards, style guidelines, and conventions for all Python code in the SMB Access Manager project.

## 2. Purpose

Ensure consistent, readable, maintainable code across the entire codebase regardless of which developer writes it.

## 3. Functional Requirements

*Covered in `03-functional-requirements.md`.*

## 4. Non-functional Requirements

- All Python code must pass `ruff check` with no errors
- All code must be formatted with `ruff format`
- Type hints required for all function signatures

## 5. Technical Design

### Python Style

- Follow PEP 8 with `ruff` defaults
- Line length: 88 characters (ruff default)
- Indentation: 4 spaces
- Quotes: double quotes for strings (`"`)

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Variables | snake_case | `employee_count` |
| Functions | snake_case | `get_employee_by_id()` |
| Classes | PascalCase | `EmployeeService` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_ATTEMPTS` |
| Private members | `_` prefix | `_validate_email()` |
| Protected members | `_` prefix | `_session` |
| Modules | snake_case | `activity_log.py` |
| Type vars | PascalCase | `ModelT` |
| Enum members | UPPER_SNAKE_CASE | `Status.ACTIVE` |

### Imports

Ordered by:
1. Standard library
2. Third-party libraries
3. Local application

Each group separated by a blank line. Use absolute imports only.

```python
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import select

from app.db.models.employee import Employee
from app.services.employee import EmployeeService
```

### Type Hints

- Required for all function parameters and return types
- Use `Optional[X]` or `X | None` (Python 3.10+)
- Use `list[X]` over `List[X]` (Python 3.9+)
- Use `dict[K, V]` over `Dict[K, V]` (Python 3.9+)
- Use `Self` return type for class methods returning `self`

```python
def create_employee(
    self,
    organization_id: uuid.UUID,
    email: str,
    display_name: str,
    role_id: uuid.UUID | None = None,
) -> Employee:
    ...
```

### Docstrings

- Use Google-style docstrings for public functions and classes
- One-line docstrings for simple functions
- Include `Args:` and `Returns:` sections for complex functions
- Skip obvious docstrings (e.g., simple property getters)

```python
def calculate_provisioning_status(
    integration_statuses: list[IntegrationStatus],
) -> ProvisioningState:
    """Determine overall provisioning state from per-integration statuses.

    Args:
        integration_statuses: List of per-integration provisioning states.

    Returns:
        The aggregate provisioning state for the employee.
    """
```

### Async/Await

- Use `async def` for all route handlers and service methods that perform I/O
- Use `async with` for database sessions and HTTP clients
- Do not mix sync and async code in the same function
- CPU-bound operations should use `run_in_executor` or be extracted to sync functions

### Error Handling

- Raise domain-specific exceptions from service layer
- Catch and handle exceptions at the API layer
- Do not catch `Exception` broadly — catch specific exceptions
- Use `try/except/finally` for resource cleanup

```python
class EmployeeNotFoundError(Exception):
    def __init__(self, employee_id: uuid.UUID):
        self.employee_id = employee_id
        super().__init__(f"Employee {employee_id} not found")
```

### Logging

- Use the `loguru` or standard `logging` module
- Log at appropriate levels: DEBUG (development), INFO (normal ops), WARNING (unexpected), ERROR (failure)
- Include context in log messages (organization_id, employee_id, etc.)

### Database Queries

- Use SQLAlchemy ORM for standard CRUD
- Use raw SQL via `text()` only for complex queries or performance-critical paths
- Always use parameterized queries (no string formatting)

### Testing

- Test function names: `test_<function_name>_<scenario>`
- Use descriptive test names that explain the scenario and expected outcome
- One assertion per test where possible
- Use fixtures for setup, factories for data

```python
async def test_create_employee_creates_provisioning_job():
    """Adding an employee with a role should enqueue a provisioning job."""
```

### Configuration

- All configuration via environment variables using `pydantic-settings`
- No hardcoded configuration values
- Use `.env` for local development, environment variables in production

### Security

- Never log sensitive data (passwords, tokens, secrets)
- Never return sensitive data in API responses
- Always validate input with Pydantic models
- Always use parameterized queries

## 6. Data Model

No changes.

## 7. API Changes

No changes.

## 8. UI Changes

No changes.

## 9. Security Considerations

- Prohibited: `eval()`, `exec()`, `pickle.loads()` from untrusted sources
- Prohibited: string formatting in SQL queries
- Prohibited: logging of `password`, `token`, `secret`, `key` values

## 10. Error Handling

See Error Handling section above.

## 11. Edge Cases

- SQLAlchemy lazy loading can cause issues in async contexts — always use `selectinload` or `joinedload` eagerly
- Pydantic V2 uses `field_validator` instead of V1's `@validator`

## 12. Testing Strategy

- Ruff and formatting checks in CI
- Pre-commit hooks enforce standards locally

## 13. Acceptance Criteria

- All Python files pass `ruff check` (no errors)
- All Python files pass `ruff format` (no changes needed)
- All functions have type hints
- Pre-commit hooks configured

## 14. Future Improvements

- Mypy strict mode for full type safety
- Pre-commit hooks for all standards
- Editor configuration file (.editorconfig) for consistent editor behavior
