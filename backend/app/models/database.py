"""
MIRA SQLite Database Manager for Telemetry, Risk Events, and Mission Audits
"""
import sqlite3
import json
import time
from typing import List, Dict, Any, Optional
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent.parent / "mira.db"


class Database:
    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = str(db_path)
        self.init_db()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS missions (
                    id TEXT PRIMARY KEY,
                    profile TEXT NOT NULL,
                    name TEXT NOT NULL,
                    status TEXT NOT NULL,
                    start_time REAL NOT NULL,
                    end_time REAL,
                    total_distance REAL DEFAULT 0.0,
                    avg_risk REAL DEFAULT 0.0,
                    peak_risk REAL DEFAULT 0.0,
                    replans_count INTEGER DEFAULT 0
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS telemetry_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    mission_id TEXT NOT NULL,
                    step INTEGER NOT NULL,
                    x INTEGER NOT NULL,
                    y INTEGER NOT NULL,
                    battery REAL NOT NULL,
                    sensor_health REAL NOT NULL,
                    comm_latency REAL NOT NULL,
                    obstacle_distance REAL NOT NULL,
                    speed REAL NOT NULL,
                    composite_risk REAL NOT NULL,
                    mode TEXT NOT NULL,
                    timestamp REAL NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS risk_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    mission_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    description TEXT NOT NULL,
                    risk_before REAL,
                    risk_after REAL,
                    action_taken TEXT,
                    timestamp REAL NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS decisions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    mission_id TEXT NOT NULL,
                    step INTEGER NOT NULL,
                    action TEXT NOT NULL,
                    mode TEXT NOT NULL,
                    reason TEXT NOT NULL,
                    tradeoff_details TEXT,
                    timestamp REAL NOT NULL
                )
            """)
            conn.commit()
        finally:
            conn.close()

    def log_mission_start(self, mission_id: str, profile: str, name: str):
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT OR REPLACE INTO missions (id, profile, name, status, start_time) VALUES (?, ?, ?, ?, ?)",
                (mission_id, profile, name, "RUNNING", time.time())
            )
            conn.commit()
        finally:
            conn.close()

    def log_telemetry(self, mission_id: str, step: int, data: Dict[str, Any], risk: float, mode: str):
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO telemetry_logs (
                    mission_id, step, x, y, battery, sensor_health, comm_latency,
                    obstacle_distance, speed, composite_risk, mode, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                mission_id, step, int(data.get("x", 0)), int(data.get("y", 0)),
                float(data.get("battery", 0)), float(data.get("sensor_health", 0)),
                float(data.get("communication_latency", 0)), float(data.get("obstacle_distance", 0)),
                float(data.get("speed", 0)), float(risk), mode, time.time()
            ))
            conn.commit()
        finally:
            conn.close()

    def log_event(self, mission_id: str, event_type: str, description: str, risk_before: float, risk_after: float, action: str):
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO risk_events (
                    mission_id, event_type, description, risk_before, risk_after, action_taken, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (mission_id, event_type, description, risk_before, risk_after, action, time.time()))
            conn.commit()
        finally:
            conn.close()

    def log_decision(self, mission_id: str, step: int, action: str, mode: str, reason: str, tradeoff: Optional[str]):
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO decisions (
                    mission_id, step, action, mode, reason, tradeoff_details, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (mission_id, step, action, mode, reason, tradeoff, time.time()))
            conn.commit()
        finally:
            conn.close()

    def get_recent_decisions(self, mission_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM decisions WHERE mission_id = ? ORDER BY timestamp DESC LIMIT ?",
                (mission_id, limit)
            )
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()

    def get_recent_events(self, mission_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM risk_events WHERE mission_id = ? ORDER BY timestamp DESC LIMIT ?",
                (mission_id, limit)
            )
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()


db = Database()
