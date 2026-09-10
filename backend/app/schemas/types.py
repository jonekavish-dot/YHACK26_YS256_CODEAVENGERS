"""
MIRA Pydantic Data Models and Schemas
"""
from pydantic import BaseModel, Field
from typing import List, Tuple, Optional, Dict, Any
from enum import Enum


class ActionEnum(str, Enum):
    CONTINUE = "CONTINUE"
    SLOW_DOWN = "SLOW_DOWN"
    REPLAN = "REPLAN"
    DEGRADED_AUTONOMY = "DEGRADED_AUTONOMY"
    RETURN_TO_SAFE_ZONE = "RETURN_TO_SAFE_ZONE"
    EMERGENCY_STOP = "EMERGENCY_STOP"


class ModeEnum(str, Enum):
    NORMAL = "NORMAL"
    DEGRADED_AUTONOMY = "DEGRADED_AUTONOMY"
    SAFE_RETURN = "SAFE_RETURN"
    EMERGENCY_STOP = "EMERGENCY_STOP"


class RiskLevelEnum(str, Enum):
    GREEN = "GREEN"      # 0 - 30 Normal
    YELLOW = "YELLOW"    # 31 - 60 Caution
    ORANGE = "ORANGE"    # 61 - 80 High Risk
    RED = "RED"          # 81 - 100 Critical


class Point(BaseModel):
    x: int
    y: int


class Telemetry(BaseModel):
    robot_id: str = "R01"
    x: int = 2
    y: int = 2
    battery: float = 85.0
    sensor_health: float = 96.0
    communication_latency: float = 45.0
    communication_reliability: float = 98.0
    speed: float = 1.0
    obstacle_distance: float = 8.5
    obstacle_density: float = 0.12
    environment_risk: float = 15.0
    mission_priority: float = 0.8
    mission_progress: float = 0.0
    energy_consumption_rate: float = 1.2
    current_mode: ModeEnum = ModeEnum.NORMAL
    timestamp: float = 0.0


class RiskBreakdown(BaseModel):
    battery_risk: float = 0.0
    sensor_risk: float = 0.0
    communication_risk: float = 0.0
    obstacle_risk: float = 0.0
    environment_risk: float = 0.0
    physical_risk: float = 0.0              # Pure operating & physical hazard (0-100)
    mission_criticality: float = 0.0        # Mission context (0-100)
    risk_budget: float = 35.0               # Maximum risk tolerated for profile
    budget_exceeded: bool = False           # Budget status flag
    context_multiplier: float = 1.0         # Criticality amplification factor
    composite_risk: float = 0.0             # Unified Mission Risk Score (0-100)
    risk_level: RiskLevelEnum = RiskLevelEnum.GREEN
    anomaly_score: float = 0.0
    is_anomaly: bool = False
    risk_trend: str = "STABLE"              # STABLE | RISING | FALLING | RAPIDLY_RISING


class Explanation(BaseModel):
    primary_drivers: List[str] = []
    rationale: str = ""
    recommended_action: str = ""
    tradeoff_summary: Optional[str] = None


class Route(BaseModel):
    id: str
    points: List[Tuple[int, int]]
    length: float
    risk_cost: float
    energy_cost: float
    distance_cost: float = 0.0
    hazard_cost: float = 0.0
    clearance_cost: float = 0.0
    total_score: float
    risk_horizon: List[float] = []          # [Current, +5 cells, +10 cells, Goal]
    projected_risk: float = 0.0
    is_blocked: bool = False
    name: str = "Route"


class ComputeMetrics(BaseModel):
    cpu_percent: float = 0.0
    memory_mb: float = 0.0
    risk_eval_ms: float = 0.0
    anomaly_eval_ms: float = 0.0
    planner_eval_ms: float = 0.0
    total_cycle_ms: float = 0.0
    timestamp: float = 0.0


class MissionDecision(BaseModel):
    action: ActionEnum
    mode: ModeEnum
    reason: str
    selected_route_id: Optional[str] = None
    explanation: Explanation
    timestamp: float


class FaultEventRequest(BaseModel):
    model_config = {"extra": "allow"}
    event_type: str = "custom"
    params: Optional[Dict[str, Any]] = None


class WhatIfRequest(BaseModel):
    battery: float = Field(..., ge=0, le=100)
    sensor_health: float = Field(..., ge=0, le=100)
    communication_latency: float = Field(..., ge=0, le=1000)
    obstacle_density: float = Field(..., ge=0, le=1)
    environment_risk: float = Field(..., ge=0, le=100)
    mission_profile: str = "EMERGENCY_DELIVERY"


class WhatIfResponse(BaseModel):
    composite_risk: float
    risk_level: str
    breakdown: RiskBreakdown
    recommended_action: str
    operating_mode: str
    explanation: str
    tradeoff_advice: str


class MissionMetrics(BaseModel):
    mission_id: str
    status: str
    duration_seconds: float
    distance_traveled: float
    energy_consumed: float
    replanning_count: int
    near_miss_count: int
    collision_count: int
    avg_risk_score: float
    peak_risk_score: float
    degraded_autonomy_seconds: float
    baseline_comparison: Optional[Dict[str, Any]] = None


class SimulationState(BaseModel):
    mission_id: str
    mission_type: str
    mission_name: str
    robot_id: str
    x: int
    y: int
    telemetry: Telemetry
    risk: RiskBreakdown
    decision: MissionDecision
    current_route: List[Tuple[int, int]]
    candidate_routes: List[Route]
    dynamic_obstacles: List[Tuple[int, int]]
    static_obstacles: List[Tuple[int, int]]
    depot: Tuple[int, int]
    medical_camp: Tuple[int, int]
    safe_zone: Tuple[int, int]
    is_running: bool
    is_paused: bool
    sim_speed: float
    step_count: int
    metrics: MissionMetrics
    compute_metrics: ComputeMetrics = Field(default_factory=ComputeMetrics)
