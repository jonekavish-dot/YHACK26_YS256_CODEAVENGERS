"""
Unit tests for MIRA Risk Engine
"""
import pytest
from backend.app.services.risk_engine import RiskEngine
from backend.app.schemas.types import RiskLevelEnum


def test_risk_score_bounds():
    engine = RiskEngine()
    nominal_telemetry = {
        "x": 2,
        "y": 2,
        "battery": 90.0,
        "energy_consumption_rate": 1.1,
        "sensor_health": 98.0,
        "communication_latency": 40.0,
        "communication_reliability": 99.0,
        "obstacle_distance": 8.0,
        "obstacle_density": 0.05,
        "environment_risk": 10.0,
        "speed": 1.0,
    }
    breakdown = engine.evaluate(nominal_telemetry, mission_profile_key="EMERGENCY_DELIVERY")
    assert 0.0 <= breakdown.composite_risk <= 100.0
    assert breakdown.risk_level in [RiskLevelEnum.GREEN, RiskLevelEnum.YELLOW]


def test_battery_depletion_escalates_risk():
    engine = RiskEngine()
    high_battery = engine.compute_battery_risk(battery=90.0, consumption_rate=1.1, current_pos=(5, 5))
    low_battery = engine.compute_battery_risk(battery=20.0, consumption_rate=2.0, current_pos=(5, 5))
    assert low_battery > high_battery
    assert low_battery >= 75.0


def test_sensor_degradation_increases_risk():
    engine = RiskEngine()
    healthy = engine.compute_sensor_risk(sensor_health=98.0)
    degraded = engine.compute_sensor_risk(sensor_health=45.0)
    assert degraded > healthy
    assert degraded >= 60.0


def test_communication_degradation_escalates_risk():
    engine = RiskEngine()
    good_comm = engine.compute_communication_risk(latency_ms=30.0, reliability_pct=99.0)
    bad_comm = engine.compute_communication_risk(latency_ms=600.0, reliability_pct=65.0)
    assert bad_comm > good_comm
    assert bad_comm >= 70.0


def test_obstacle_proximity_escalates_risk():
    engine = RiskEngine()
    far_obs = engine.compute_obstacle_risk(obstacle_dist_m=8.0, obstacle_density=0.05, route_blocked=False)
    close_obs = engine.compute_obstacle_risk(obstacle_dist_m=0.8, obstacle_density=0.5, route_blocked=True)
    assert close_obs > far_obs
    assert close_obs >= 80.0


def test_mission_criticality_influences_risk():
    engine = RiskEngine()
    base_telemetry = {
        "x": 10,
        "y": 10,
        "battery": 75.0,
        "energy_consumption_rate": 1.2,
        "sensor_health": 85.0,
        "communication_latency": 60.0,
        "communication_reliability": 95.0,
        "obstacle_distance": 5.0,
        "obstacle_density": 0.15,
        "environment_risk": 25.0,
        "speed": 1.0,
    }
    routine = engine.evaluate(base_telemetry, mission_profile_key="ROUTINE_INSPECTION")
    rescue = engine.evaluate(base_telemetry, mission_profile_key="CRITICAL_RESCUE")
    assert rescue.composite_risk > routine.composite_risk

