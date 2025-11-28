from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import tempfile
import os
import uuid
import json
from typing import Optional

from database.database import engine, Base
from routers import auth
from models import user
from auth.utils import get_current_user
from websocket_manager import manager

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Real-Time Code Editor API")

# Add CORS middleware to allow requests from the frontend
# Get allowed origins from environment variables or use a default for development
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers
)

# Include routers
app.include_router(auth.router)


class CodeExecution(BaseModel):
    code: str
    language: str = "python"  # Default to Python for now


@app.get("/")
async def root():
    return {"message": "Welcome to the Code Execution API"}


@app.post("/execute")
async def execute_code(execution: CodeExecution):
    if execution.language != "python":
        raise HTTPException(
            status_code=400, detail=f"Language {execution.language} not supported yet")

    # Create a unique ID for this execution
    execution_id = str(uuid.uuid4())

    # Create a temporary file to store the code
    with tempfile.NamedTemporaryFile(suffix='.py', delete=False) as temp_file:
        temp_filename = temp_file.name
        temp_file.write(execution.code.encode())

    try:
        # Execute the code with a timeout
        result = subprocess.run(
            ["python", temp_filename],
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
                await manager.broadcast_to_room(
                    room_id,
                    {
                        "type": "user_left",
                        "user": user_data
                    }
                )
