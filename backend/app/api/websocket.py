"""
MIRA WebSocket Connection Manager and Live Telemetry Broadcaster
"""
import asyncio
import json
import logging
from typing import Set
from fastapi import WebSocket, WebSocketDisconnect
from simulation.simulator import simulator

logger = logging.getLogger("mira.websocket")


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._broadcast_task: asyncio.Task = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        # Send immediate initial state
        state = simulator.get_state()
        await websocket.send_text(state.model_dump_json())

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast_state(self):
        if not self.active_connections:
            return
        state_json = simulator.get_state().model_dump_json()
        stale = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(state_json)
            except Exception:
                stale.add(connection)
        for dead in stale:
            self.active_connections.discard(dead)

    async def start_loop(self):
        logger.info("Starting MIRA simulation loop...")
        while True:
            try:
                # If running and not paused, advance simulator tick
                if simulator.is_running and not simulator.is_paused:
                    simulator.tick()
                await self.broadcast_state()

                # Sleep interval based on simulation speed
                interval = max(0.05, 0.5 / max(0.1, simulator.sim_speed))
                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in simulation loop: {e}", exc_info=True)
                await asyncio.sleep(0.5)


manager = ConnectionManager()
