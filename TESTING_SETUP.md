# Quick Testing Setup Guide

## First-Time Setup

### Frontend Tests

```bash
cd frontend

# Install all dependencies including testing libraries
npm install

# Verify tests run
npm test
```

**Expected Output:**

```
✓ editorStore > initialization > should initialize with Python as default language
✓ editorStore > initialization > should initialize with Python boilerplate code
✓ editorStore > setLanguage > should update code to JavaScript template
... (and more tests)

Test Files  1 passed (1)
     Tests  12 passed (12)
```

### Backend Tests

```bash
cd backend

# Install dependencies including pytest
pip install -r requirements.txt

# Verify tests run
pytest -v
```

**Expected Output:**

```
tests/test_auth.py::TestUserRegistration::test_register_new_user PASSED
tests/test_auth.py::TestUserLogin::test_login_success PASSED
tests/test_password_hashing.py::TestPasswordHashing::test_hash_password PASSED
... (and more tests)

============ 12 passed in 2.45s ============
```

## Common Issues

### Frontend

**Issue**: `Cannot find module 'vitest'`

```bash
# Solution: Install dependencies
cd frontend && npm install
```

**Issue**: Tests fail with localStorage errors

```bash
# Solution: This is fixed in setup.ts with mocks
# If persisting, clear cache:
rm -rf node_modules/.vite
npm test
```

### Backend

**Issue**: `ModuleNotFoundError: No module named 'pytest'`

```bash
# Solution: Install test dependencies
pip install pytest pytest-asyncio httpx
# OR
pip install -r requirements.txt
```

**Issue**: Import errors in tests

```bash
# Solution: Run pytest from backend directory
cd backend
pytest
```

## IDE Integration

### VS Code

Install extensions for better testing experience:

1. **Vitest** (for frontend)

   - Auto-run tests on save
   - Inline test results

2. **Python Test Explorer** (for backend)
   - Visual test runner
   - Debug tests with breakpoints

### Running Tests from IDE

**VS Code**:

- Frontend: Click "Testing" icon → Run tests
- Backend: Testing panel → Configure pytest → Run

## Daily Development

```bash
# Frontend - Watch mode (auto-rerun on changes)
cd frontend
npm test -- --watch

# Backend - Watch mode with pytest-watch
cd backend
pip install pytest-watch
ptw  # Runs pytest on file changes
```

## Before Committing

Run full test suite:

```bash
# Frontend
cd frontend && npm test

# Backend
cd backend && pytest

# Both should pass ✅
```

## Next Steps

1. Read `TESTING.md` for detailed testing guide
2. Try writing a new test
3. Set up GitHub Actions for CI/CD (optional)
4. Add test coverage badges to README
