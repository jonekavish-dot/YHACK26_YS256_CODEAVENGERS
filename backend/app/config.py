"""
MIRA Configuration - Centralized Configuration for Risk Factors, Weights, Thresholds & Simulation
"""
from pydantic import BaseModel
from typing import Dict, List, Tuple


class RiskWeights(BaseModel):
    # Physical risk weights (normalized to sum to 1.00)
    battery: float = 0.25
    sensor: float = 0.25
    communication: float = 0.15
    obstacle: float = 0.25
    environment: float = 0.10
    criticality: float = 0.0  # Mission context is evaluated separately from physical hazard


class RiskThresholds(BaseModel):
    normal_max: float = 30.0    # 0 - 30: Normal (Green)
    caution_max: float = 60.0   # 31 - 60: Caution (Yellow)
    high_max: float = 80.0      # 61 - 80: High Risk (Orange)
    # 81 - 100: Critical (Red)

    # Decision Hysteresis Margins to prevent state oscillation
    replan_hysteresis_gap: float = 5.0     # Must drop 5 pts below budget before returning to CONTINUE
    comm_recovery_latency: float = 180.0   # Must drop below 180ms to exit DEGRADED_AUTONOMY (entry at 250ms)
    comm_recovery_reliability: float = 88.0 # Must rise above 88% to exit DEGRADED_AUTONOMY (entry at 80%)


class RouteObjectiveWeights(BaseModel):
    # Centralized Route Objective cost coefficients
    distance: float = 1.0
    hazard: float = 1.6
    clearance: float = 1.4
    energy: float = 0.5


class MissionProfile(BaseModel):
    name: str
    criticality_score: float  # Normalized 0-100
    risk_budget: float       # Max risk tolerated before replanning/acting
    description: str


MISSION_PROFILES: Dict[str, MissionProfile] = {
    "ROUTINE_INSPECTION": MissionProfile(
        name="Routine Facility Inspection",
        criticality_score=20.0,
        risk_budget=60.0,
        description="Low criticality, high risk tolerance. Continues through moderate hazards."
    ),
    "SURVEILLANCE": MissionProfile(
        name="Perimeter Surveillance",
        criticality_score=50.0,
        risk_budget=45.0,
        description="Medium criticality, moderate risk tolerance."
    ),
    "EMERGENCY_DELIVERY": MissionProfile(
        name="Emergency Medical Supply Delivery",
        criticality_score=80.0,
        risk_budget=35.0,
        description="High criticality, low risk tolerance. Strict adherence to safety corridors."
    ),
    "CRITICAL_RESCUE": MissionProfile(
        name="Disaster Zone Search & Rescue",
        criticality_score=95.0,
        risk_budget=25.0,
        description="Maximum criticality, very low risk tolerance. Highly sensitive to failure."
    ),
}

# Grid Map Configuration
GRID_WIDTH = 25
GRID_HEIGHT = 25

DEPOT_POS: Tuple[int, int] = (2, 2)
MEDICAL_CAMP_POS: Tuple[int, int] = (22, 22)
SAFE_ZONE_POS: Tuple[int, int] = (4, 14)

# Static Walls/Obstacles on the 25x25 grid
STATIC_OBSTACLES: List[Tuple[int, int]] = [
    # Central facility divider wall with corridors
    (10, 0), (10, 1), (10, 2), (10, 3), (10, 4), (10, 5), (10, 6),
    # gap at y=7,8
    (10, 9), (10, 10), (10, 11), (10, 12), (10, 13), (10, 14), (10, 15),
    # gap at y=16,17
    (10, 18), (10, 19), (10, 20), (10, 21), (10, 22), (10, 23), (10, 24),

    # Secondary partition
    (17, 4), (17, 5), (17, 6), (17, 7), (17, 8),
    (17, 14), (17, 15), (17, 16), (17, 17), (17, 18), (17, 19),
]

# Hazard / Restricted zones (x_min, y_min, x_max, y_max, hazard_level 0-100)
HAZARD_ZONES = [
    {"x1": 11, "y1": 1, "x2": 15, "y2": 7, "hazard": 70.0, "name": "Chemical Leak / Unstable Zone"},
    {"x1": 5, "y1": 16, "x2": 9, "y2": 22, "hazard": 50.0, "name": "Rough Terrain / Loose Debris"},
    {"x1": 18, "y1": 8, "x2": 23, "y2": 13, "hazard": 65.0, "name": "High EMI / Poor Comm Area"},
]

# Simulator Constants
SIM_TICK_SECONDS = 0.5  # 2 Hz update rate
DEFAULT_SPEED = 1.0     # Grid cells per tick
SAFE_RETURN_RESERVE_PCT = 25.0 # Minimum battery needed to reach safe zone
SAFE_RETURN_COST_PER_CELL = 0.7 # Battery % consumed per cell
DEFAULT_WEIGHTS = RiskWeights()
DEFAULT_THRESHOLDS = RiskThresholds()
