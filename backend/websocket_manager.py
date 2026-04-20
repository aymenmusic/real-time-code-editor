from typing import Dict, Set, List
from fastapi import WebSocket
import json


class ConnectionManager:
    def __init__(self):
        # Store active connections by room
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Store user info for each connection
        self.connection_users: Dict[WebSocket, dict] = {}
        # Track unique users by user ID per room
        self.room_users: Dict[str, Dict[str, dict]] = {}
        # Track which connections belong to which user
        self.user_connections: Dict[str, Dict[str, Set[WebSocket]]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_info: dict):
        """Add WebSocket connection to room (websocket should already be accepted)"""
        user_id = user_info.get("id")

        # Create room if it doesn't exist
        if room_id not in self.active_connections:
            self.active_connections[room_id] = set()
            self.room_users[room_id] = {}
            self.user_connections[room_id] = {}

        # Add connection to room
        self.active_connections[room_id].add(websocket)

        # Store user info for this connection
        self.connection_users[websocket] = user_info

        # Track this connection for the user
        if user_id not in self.user_connections[room_id]:
            self.user_connections[room_id][user_id] = set()
        self.user_connections[room_id][user_id].add(websocket)

        # Check if this is the first connection for this user in this room
        is_new_user = user_id not in self.room_users[room_id]

        # Store/update user info in room
        self.room_users[room_id][user_id] = user_info

        # Always broadcast the authoritative users list to EVERY connection in
        # the room (including the new one) so no client ever misses an update.
        # This replaces the old "user_joined delta to existing + users_list to
        # new" pattern which had a race condition if the delta message was lost.
        if is_new_user:
            current_users = list(self.room_users[room_id].values())
            await self.broadcast_to_room(
                room_id,
                {
                    "type": "users_list",
                    "users": current_users
                }
                # No exclude — everyone gets the fresh list
            )
        else:
            # Reconnect of an existing tab: send only to this socket
            current_users = list(self.room_users[room_id].values())
            await websocket.send_json({
                "type": "users_list",
                "users": current_users
            })

    def disconnect(self, websocket: WebSocket, room_id: str):
        """Remove a WebSocket connection from room"""
        # Get user info before removing
        user_info = self.connection_users.get(websocket)
        user_id = user_info.get("id") if user_info else None

        # Remove connection from room
        if room_id in self.active_connections:
            self.active_connections[room_id].discard(websocket)

        # Remove from user's connections
        if room_id in self.user_connections and user_id in self.user_connections[room_id]:
            self.user_connections[room_id][user_id].discard(websocket)

            # If user has no more connections in this room, remove them completely
            if not self.user_connections[room_id][user_id]:
                del self.user_connections[room_id][user_id]

                # Remove user from room users list
                if room_id in self.room_users and user_id in self.room_users[room_id]:
                    del self.room_users[room_id][user_id]

                # User fully disconnected from room, we'll notify
                user_fully_disconnected = True
            else:
                # User still has other tabs open in this room
                user_fully_disconnected = False
        else:
            user_fully_disconnected = True

        # Clean up empty rooms
        if room_id in self.active_connections and not self.active_connections[room_id]:
            del self.active_connections[room_id]
            if room_id in self.room_users:
                del self.room_users[room_id]
            if room_id in self.user_connections:
                del self.user_connections[room_id]

        # Remove connection user info
        if websocket in self.connection_users:
            del self.connection_users[websocket]

        # Only return user_info if they fully disconnected (no more tabs)
        return user_info if user_fully_disconnected else None

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
