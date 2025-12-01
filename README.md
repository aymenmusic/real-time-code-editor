# Real-Time Code Editor

A collaborative code editor with real-time collaboration features, code execution, and chat functionality.

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
