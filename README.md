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
