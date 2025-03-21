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

## Security Best Practices

- **Never commit the `.env` file to version control**
- Rotate your JWT secret key periodically
- Use strong, unique passwords for database access
- In production, set up HTTPS for all communication
- Limit CORS to only the domains that need access
- Implement rate limiting for API endpoints
- Regularly update dependencies to patch security vulnerabilities

## Deployment Considerations

When deploying to production:

1. Use environment variables provided by your hosting platform instead of a `.env` file
2. Set up a secrets management service for sensitive information
3. Configure proper CORS settings in `main.py` to restrict access to your domain
4. Set up HTTPS for all communication
5. Implement a proper database backup strategy
