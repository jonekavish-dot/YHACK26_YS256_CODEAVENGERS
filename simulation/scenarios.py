"""
MIRA Predefined Deterministic Scenarios
"""
from typing import Dict, Any, List, Tuple

SCENARIOS: Dict[str, Dict[str, Any]] = {
    "NORMAL_INSPECTION": {
        "name": "Scenario 1: Normal Facility Inspection",
        "profile": "ROUTINE_INSPECTION",
        "initial_battery": 90.0,
        "initial_sensor": 98.0,
        "initial_latency": 35.0,
        "obstacles": [],
        "description": "Nominal autonomous inspection along optimal path with green risk."
    },
    "DYNAMIC_OBSTACLE": {
        "name": "Scenario 2: Dynamic Path Blockage",
        "profile": "EMERGENCY_DELIVERY",
        "initial_battery": 85.0,
        "initial_sensor": 95.0,
        "initial_latency": 45.0,
        "obstacles": [(10, 7), (10, 8)],
        "description": "Dynamic obstacle blocks central corridor, forcing automatic replan."
    },
    "BATTERY_DEGRADATION": {
        "name": "Scenario 3: Battery Power Loss",
        "profile": "EMERGENCY_DELIVERY",
        "initial_battery": 22.0,
        "initial_sensor": 92.0,
        "initial_latency": 50.0,
        "obstacles": [],
        "description": "Battery falls below safe reserve floor, triggering safe zone return."
    },
    "SENSOR_DEGRADATION": {
        "name": "Scenario 4: Perception Sensor Attenuation",
        "profile": "EMERGENCY_DELIVERY",
        "initial_battery": 80.0,
        "initial_sensor": 45.0,
        "initial_latency": 40.0,
        "obstacles": [],
        "description": "Sensor health degrades, triggering speed reduction to widen safety margin."
    },
    "COMMUNICATION_FAILURE": {
        "name": "Scenario 5: Wireless Blackout & Degraded Autonomy",
        "profile": "EMERGENCY_DELIVERY",
        "initial_battery": 75.0,
        "initial_sensor": 90.0,
        "initial_latency": 480.0,
        "obstacles": [],
        "description": "High network latency activates Degraded Autonomy with localized policy."
    },
    "COMBINED_FAULT": {
        "name": "Scenario 6: Compound Multi-System Failure",
        "profile": "CRITICAL_RESCUE",
        "initial_battery": 24.0,
        "initial_sensor": 46.0,
        "initial_latency": 420.0,
        "obstacles": [(8, 8)],
        "description": "Compound failure requiring defense posture and safe zone diversion."
    },
}

