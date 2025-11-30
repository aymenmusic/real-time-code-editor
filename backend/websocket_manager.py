from typing import Dict, Set
from fastapi import WebSocket
import json


class ConnectionManager:
    def __init__(self):
        # Store active connections by session/room
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Store user info for each connection
        self.connection_users: Dict[WebSocket, dict] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_info: dict):
        """Add WebSocket connection to room (websocket should already be accepted)"""
        # Create room if it doesn't exist
        if room_id not in self.active_connections:
            self.active_connections[room_id] = set()

        # Add connection to room
        self.active_connections[room_id].add(websocket)

        # Store user info
        self.connection_users[websocket] = user_info

        # Notify room about new user
        await self.broadcast_to_room(
            room_id,
            {
                "type": "user_joined",
                "user": user_info
            },
            exclude=websocket
        )

        # Send current users list to the new connection
        current_users = [
            self.connection_users[conn]
            for conn in self.active_connections[room_id]
            if conn in self.connection_users
        ]
        await websocket.send_json({
            "type": "users_list",
            "users": current_users
        })

    def disconnect(self, websocket: WebSocket, room_id: str):
        """Remove a WebSocket connection from room"""
        if room_id in self.active_connections:
            self.active_connections[room_id].discard(websocket)

            # Clean up empty rooms
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

        # Get user info before removing
        user_info = self.connection_users.get(websocket)

        # Remove user info
        if websocket in self.connection_users:
            del self.connection_users[websocket]

        return user_info

    async def broadcast_to_room(self, room_id: str, message: dict, exclude: WebSocket = None):
        """Broadcast a message to all connections in a room"""
        if room_id not in self.active_connections:
            return

        disconnected = []
        # Make a copy of the set to avoid RuntimeError during iteration
        connections = list(self.active_connections[room_id])

        for connection in connections:
            if connection == exclude:
                continue
            try:
                await connection.send_json(message)
            except Exception:
                # Connection is broken, mark for removal
                disconnected.append(connection)

        # Clean up disconnected connections
        for conn in disconnected:
            self.active_connections[room_id].discard(conn)
            if conn in self.connection_users:
                del self.connection_users[conn]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific connection"""
        try:
            await websocket.send_json(message)
        except Exception:
            pass


# Global connection manager instance
manager = ConnectionManager()
