# Testing Guide

This document explains the testing strategy and how to run tests for the Real-Time Code Editor project.

## Why Unit Tests?

Unit tests are automated tests that verify individual pieces of code work correctly. They are essential for:

1. **Quality Assurance**: Catch bugs before they reach production
2. **Documentation**: Tests serve as living documentation of how code should behave
3. **Refactoring Safety**: Confidently make changes knowing tests will catch regressions
4. **Professional Development**: Demonstrates software engineering best practices for portfolio/resume

## Testing Stack

### Frontend (React/TypeScript)

- **Vitest**: Modern, fast test runner built for Vite projects
- **React Testing Library**: Test React components the way users interact with them
- **Jest DOM**: Additional matchers for DOM assertions

### Backend (Python/FastAPI)

- **pytest**: The standard Python testing framework
- **FastAPI TestClient**: Test FastAPI endpoints without running a server
- **SQLite in-memory**: Fast, isolated database for each test

---

## Frontend Testing

### Setup

The frontend uses Vitest for testing. Configuration is in `frontend/vitest.config.ts`.

### Running Tests

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm test -- --watch

# Run tests with UI (interactive browser interface)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

Tests are located in `__tests__` directories next to the code they test:

```
frontend/src/
├── store/
│   ├── editorStore.ts
│   └── __tests__/
│       └── editorStore.test.ts
├── components/
│   └── __tests__/
└── test/
    └── setup.ts (global test configuration)
```

### Writing Frontend Tests

Example test from `editorStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../editorStore';

describe('editorStore', () => {
  beforeEach(() => {
    // Reset state before each test
    localStorage.clear();
    useEditorStore.setState({
      code: getDefaultCode('python'),
      language: 'python',
    });
  });

  it('should update language from Python to JavaScript', () => {
    useEditorStore.getState().setLanguage('javascript');
    expect(useEditorStore.getState().language).toBe('javascript');
  });
});
```

### Current Test Coverage

**editorStore.test.ts** - Tests for the editor state management:

- ✅ Initialization with default values
- ✅ Code updates
- ✅ Language switching with boilerplate sync
- ✅ User management (add/remove users)
- ✅ Connection state management

---

## Backend Testing

### Setup

The backend uses pytest. Configuration is in `backend/pytest.ini`.

### Running Tests

```bash
cd backend

# Install dependencies (first time only)
pip install -r requirements.txt

# Run all tests
pytest

# Run tests with verbose output
pytest -v

# Run specific test file
pytest tests/test_auth.py

# Run specific test class
pytest tests/test_auth.py::TestUserRegistration

# Run specific test
pytest tests/test_auth.py::TestUserRegistration::test_register_new_user

# Run tests with coverage
pytest --cov=. --cov-report=html
```

### Test Structure

Tests are in the `backend/tests/` directory:

```
backend/
├── tests/
│   ├── __init__.py
│   ├── test_auth.py          # Authentication endpoint tests
│   └── test_password_hashing.py  # Password utility tests
├── pytest.ini                # Pytest configuration
└── requirements.txt          # Includes pytest dependencies
```

### Writing Backend Tests

Example test from `test_auth.py`:

```python
import pytest
from fastapi.testclient import TestClient

class TestUserRegistration:
    """Test user registration endpoints"""

    def test_register_new_user(self, client):
        """Test successful user registration"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "TestPass123!",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert "id" in data
```

### Current Test Coverage

**test_auth.py** - Authentication API tests:

- ✅ User registration (success, duplicate username, duplicate email)
- ✅ User login (success, wrong password, nonexistent user)
- ✅ Protected endpoints (with/without token, invalid token)

**test_password_hashing.py** - Password security tests:

- ✅ Password hashing
- ✅ Password verification (correct/incorrect)
- ✅ Salt randomization
- ✅ Edge cases (empty passwords)

---

## Continuous Integration (CI)

For portfolio projects, consider adding GitHub Actions to run tests automatically:

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm test

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: cd backend && pip install -r requirements.txt
      - run: cd backend && pytest
```

This adds a ✅ badge to your GitHub repo showing tests pass!

---

## Best Practices

### Writing Good Tests

1. **Descriptive Names**: Test names should describe what they test

   - ✅ `test_login_with_wrong_password_fails()`
   - ❌ `test_login_2()`

2. **One Assertion per Test**: Each test should verify one behavior

   - Makes failures easier to diagnose

3. **Arrange-Act-Assert Pattern**:

   ```python
   def test_example():
       # Arrange: Set up test data
       user = create_test_user()

       # Act: Perform the action
       result = login(user)

       # Assert: Verify the outcome
       assert result.success is True
   ```

4. **Test Independence**: Tests should not depend on each other

   - Use `beforeEach` or fixtures to reset state

5. **Test Edge Cases**: Don't just test the happy path
   - Empty inputs, invalid data, boundary conditions

### What to Test

✅ **Do Test:**

- Business logic
- API endpoints
- State management
- Utility functions
- Error handling

❌ **Don't Test:**

- Third-party libraries (they have their own tests)
- Trivial getters/setters
- Implementation details (test behavior, not internals)

---

## Adding More Tests

To expand test coverage, consider testing:

### Frontend

- [ ] Chat store (`chatStore.ts`)
- [ ] Auth store (`authStore.ts`)
- [ ] WebSocket service (`websocketService.ts`)
- [ ] Component rendering (CodeEditor, Terminal, etc.)
- [ ] User interactions (button clicks, form submissions)

### Backend

- [ ] WebSocket connections and messages
- [ ] Code execution endpoints
- [ ] Database operations
- [ ] Error handling and validation

---

## Test-Driven Development (TDD)

For new features, consider writing tests first:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to make it pass
3. **Refactor**: Improve code while keeping tests green

This ensures all code is tested and helps design better APIs.

---

## Questions?

Testing is a skill that improves with practice. Start with simple tests and gradually add more complex scenarios. Your future self (and teammates) will thank you!

For this project, the tests demonstrate:

- ✅ Professional development practices
- ✅ Code quality and reliability
- ✅ Attention to edge cases
- ✅ Understanding of testing methodologies

Perfect for showcasing in a portfolio or resume! 🚀
