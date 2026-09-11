"""
MIRA WebSocket Connection Manager and Live Telemetry Broadcaster
"""
import asyncio
import json
import logging
from typing import Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
from simulation.simulator import simulator

logger = logging.getLogger("mira.websocket")


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._broadcast_task: Optional[asyncio.Task] = None
        self._last_state_json: Optional[str] = None
        self._last_state_version: int = -1

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        # Send immediate initial state
        if self._last_state_json is None or simulator.state_version != self._last_state_version:
            self._last_state_json = simulator.get_state().model_dump_json()
            self._last_state_version = simulator.state_version
        await websocket.send_text(self._last_state_json)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast_state(self, force: bool = False):
        if not self.active_connections:
            return

        current_version = simulator.state_version
        if force or self._last_state_json is None or current_version != self._last_state_version:
            self._last_state_json = simulator.get_state().model_dump_json()
            self._last_state_version = current_version

        stale = set()
        for connection in list(self.active_connections):
            try:
                await connection.send_text(self._last_state_json)
            except Exception:
                stale.add(connection)
        for dead in stale:
            self.active_connections.discard(dead)

    async def start_loop(self):
        logger.info("Starting MIRA simulation loop...")
        heartbeat_counter = 0
        while True:
            try:
                if not self.active_connections:
                    # When no clients are connected, sleep to preserve cloud CPU
                    await asyncio.sleep(1.0)
                    continue

                if simulator.is_running and not simulator.is_paused:
                    simulator.tick()
                    await self.broadcast_state(force=True)
                    heartbeat_counter = 0
                    interval = max(0.05, 0.5 / max(0.1, simulator.sim_speed))
                else:
                    # Paused or idle: broadcast only if state changed, plus a 2s heartbeat
                    heartbeat_counter += 1
                    if simulator.state_version != self._last_state_version or heartbeat_counter >= 4:
                        await self.broadcast_state()
                        heartbeat_counter = 0
                    interval = 0.5

                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in simulation loop: {e}", exc_info=True)
                await asyncio.sleep(0.5)


manager = ConnectionManager()
