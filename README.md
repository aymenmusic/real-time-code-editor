# PairSpace — Real-Time Collaborative Code Editor

A full-stack web application for real-time collaborative coding. Multiple users can join a shared editor, write and execute code simultaneously, and communicate via built-in chat — all synced live via WebSockets.

🔗 **[Live Demo](https://pairspace.app)** &nbsp;|&nbsp; Built with React, FastAPI, and WebSockets

---

## Tech Stack

**Frontend**

- React 19 + TypeScript
- Monaco Editor (same editor as VS Code)
- Zustand for state management
- Vite

**Backend**

- FastAPI (Python)
- WebSockets for real-time sync
- PostgreSQL + SQLAlchemy
- JWT authentication
- SlowAPI rate limiting

**Infrastructure**

- Frontend → Vercel
- Backend → Render
- Database → Render PostgreSQL

---

## Features

- **Real-time collaboration** — Code changes broadcast instantly to all users in the room via WebSocket
- **Multi-language execution** — Run Python and JavaScript code directly in the browser; output displayed in a terminal panel
- **Live user presence** — See who's currently in the session with color-coded avatars
- **Integrated chat** — Communicate with collaborators without leaving the editor
- **Persistent sessions** — Code state saved to localStorage per language; survives page refresh
- **JWT authentication** — Secure register/login flow with protected routes
- **Dark/light mode** — System-aware theme toggle
- **Auto-reconnect** — WebSocket client automatically reconnects on disconnect (up to 5 attempts)

---

## Architecture

```
Browser (React)
    │
    ├── REST (HTTP)  ──►  FastAPI  ──►  PostgreSQL
    │                      (auth, code execution)
    │
    └── WebSocket   ──►  FastAPI WebSocket Manager
                          (real-time code sync, chat, presence)
```

The backend uses an in-memory `ConnectionManager` to track rooms and broadcast messages. Each room is identified by a `room_id`; all connected users in the same room receive each other's code changes, chat messages, and presence events in real time.

---

## Running Locally

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Fill in your DB credentials and JWT secret
python run.py
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local      # Set VITE_API_URL and VITE_WS_URL
npm run dev
```

App runs at `http://localhost:5173` with the API at `http://localhost:8000`.

---

## Environment Variables

**Backend (`.env`)**

| Variable                          | Description                       |
| --------------------------------- | --------------------------------- |
| `DATABASE_URL`                    | PostgreSQL connection string      |
| `JWT_SECRET_KEY`                  | Secret key for signing JWT tokens |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry (default: 30)        |
| `ALLOWED_ORIGINS`                 | Comma-separated CORS origins      |

**Frontend (`.env.local`)**

| Variable       | Description                                |
| -------------- | ------------------------------------------ |
| `VITE_API_URL` | Backend base URL (`http://` or `https://`) |
| `VITE_WS_URL`  | WebSocket base URL (`ws://` or `wss://`)   |

---

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI app, WebSocket endpoint, code execution
│   ├── websocket_manager.py # Room-based connection manager
│   ├── routers/auth.py      # Register / login / me endpoints
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   └── auth/utils.py        # JWT helpers
│
└── frontend/
    ├── src/
    │   ├── components/Editor/   # CodeEditor, Terminal, Chat, UserPresence
    │   ├── services/            # WebSocket service (singleton)
    │   ├── store/               # Zustand stores (auth, editor, chat, theme)
    │   └── pages/               # Landing, Login, Register, Editor
    └── vercel.json
```

---

_Made by Aymen_
