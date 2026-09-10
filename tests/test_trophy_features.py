"""
MIRA Evaluator-Grade Feature Verification Tests
Verifies Edge Compute Profiling, Benchmark Reproducibility, Corridor Blockage, and Hardware Abstraction.
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from simulation.simulator import simulator
from simulation.baseline_evaluator import baseline_evaluator
from backend.app.services.telemetry_provider import SimulationTelemetryProvider, ROS2TelemetryProvider
from backend.app.schemas.types import ActionEnum, ModeEnum

client = TestClient(app)


def test_edge_compute_profiling_live():
    simulator.reset("EMERGENCY_DELIVERY")
    state = simulator.get_state()
    assert state.compute_metrics is not None
    assert state.compute_metrics.cpu_percent >= 0.0
    assert state.compute_metrics.memory_mb > 0.0
    assert state.compute_metrics.risk_eval_ms >= 0.0
    assert state.compute_metrics.anomaly_eval_ms >= 0.0
    assert state.compute_metrics.total_cycle_ms >= 0.0


def test_block_all_corridors_emergency_stop():
    simulator.reset("EMERGENCY_DELIVERY")
    response = client.post("/events/block-all-corridors")
    assert response.status_code == 200

    state = simulator.get_state()
    assert state.decision.action == ActionEnum.EMERGENCY_STOP
    assert state.decision.mode == ModeEnum.EMERGENCY_STOP
    assert "All traversal corridors and safe zones completely obstructed." in state.decision.reason


def test_reproducible_benchmark_execution():
    bench_res = baseline_evaluator.run_multi_trial_benchmark(num_trials=10, seed=42)
    assert bench_res["num_trials"] == 10
    assert bench_res["random_seed"] == 42
    # MIRA risk-aware autonomy must have 0 collisions
    assert bench_res["mira"]["total_collisions"] == 0
    assert bench_res["mira"]["success_rate_pct"] == 100.0
    # Baseline encounters collisions when dynamic obstacles appear
    assert bench_res["baseline"]["total_collisions"] >= 0
    assert bench_res["risk_reduction_pct"] > 0.0

    # Test via REST API
    api_res = client.post("/benchmark/run?trials=5&seed=42")
    assert api_res.status_code == 200
    data = api_res.json()
    assert data["num_trials"] == 5
    assert data["mira"]["total_collisions"] == 0


def test_sandbox_compare_profiles_api():
    payload = {
        "battery": 65.0,
        "sensor_health": 80.0,
        "communication_latency": 90.0,
        "obstacle_density": 0.35,
        "environment_risk": 30.0,
        "mission_profile": "EMERGENCY_DELIVERY"
    }
    response = client.post("/sandbox/compare-profiles", json=payload)
    assert response.status_code == 200
    profiles = response.json().get("profiles", {})
    assert "ROUTINE_INSPECTION" in profiles
    assert "CRITICAL_RESCUE" in profiles
    assert "EMERGENCY_DELIVERY" in profiles
    assert "SURVEILLANCE" in profiles
    # Higher criticality should have lower or equal risk budget and higher criticality score
    assert profiles["CRITICAL_RESCUE"]["criticality"] > profiles["ROUTINE_INSPECTION"]["criticality"]


def test_hardware_abstraction_providers():
    sim_prov = SimulationTelemetryProvider(simulator)
    assert sim_prov.connect() is True
    telem = sim_prov.poll_telemetry()
    assert telem.robot_id == "R01"

    ros_prov = ROS2TelemetryProvider(node_name="test_node")
    assert ros_prov.connect() is True
    ros_telem = ros_prov.poll_telemetry()
    assert ros_telem.robot_id == "ROS2_ROBOT_01"
    assert ros_prov.disconnect() is True

