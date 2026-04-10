# Real-Time Code Editor

A collaborative code editor with real-time collaboration features, code execution, and chat functionality.

## Features

- **Real-time Collaboration**: Multiple users can edit code simultaneously
- **Multi-language Support**: Execute code in Python and JavaScript
- **Code Execution**: Run code with output displayed in a terminal
- **Live Chat**: Communicate with collaborators in real-time
- **Syntax Highlighting**: Monaco editor with IntelliSense
- **User Authentication**: Secure login and registration system

## Supported Languages

- **Python** - Requires Python 3.x installed
- **JavaScript** - Requires Node.js installed

## Security Setup

This application uses environment variables for secure configuration. Follow these steps to set up your environment securely:

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file based on the example:

   ```bash
   cp .env.example .env
   ```

5. Edit the `.env` file and replace the placeholder values with secure values:
   - Generate a secure JWT secret key:
     ```bash
     openssl rand -hex 32
     ```
   - Set a strong database password
   - Configure other environment variables as needed

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Backend

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python run.py
```

### Frontend

```bash
cd frontend
npm run dev
```

## Testing

This project includes comprehensive unit tests for both frontend and backend to ensure code quality and reliability.

### Running Tests

**Frontend Tests (Vitest):**

```bash
cd frontend
npm test                    # Run all tests
npm run test:ui            # Run with interactive UI
npm run test:coverage      # Generate coverage report
```

**Backend Tests (pytest):**

```bash
cd backend
pytest                     # Run all tests
pytest -v                  # Verbose output
pytest --cov=.            # With coverage
```

### Test Coverage

- ✅ **Frontend**: Editor store, state management, language switching
- ✅ **Backend**: Authentication API, password hashing, user registration/login
- 📖 **Documentation**: See [TESTING.md](./TESTING.md) for detailed testing guide
- 🚀 **Quick Start**: See [TESTING_SETUP.md](./TESTING_SETUP.md) for setup instructions

Tests demonstrate professional development practices perfect for portfolio projects!

## Tech Stack

### Frontend

- React 19 + TypeScript
- Monaco Editor (VS Code editor)
- Zustand (State management)
- Vite (Build tool)
- Vitest (Testing)

### Backend

- FastAPI (Python web framework)
- WebSockets (Real-time communication)
- SQLAlchemy (ORM)
- PostgreSQL (Database)
- JWT Authentication
- pytest (Testing)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your portfolio!
