"""
Unit tests for Robot Digital Twin Simulator and Fault Injections
"""
import pytest
from simulation.simulator import RobotSimulator
from backend.app.schemas.types import ModeEnum, ActionEnum


def test_simulator_initialization_and_tick():
    sim = RobotSimulator()
    sim.reset("EMERGENCY_DELIVERY")
    assert sim.pos == (2, 2)
    assert sim.battery == 85.0
    assert sim.is_running is True

    sim.tick()
    assert sim.step_count == 1
    assert sim.pos != (2, 2) or sim.route_index >= 0


def test_simulator_dynamic_obstacle_injection():
    sim = RobotSimulator()
    sim.reset("EMERGENCY_DELIVERY")
    sim.inject_dynamic_obstacle()
    assert len(sim.planner.dynamic_obstacles) >= 1
    assert sim.active_route is not None


def test_simulator_battery_drain_and_safe_return():
    sim = RobotSimulator()
    sim.reset("EMERGENCY_DELIVERY")
    sim.inject_battery_drain(drop_to_pct=22.0)
    assert sim.battery == 22.0
    assert sim.current_risk.battery_risk >= 75.0
    assert sim.current_decision.action == ActionEnum.RETURN_TO_SAFE_ZONE
    assert sim.current_mode == ModeEnum.SAFE_RETURN


def test_simulator_sensor_degradation_slows_speed():
    sim = RobotSimulator()
    sim.reset("EMERGENCY_DELIVERY")
    sim.inject_sensor_degradation(health_pct=45.0)
    assert sim.sensor_health == 45.0
    assert sim.speed <= 0.6


def test_simulator_communication_degradation_triggers_degraded_autonomy():
    sim = RobotSimulator()
    sim.reset("EMERGENCY_DELIVERY")
    sim.inject_communication_latency(latency_ms=450.0, reliability_pct=70.0)
    assert sim.current_mode == ModeEnum.DEGRADED_AUTONOMY


def test_simulator_recovery():
    sim = RobotSimulator()
    sim.reset("EMERGENCY_DELIVERY")
    sim.inject_combined_fault()
    assert sim.battery <= 30.0
    sim.recover_system()
    assert sim.battery >= 85.0
    assert sim.sensor_health >= 95.0
    assert sim.comm_latency <= 50.0
    assert sim.current_mode == ModeEnum.NORMAL

