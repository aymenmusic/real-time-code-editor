from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends
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
from websocket import manager
from auth.utils import get_current_user

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Real-Time Code Editor API")

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


# WebSocket endpoints
class ConnectionData(BaseModel):
    user_id: str
    username: str
    color: str


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for anonymous users (not authenticated)
    """
    # Generate a random user ID for anonymous users
    user_id = f"anon-{uuid.uuid4()}"
    username = f"Guest-{user_id[:5]}"
    color = "#" + uuid.uuid4().hex[:6]  # Random color

    print(f"New anonymous WebSocket connection: {user_id} ({username})")

    try:
        await manager.connect(websocket, user_id, username, color)

        while True:
            # Wait for messages from the client
            data = await websocket.receive_text()
            print(f"Received message from {user_id}: {data[:100]}...")
            message_data = json.loads(data)

            # Handle different message types
            if message_data["type"] == "chat_message":
                print(
                    f"Chat message from {user_id}: {message_data['message']}")
                await manager.broadcast_message(user_id, message_data["message"])
            elif message_data["type"] == "code_update":
                print(f"Code update from {user_id}")
                await manager.broadcast_code_update(user_id, message_data["code"])
            else:
                print(
                    f"Unknown message type from {user_id}: {message_data['type']}")
    except WebSocketDisconnect:
        print(f"WebSocket disconnected: {user_id}")
        manager.disconnect(user_id)
        await manager.broadcast_users()
    except Exception as e:
        print(f"WebSocket error for {user_id}: {e}")
        manager.disconnect(user_id)
        await manager.broadcast_users()


@app.websocket("/ws/auth")
async def websocket_auth_endpoint(websocket: WebSocket, token: str):
    """
    WebSocket endpoint for authenticated users
    """
    user_id = "unknown"  # Default value for error handling

    try:
        print(
            f"Authenticating WebSocket connection with token: {token[:10]}...")

        # Verify the token and get the user
        current_user = await get_current_user(token)
        user_id = str(current_user.id)
        username = current_user.username

        print(f"Authenticated user: {user_id} ({username})")

        # Generate a random color for the user
        # In a real app, this could be stored in the user profile
        color = "#" + uuid.uuid4().hex[:6]

        await manager.connect(websocket, user_id, username, color)

        while True:
            # Wait for messages from the client
            data = await websocket.receive_text()
            print(
                f"Received message from authenticated user {user_id}: {data[:100]}...")
            message_data = json.loads(data)

            # Handle different message types
            if message_data["type"] == "chat_message":
                print(
                    f"Chat message from authenticated user {user_id}: {message_data['message']}")
                await manager.broadcast_message(user_id, message_data["message"])
            elif message_data["type"] == "code_update":
                print(f"Code update from authenticated user {user_id}")
                await manager.broadcast_code_update(user_id, message_data["code"])
            else:
                print(
                    f"Unknown message type from authenticated user {user_id}: {message_data['type']}")
    except WebSocketDisconnect:
        print(f"Authenticated WebSocket disconnected: {user_id}")
        manager.disconnect(user_id)
        await manager.broadcast_users()
    except Exception as e:
        print(f"Authenticated WebSocket error for {user_id}: {e}")
        try:
            manager.disconnect(user_id)
            await manager.broadcast_users()
        except Exception as inner_e:
            print(f"Error during disconnect cleanup: {inner_e}")
