"""
Unit tests for MIRA Safety Governor
"""
import pytest
from backend.app.services.safety_governor import SafetyGovernor
from backend.app.schemas.types import (
    Telemetry,
    RiskBreakdown,
    Route,
    ActionEnum,
    ModeEnum,
    RiskLevelEnum,
)


def test_safety_governor_nominal_continue():
    governor = SafetyGovernor()
    telemetry = Telemetry(battery=85.0, sensor_health=95.0, communication_latency=40.0)
    risk = RiskBreakdown(composite_risk=18.0, risk_level=RiskLevelEnum.GREEN)
    active_route = Route(id="r1", points=[(2, 2), (2, 3)], length=10.0, risk_cost=15.0, energy_cost=12.0, total_score=25.0)

    decision = governor.decide(
        telemetry=telemetry,
        risk=risk,
        active_route=active_route,
        candidate_routes=[active_route],
        safe_return_route=None,
    )
    assert decision.action == ActionEnum.CONTINUE
    assert decision.mode == ModeEnum.NORMAL


def test_safety_governor_degraded_autonomy():
    governor = SafetyGovernor()
    telemetry = Telemetry(battery=80.0, sensor_health=92.0, communication_latency=420.0, communication_reliability=70.0)
    risk = RiskBreakdown(composite_risk=52.0, communication_risk=72.0, risk_level=RiskLevelEnum.YELLOW)
    active_route = Route(id="r1", points=[(2, 2), (2, 3)], length=10.0, risk_cost=20.0, energy_cost=12.0, total_score=30.0)

    decision = governor.decide(
        telemetry=telemetry,
        risk=risk,
        active_route=active_route,
        candidate_routes=[active_route],
        safe_return_route=None,
    )
    assert decision.mode == ModeEnum.DEGRADED_AUTONOMY


def test_safety_governor_obstacle_triggers_replan_not_estop():
    governor = SafetyGovernor()
    telemetry = Telemetry(battery=75.0, sensor_health=90.0, communication_latency=45.0, obstacle_distance=1.2)
    risk = RiskBreakdown(composite_risk=65.0, obstacle_risk=85.0, risk_level=RiskLevelEnum.ORANGE)

    blocked_route = Route(id="r1", points=[(2, 2), (2, 3)], length=10.0, risk_cost=80.0, energy_cost=12.0, total_score=9999.0, is_blocked=True)
    safer_route = Route(id="r2", points=[(2, 2), (3, 2), (3, 3)], length=13.0, risk_cost=22.0, energy_cost=15.0, total_score=40.0, is_blocked=False)

    decision = governor.decide(
        telemetry=telemetry,
        risk=risk,
        active_route=blocked_route,
        candidate_routes=[blocked_route, safer_route],
        safe_return_route=None,
    )
    assert decision.action == ActionEnum.REPLAN
    assert decision.selected_route_id == "r2"


def test_safety_governor_critical_battery_returns_to_safe_zone():
    governor = SafetyGovernor()
    telemetry = Telemetry(battery=20.0, sensor_health=90.0, communication_latency=45.0)
    risk = RiskBreakdown(composite_risk=78.0, battery_risk=88.0, risk_level=RiskLevelEnum.ORANGE)

    active_route = Route(id="r1", points=[(2, 2), (20, 20)], length=35.0, risk_cost=20.0, energy_cost=40.0, total_score=50.0)
    safe_return_route = Route(id="safe", points=[(2, 2), (4, 14)], length=12.0, risk_cost=15.0, energy_cost=14.0, total_score=20.0)

    decision = governor.decide(
        telemetry=telemetry,
        risk=risk,
        active_route=active_route,
        candidate_routes=[active_route],
        safe_return_route=safe_return_route,
    )
    assert decision.action == ActionEnum.RETURN_TO_SAFE_ZONE
    assert decision.mode == ModeEnum.SAFE_RETURN

