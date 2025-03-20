from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional
import json
from pydantic import BaseModel


class ConnectionManager:
    """
    WebSocket connection manager to handle multiple client connections
    and broadcast messages to connected clients.
    """

    def __init__(self):
        # active_connections stores WebSocket connections with user_id as key
        self.active_connections: Dict[str, WebSocket] = {}
        # connected_users stores user information
        self.connected_users: Dict[str, dict] = {}

    async def connect(self, websocket: WebSocket, user_id: str, username: str, color: str):
        """
        Connect a new client and store their information
        """
        print(f"New WebSocket connection: {user_id} ({username})")
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.connected_users[user_id] = {
            "id": user_id,
            "name": username,
            "color": color
        }

        print(f"Connected users: {list(self.connected_users.keys())}")

        # Broadcast the updated user list to all connected clients
        await self.broadcast_users()

    def disconnect(self, user_id: str):
        """
        Disconnect a client and remove their information
        """
        print(f"Disconnecting user: {user_id}")

        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"Removed {user_id} from active connections")
        else:
            print(f"User {user_id} not found in active connections")

        if user_id in self.connected_users:
            del self.connected_users[user_id]
            print(f"Removed {user_id} from connected users")
        else:
            print(f"User {user_id} not found in connected users")

        print(
            f"Remaining connected users: {list(self.connected_users.keys())}")

    async def broadcast_users(self):
        """
        Broadcast the list of connected users to all clients
        """
        if not self.active_connections:
            print("No active connections, skipping broadcast")
            return

        # Create a list of connected users
        users_list = list(self.connected_users.values())
        print(f"Broadcasting users update: {users_list}")

        # Create the message to send
        message = {
            "type": "users_update",
            "users": users_list
        }

        # Broadcast to all connected clients
        for user_id, connection in self.active_connections.items():
            try:
                print(f"Sending users update to {user_id}")
                await connection.send_text(json.dumps(message))
                print(f"Successfully sent users update to {user_id}")
            except Exception as e:
                print(f"Error broadcasting users to {user_id}: {e}")

    async def broadcast_message(self, user_id: str, message: str):
        """
        Broadcast a chat message to all clients
        """
        if not self.active_connections:
            return

        # Get the user information
        user = self.connected_users.get(user_id)
        if not user:
            return

        # Create the message to send
        chat_message = {
            "type": "chat_message",
            "user": user,
            "message": message,
            "timestamp": import_time()
        }

        # Broadcast to all connected clients
        for connection in self.active_connections.values():
            try:
                await connection.send_text(json.dumps(chat_message))
            except Exception as e:
                print(f"Error broadcasting message: {e}")

    async def broadcast_code_update(self, user_id: str, code: str):
        """
        Broadcast a code update to all clients
        """
        if not self.active_connections:
            return

        # Create the message to send
        code_update = {
            "type": "code_update",
            "user_id": user_id,
            "code": code
        }

        # Broadcast to all connected clients except the sender
        for client_id, connection in self.active_connections.items():
            if client_id != user_id:  # Don't send back to the sender
                try:
                    await connection.send_text(json.dumps(code_update))
                except Exception as e:
                    print(f"Error broadcasting code update: {e}")


# Create a single instance of the connection manager
manager = ConnectionManager()


def import_time():
    """Helper function to get current time as ISO string"""
    from datetime import datetime
    return datetime.now().isoformat()
