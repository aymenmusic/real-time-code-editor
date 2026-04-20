from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import subprocess
import tempfile
import os
import uuid
import json
from typing import Optional

from database.database import engine, Base
from routers import auth
from models import user
from models.user import User
from auth.utils import get_current_active_user, get_current_user_optional
from websocket_manager import manager

app = FastAPI(title="Real-Time Code Editor API")

# Create database tables on startup


@app.on_event("startup")
async def startup_event():
    """Create database tables when the app starts"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        print("⚠️  App will start but database operations will fail")
        print("🔧 Check your DATABASE_URL environment variable in Render")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Custom validation error handler to clean up error messages
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Custom handler to clean up validation error messages.
    Removes the "Value error, " prefix that Pydantic adds to ValueError messages.
    """
    errors = []
    for error in exc.errors():
        error_msg = error.get("msg", "")
        # Remove "Value error, " prefix if present
        if error_msg.startswith("Value error, "):
            error_msg = error_msg.replace("Value error, ", "", 1)

        errors.append({
            "loc": error.get("loc"),
            "msg": error_msg,
            "type": error.get("type")
        })

    # Return the first error message as the main detail
    detail = errors[0]["msg"] if errors else "Validation error"

    return JSONResponse(
        status_code=422,
        content={
            "detail": detail,
            "errors": errors
        }
    )


# Add CORS middleware to allow requests from the frontend
# Get allowed origins from environment variables or use a default for development
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Use environment variable for production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
    expose_headers=["Content-Type"],
    max_age=3600,
)

# Include routers
app.include_router(auth.router)


class CodeExecution(BaseModel):
    code: str = Field(..., max_length=50000, min_length=1)
    language: str = Field(default="python", pattern="^(python|javascript)$")

    @validator('code')
    def validate_code(cls, v):
        if not v.strip():
            raise ValueError('Code cannot be empty or only whitespace')
        # Block dangerous imports (basic protection)
        dangerous_patterns = [
            'import os', 'from os',
            'import subprocess', 'from subprocess',
            'import sys', 'from sys',
            '__import__', 'eval(', 'exec(',
        ]
        lower_code = v.lower()
        for pattern in dangerous_patterns:
            if pattern in lower_code:
                raise ValueError(f'Dangerous operation detected: {pattern}')
        return v


@app.get("/")
async def root():
    return {"message": "Welcome to the Code Execution API"}


@app.post("/execute")
@limiter.limit("10/minute")
async def execute_code(
    request: Request,
    execution: CodeExecution,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    # Works for both authenticated and unauthenticated users
    # If current_user is None, it's an anonymous user

    # Create a unique ID for this execution
    execution_id = str(uuid.uuid4())

    # Determine file extension and command based on language
    if execution.language == "python":
        file_suffix = '.py'
        command = ["python"]
    elif execution.language == "javascript":
        file_suffix = '.js'
        command = ["node"]
    else:
        raise HTTPException(
            status_code=400, detail=f"Language {execution.language} not supported yet")

    # Create a temporary file to store the code
    with tempfile.NamedTemporaryFile(suffix=file_suffix, delete=False) as temp_file:
        temp_filename = temp_file.name
        temp_file.write(execution.code.encode())

    try:
        # Execute the code with a timeout
        result = subprocess.run(
            command + [temp_filename],
            capture_output=True,
            text=True,
            timeout=10  # 10 second timeout
        )

        # Prepare the response
        response = {
            "execution_id": execution_id,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "exit_code": result.returncode,
            "success": result.returncode == 0
        }

        return response
    except subprocess.TimeoutExpired:
        return {
            "execution_id": execution_id,
            "stdout": "",
            "stderr": "Execution timed out after 10 seconds",
            "exit_code": 124,
            "success": False
        }
    except Exception as e:
        return {
            "execution_id": execution_id,
            "stdout": "",
            "stderr": f"Error executing code: {str(e)}",
            "exit_code": 1,
            "success": False
        }
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_filename):
            os.unlink(temp_filename)


@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """WebSocket endpoint for real-time collaboration"""
    user_info = None

    try:
        # Accept connection and wait for initial user info
        await websocket.accept()

        # Wait for the first message with user info
        data = await websocket.receive_json()

        if data.get("type") == "init":
            user_info = data.get("user", {})
            # Connect to room with user info
            await manager.connect(websocket, room_id, user_info)

            # Main message loop
            while True:
                try:
                    data = await websocket.receive_json()
                    message_type = data.get("type")

                    if message_type == "code_change":
                        # Broadcast code changes to all users in the room
                        await manager.broadcast_to_room(
                            room_id,
                            {
                                "type": "code_change",
                                "code": data.get("code"),
                                "userId": user_info.get("id"),
                                "userName": user_info.get("name")
                            },
                            exclude=websocket
                        )

                    elif message_type == "chat_message":
                        # Broadcast chat messages
                        await manager.broadcast_to_room(
                            room_id,
                            {
                                "type": "chat_message",
                                "message": {
                                    "userId": user_info.get("id"),
                                    "userName": user_info.get("name"),
                                    "text": data.get("text"),
                                    "timestamp": data.get("timestamp")
                                }
                            }
                        )

                    elif message_type == "language_change":
                        # Broadcast language changes
                        await manager.broadcast_to_room(
                            room_id,
                            {
                                "type": "language_change",
                                "language": data.get("language"),
                                "userId": user_info.get("id")
                            },
                            exclude=websocket
                        )

                    elif message_type == "request_users":
                        # One specific client is asking for a fresh users list
                        # (used by the 2-second post-connect stability sync).
                        current_users = list(
                            manager.room_users.get(room_id, {}).values()
                        )
                        await websocket.send_json({
                            "type": "users_list",
                            "users": current_users
                        })

                    elif message_type == "guide_cursor":
                        # Route to everyone in the room (excluding sender); receivers
                        # filter by targetUserId on the client side.
                        await manager.broadcast_to_room(
                            room_id,
                            {
                                "type":          "guide_cursor",
                                "targetUserId":  data.get("targetUserId"),
                                "fromUserName":  data.get("fromUserName"),
                                "fromUserColor": data.get("fromUserColor"),
                                "lineNumber":    data.get("lineNumber"),
                                "column":        data.get("column"),
                            },
                            exclude=websocket
                        )

                    elif message_type == "cursor_move":
                        # Broadcast cursor position / selection to all OTHER users in the room.
                        # The sender already sees their own cursor natively so we exclude them.
                        await manager.broadcast_to_room(
                            room_id,
                            {
                                "type": "cursor_move",
                                "userId":     data.get("userId"),
                                "userName":   data.get("userName"),
                                "color":      data.get("color"),
                                "lineNumber": data.get("lineNumber"),
                                "column":     data.get("column"),
                                "selection":  data.get("selection"),
                            },
                            exclude=websocket
                        )

                except WebSocketDisconnect:
                    break
                except json.JSONDecodeError:
                    continue
                except Exception as e:
                    print(f"Error in WebSocket loop: {e}")
                    break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        # Disconnect and notify others
        if user_info:
            user_data = manager.disconnect(websocket, room_id)
            if user_data:
                # Notify for cursor-cleanup (clients use this to remove decorations)
                await manager.broadcast_to_room(
                    room_id,
                    {
                        "type": "user_left",
                        "user": user_data
                    }
                )
                # Also broadcast the authoritative updated users list so every
                # client's presence panel is guaranteed to stay in sync.
                remaining_users = list(
                    manager.room_users.get(room_id, {}).values()
                )
                await manager.broadcast_to_room(
                    room_id,
                    {
                        "type": "users_list",
                        "users": remaining_users
                    }
                )
