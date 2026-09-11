"""
MIRA - Mission Intelligence & Risk-Aware Autonomy
FastAPI Main Application Server
"""
import sys
from pathlib import Path

# Bootstrap sys.path for cloud deployment (Render, Fly.io, Railway, Docker)
_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))
_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router as api_router
from .api.websocket import manager
from simulation.baseline_evaluator import baseline_evaluator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("mira.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch background simulation ticker
    loop_task = asyncio.create_task(manager.start_loop())
    logger.info("MIRA Simulator & Telemetry Broadcaster initialized.")
    yield
    # Shutdown: cancel task
    loop_task.cancel()
    try:
        await loop_task
    except asyncio.CancelledError:
        pass
    logger.info("MIRA background services terminated gracefully.")


app = FastAPI(
    title="MIRA - Mission Intelligence & Risk-Aware Autonomy",
    description="Mission-level safety governor and decision layer for autonomous robotics",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API
app.include_router(api_router, prefix="")
app.include_router(api_router, prefix="/api")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep receiving client messages (commands or heartbeats)
            data = await websocket.receive_text()
            # If client sends ping or command, handle if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
