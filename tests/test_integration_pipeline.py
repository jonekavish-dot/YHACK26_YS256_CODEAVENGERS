"""
MIRA End-to-End Integration, Edge Cases, Mission Sensitivity & Stress Test Suite
"""
import pytest
import math
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.risk_engine import RiskEngine
from backend.app.services.safety_governor import SafetyGovernor
from simulation.planner import GridPlanner
from simulation.simulator import RobotSimulator
from simulation.baseline_evaluator import BaselineEvaluator
from backend.app.schemas.types import (
    Telemetry,
    RiskBreakdown,
    Route,
    ActionEnum,
    ModeEnum,
    RiskLevelEnum,
)
from backend.app.config import (
    DEPOT_POS,
    MEDICAL_CAMP_POS,
    SAFE_ZONE_POS,
    MISSION_PROFILES,
)
from backend.app.models.database import db

client = TestClient(app)


# ============================================================================
# 1. Fresh Startup & API Endpoints Verification
# ============================================================================

def test_api_fresh_startup_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert "MIRA" in data["service"]


def test_api_robots_and_missions():
    res_robots = client.get("/robots")
    assert res_robots.status_code == 200
    robots = res_robots.json()
    assert len(robots) >= 1
    assert robots[0]["robot_id"] == "R01"

    res_missions = client.get("/missions")
    assert res_missions.status_code == 200
    missions = res_missions.json()
    assert "available_profiles" in missions
    assert len(missions["available_profiles"]) == 4


# ============================================================================
# 2. Risk Engine Deterministic Vectors (Isolated Factor Degradations)
# ============================================================================

def test_deterministic_risk_vectors():
    engine = RiskEngine()
    nominal = {
        "x": 2, "y": 2, "battery": 90.0, "energy_consumption_rate": 1.1,
        "sensor_health": 98.0, "communication_latency": 40.0, "communication_reliability": 99.0,
        "obstacle_distance": 10.0, "obstacle_density": 0.05, "environment_risk": 10.0, "speed": 1.0,
    }

    # Vector 0: Safe Baseline
    base_res = engine.evaluate(nominal, mission_profile_key="EMERGENCY_DELIVERY")
    assert base_res.composite_risk < 30.0
    assert base_res.risk_level == RiskLevelEnum.GREEN

    # Vector 1: Battery-Only Degradation
    bat_only = dict(nominal, battery=18.0, energy_consumption_rate=2.2)
    bat_res = engine.evaluate(bat_only, mission_profile_key="EMERGENCY_DELIVERY")
    assert bat_res.battery_risk > base_res.battery_risk
    assert bat_res.sensor_risk == base_res.sensor_risk
    assert bat_res.communication_risk == base_res.communication_risk

    # Vector 2: Sensor-Only Degradation
    sen_only = dict(nominal, sensor_health=35.0)
    sen_res = engine.evaluate(sen_only, mission_profile_key="EMERGENCY_DELIVERY")
    assert sen_res.sensor_risk > base_res.sensor_risk
    assert sen_res.battery_risk == base_res.battery_risk

    # Vector 3: Communication-Only Degradation
    com_only = dict(nominal, communication_latency=650.0, communication_reliability=60.0)
    com_res = engine.evaluate(com_only, mission_profile_key="EMERGENCY_DELIVERY")
    assert com_res.communication_risk > base_res.communication_risk
    assert com_res.sensor_risk == base_res.sensor_risk

    # Vector 4: Obstacle-Only Degradation
    obs_only = dict(nominal, obstacle_distance=0.6, obstacle_density=0.7)
    obs_res = engine.evaluate(obs_only, mission_profile_key="EMERGENCY_DELIVERY", route_blocked=True)
    assert obs_res.obstacle_risk > base_res.obstacle_risk
    assert obs_res.composite_risk > base_res.composite_risk

    # Vector 5: Combined Degradation
    combo = dict(nominal, battery=22.0, sensor_health=45.0, communication_latency=500.0, obstacle_distance=0.8)
    combo_res = engine.evaluate(combo, mission_profile_key="EMERGENCY_DELIVERY", route_blocked=True)
    assert combo_res.composite_risk >= 70.0
    assert combo_res.risk_level in [RiskLevelEnum.ORANGE, RiskLevelEnum.RED]


# ============================================================================
# 3. Edge Case Robustness (0, 100, Extreme Inputs)
# ============================================================================

def test_risk_engine_extreme_edge_cases():
    engine = RiskEngine()
    extreme_cases = [
        {"battery": 0.0, "sensor_health": 0.0, "communication_latency": 0.0, "communication_reliability": 0.0, "obstacle_distance": 0.0, "obstacle_density": 1.0, "environment_risk": 100.0},
        {"battery": 100.0, "sensor_health": 100.0, "communication_latency": 2000.0, "communication_reliability": 100.0, "obstacle_distance": 100.0, "obstacle_density": 0.0, "environment_risk": 0.0},
        {"battery": 1.0, "sensor_health": 1.0, "communication_latency": 999.0, "communication_reliability": 1.0, "obstacle_distance": 0.1, "obstacle_density": 0.99, "environment_risk": 99.0},
    ]

    for case in extreme_cases:
        t = dict(case, x=5, y=5, energy_consumption_rate=1.2, speed=1.0)
        res = engine.evaluate(t, mission_profile_key="EMERGENCY_DELIVERY")
        assert not math.isnan(res.composite_risk)
        assert 0.0 <= res.composite_risk <= 100.0
        assert 0.0 <= res.battery_risk <= 100.0
        assert 0.0 <= res.sensor_risk <= 100.0
        assert 0.0 <= res.communication_risk <= 100.0
        assert 0.0 <= res.obstacle_risk <= 100.0
        assert 0.0 <= res.environment_risk <= 100.0


# ============================================================================
# 4. Mission Context Sensitivity (Same Robot + Different Mission = Different Decision)
# ============================================================================

def test_mission_context_governor_differentiation():
    engine = RiskEngine()
    governor = SafetyGovernor()

    # Fixed intermediate telemetry
    telemetry = Telemetry(
        x=8, y=8, battery=68.0, sensor_health=72.0,
        communication_latency=180.0, communication_reliability=88.0,
        obstacle_distance=3.2, obstacle_density=0.3, environment_risk=30.0, speed=1.0
    )

    r1 = Route(id="r1", name="Route 1", points=[(8, 8), (22, 22)], length=20.0, risk_cost=35.0, energy_cost=25.0, total_score=40.0)
    r_safe = Route(id="safe", name="Safe", points=[(8, 8), (4, 14)], length=10.0, risk_cost=15.0, energy_cost=12.0, total_score=20.0)

    # 1. Routine Inspection (Risk Budget = 60)
    risk_routine = engine.evaluate(telemetry.model_dump(), mission_profile_key="ROUTINE_INSPECTION")
    decision_routine = governor.decide(telemetry, risk_routine, r1, [r1], r_safe, mission_profile_key="ROUTINE_INSPECTION")

    # 2. Critical Rescue (Risk Budget = 25)
    risk_rescue = engine.evaluate(telemetry.model_dump(), mission_profile_key="CRITICAL_RESCUE")
    decision_rescue = governor.decide(telemetry, risk_rescue, r1, [r1], r_safe, mission_profile_key="CRITICAL_RESCUE")

    # Routine should continue, while Critical Rescue must take a defensive stance (Slow down or Replan)!
    assert risk_rescue.composite_risk > risk_routine.composite_risk
    assert decision_routine.action == ActionEnum.CONTINUE
    assert decision_rescue.action in [ActionEnum.SLOW_DOWN, ActionEnum.REPLAN]


# ============================================================================
# 5. Safety Governor: Validation of All 6 Behavioral States
# ============================================================================

def test_safety_governor_all_six_states():
    gov = SafetyGovernor()
    r_nom = Route(id="r1", points=[(2, 2), (2, 3)], length=5.0, risk_cost=10.0, energy_cost=6.0, total_score=15.0)
    r_safe = Route(id="safe", points=[(2, 2), (4, 14)], length=12.0, risk_cost=10.0, energy_cost=12.0, total_score=20.0)

    # State 1: CONTINUE
    t1 = Telemetry(battery=90.0, sensor_health=95.0, communication_latency=40.0)
    d1 = gov.decide(t1, RiskBreakdown(composite_risk=15.0), r_nom, [r_nom], r_safe)
    assert d1.action == ActionEnum.CONTINUE

    # State 2: SLOW_DOWN (Caution risk / degraded sensor)
    t2 = Telemetry(battery=80.0, sensor_health=65.0, communication_latency=50.0)
    d2 = gov.decide(t2, RiskBreakdown(composite_risk=42.0, sensor_risk=55.0, risk_level=RiskLevelEnum.YELLOW), r_nom, [r_nom], r_safe)
    assert d2.action == ActionEnum.SLOW_DOWN

    # State 3: REPLAN (Obstacle on active route, alternative corridor exists)
    r_blocked = Route(id="r1", points=[(2, 2), (2, 3)], length=5.0, risk_cost=80.0, energy_cost=6.0, total_score=9999.0, is_blocked=True)
    r_alt = Route(id="r2", points=[(2, 2), (3, 2), (3, 3)], length=7.0, risk_cost=15.0, energy_cost=8.0, total_score=25.0, is_blocked=False)
    t3 = Telemetry(battery=80.0, sensor_health=90.0, communication_latency=50.0)
    d3 = gov.decide(t3, RiskBreakdown(composite_risk=55.0, obstacle_risk=80.0), r_blocked, [r_blocked, r_alt], r_safe)
    assert d3.action == ActionEnum.REPLAN
    assert d3.selected_route_id == "r2"

    # State 4: DEGRADED_AUTONOMY (Comms severed)
    t4 = Telemetry(battery=80.0, sensor_health=90.0, communication_latency=500.0, communication_reliability=60.0)
    d4 = gov.decide(t4, RiskBreakdown(composite_risk=52.0, communication_risk=75.0), r_nom, [r_nom], r_safe)
    assert d4.mode == ModeEnum.DEGRADED_AUTONOMY

    # State 5: RETURN_TO_SAFE_ZONE (Battery below reserve floor)
    t5 = Telemetry(battery=18.0, sensor_health=90.0, communication_latency=40.0)
    d5 = gov.decide(t5, RiskBreakdown(composite_risk=78.0, battery_risk=90.0), r_nom, [r_nom], r_safe)
    assert d5.action == ActionEnum.RETURN_TO_SAFE_ZONE
    assert d5.mode == ModeEnum.SAFE_RETURN

    # State 6: EMERGENCY_STOP (Critical hazard with no safe escape corridor)
    d6 = gov.decide(t5, RiskBreakdown(composite_risk=95.0, battery_risk=95.0), r_blocked, [r_blocked], None)
    assert d6.action == ActionEnum.EMERGENCY_STOP


# ============================================================================
# 6. Risk-Aware Route Tradeoff: Distance vs Risk Score
# ============================================================================

def test_risk_aware_route_tradeoff():
    planner = GridPlanner()
    # Route A (Direct, cuts near high hazard zone)
    route_a = planner.evaluate_route("route_a", "Direct", [(2, 2), (10, 8), (14, 4), (22, 22)], w_dist=1.0, w_risk=2.0)
    # Route B (Slightly longer detour, far from hazards)
    route_b = planner.evaluate_route("route_b", "Safe Perimeter", [(2, 2), (2, 22), (22, 22)], w_dist=1.0, w_risk=2.0)

    # Route B has lower risk cost
    assert route_b.risk_cost <= route_a.risk_cost


# ============================================================================
# 7. No-Safe-Route Boundary Testing
# ============================================================================

def test_no_safe_route_graceful_handling():
    planner = GridPlanner()
    # Fully wall in the robot at (5, 5)
    wall_in = [(4, 4), (4, 5), (4, 6), (5, 4), (5, 6), (6, 4), (6, 5), (6, 6)]
    planner.set_dynamic_obstacles(wall_in)

    path = planner.a_star((5, 5), MEDICAL_CAMP_POS)
    assert path is None

    routes = planner.generate_candidate_routes((5, 5), MEDICAL_CAMP_POS)
    assert all(r.is_blocked for r in routes) or len(routes) == 0


# ============================================================================
# 8. Rapid Event Stress Test & Simulation Recovery
# ============================================================================

def test_rapid_event_stress_and_recovery():
    sim = RobotSimulator()
    sim.reset("EMERGENCY_DELIVERY")

    # Rapid consecutive injections
    sim.inject_dynamic_obstacle()
    sim.inject_dynamic_obstacle()
    sim.inject_battery_drain(30.0)
    sim.inject_sensor_degradation(50.0)
    sim.inject_communication_latency(450.0, 70.0)
    sim.inject_environment_hazard(80.0)
    sim.inject_combined_fault()

    # Simulator must remain running or in safe return without crashing
    assert sim.battery <= 30.0
    assert sim.current_risk.composite_risk >= 65.0
    assert sim.current_decision.action in [ActionEnum.RETURN_TO_SAFE_ZONE, ActionEnum.REPLAN, ActionEnum.SLOW_DOWN]

    # Full recovery
    sim.recover_system()
    assert sim.battery >= 85.0
    assert sim.sensor_health >= 95.0
    assert sim.comm_latency <= 50.0
    assert sim.current_mode == ModeEnum.NORMAL
    assert sim.current_risk.composite_risk <= 30.0


# ============================================================================
# 9. Database Audit Trail Persistence
# ============================================================================

def test_database_persistence():
    sim = RobotSimulator()
    sim.reset("EMERGENCY_DELIVERY")
    sim.inject_dynamic_obstacle()

    events = db.get_recent_events(sim.mission_id, limit=10)
    decisions = db.get_recent_decisions(sim.mission_id, limit=10)

    assert len(events) >= 2  # MISSION_START and DYNAMIC_OBSTACLE
    assert any(e["event_type"] == "DYNAMIC_OBSTACLE" for e in events)
    assert len(decisions) >= 1

