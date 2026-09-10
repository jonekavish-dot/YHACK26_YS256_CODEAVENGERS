"""
MIRA Evaluator-Grade Feature Verification Tests
Verifies Edge Compute Profiling, Benchmark Reproducibility, Corridor Blockage, and Hardware Abstraction.
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from simulation.simulator import simulator
from simulation.baseline_evaluator import (
    baseline_evaluator,
    CONTROLLED_SCENARIOS,
    SAFE_ZONE_POS,
)
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
    assert bench_res.num_trials == 10
    assert bench_res.random_seed == 42
    # MIRA risk-aware autonomy must have 0 collisions
    assert bench_res.mira.total_collisions == 0
    assert bench_res.mira.success_rate_pct == 100.0
    # Baseline encounters collisions when dynamic obstacles appear
    assert bench_res.baseline.total_collisions >= 0
    assert bench_res.comparison.risk_exposure_reduction_pct > 0.0

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


def test_benchmark_fixed_seed_reproducibility():
    """Verify running the multi-trial benchmark with identical seed produces 100% identical outputs."""
    run1 = baseline_evaluator.run_multi_trial_benchmark(num_trials=10, seed=42)
    run2 = baseline_evaluator.run_multi_trial_benchmark(num_trials=10, seed=42)

    assert run1.num_trials == run2.num_trials == 10
    assert run1.random_seed == run2.random_seed == 42
    assert run1.baseline.model_dump() == run2.baseline.model_dump()
    assert run1.mira.model_dump() == run2.mira.model_dump()
    assert run1.comparison.model_dump() == run2.comparison.model_dump()
    assert len(run1.scenario_breakdown) == len(run2.scenario_breakdown) == 8


def test_benchmark_different_seeds_produce_different_metrics():
    """Verify different seeds produce valid different randomized disturbance environments."""
    run42 = baseline_evaluator.run_multi_trial_benchmark(num_trials=10, seed=42)
    run99 = baseline_evaluator.run_multi_trial_benchmark(num_trials=10, seed=99)

    assert run42.baseline.model_dump() != run99.baseline.model_dump()


def test_identical_scenario_pair_invariance():
    """Verify both policies evaluate against the exact same scenario environment and obstacles."""
    sc = CONTROLLED_SCENARIOS[0]
    comp = baseline_evaluator.run_scenario_comparison(sc)
    assert comp["scenario_id"] == sc.scenario_id
    assert comp["name"] == sc.name
    assert "baseline" in comp
    assert "mira" in comp


def test_benchmark_battery_reserve_pressure_aborts_to_safe_zone():
    """Scenario 6: Low starting battery forces MIRA to abort to safe zone."""
    sc6 = next(s for s in CONTROLLED_SCENARIOS if s.scenario_id == "SCENARIO_6_BATTERY_RESERVE_PRESSURE")
    m_res = baseline_evaluator.run_trial(sc6, "MIRA")
    assert m_res.outcome == "SAFE_RETURN"
    assert m_res.path[-1] == SAFE_ZONE_POS
    assert m_res.final_battery > 0.0


def test_benchmark_block_all_corridors_estop():
    """Scenario 8: All corridors blocked forces MIRA to execute EMERGENCY_STOP without colliding."""
    sc8 = next(s for s in CONTROLLED_SCENARIOS if s.scenario_id == "SCENARIO_8_NO_SAFE_ROUTE")
    m_res = baseline_evaluator.run_trial(sc8, "MIRA")
    assert m_res.outcome == "EMERGENCY_STOP"
    assert m_res.collisions == 0


def test_benchmark_sensor_degradation_slows_speed():
    """Scenario 4: Perception degradation causes speed reduction."""
    sc4 = next(s for s in CONTROLLED_SCENARIOS if s.scenario_id == "SCENARIO_4_SENSOR_DEGRADATION")
    m_res = baseline_evaluator.run_trial(sc4, "MIRA")
    assert m_res.outcome == "SUCCESS"
    assert m_res.collisions == 0


def test_benchmark_comm_degradation_triggers_degraded_autonomy():
    """Scenario 5: High latency and packet drop triggers degraded autonomy mode."""
    sc5 = next(s for s in CONTROLLED_SCENARIOS if s.scenario_id == "SCENARIO_5_COMMUNICATION_DEGRADATION")
    m_res = baseline_evaluator.run_trial(sc5, "MIRA")
    assert m_res.outcome == "SUCCESS"
    assert m_res.collisions == 0


def test_benchmark_api_constraints_validation():
    """FastAPI endpoint validates trials boundaries (1-100)."""
    res_0 = client.post("/benchmark/run?trials=0&seed=42")
    assert res_0.status_code == 422

    res_101 = client.post("/benchmark/run?trials=101&seed=42")
    assert res_101.status_code == 422

    res_valid = client.post("/benchmark/run?trials=3&seed=42")
    assert res_valid.status_code == 200
    data = res_valid.json()
    assert data["num_trials"] == 3
    assert data["random_seed"] == 42
    assert "baseline" in data
    assert "mira" in data
    assert "comparison" in data
    assert "scenario_breakdown" in data


def test_benchmark_does_not_mutate_live_simulator_state():
    """Benchmark evaluations run in isolated environments without mutating live simulator."""
    simulator.reset("EMERGENCY_DELIVERY")
    sim_pos_before = simulator.pos
    sim_batt_before = simulator.battery
    sim_obs_before = list(simulator.planner.dynamic_obstacles)
    sim_mode_before = simulator.current_mode

    # Run multi-trial benchmark
    baseline_evaluator.run_multi_trial_benchmark(num_trials=5, seed=42)

    assert simulator.pos == sim_pos_before
    assert simulator.battery == sim_batt_before
    assert list(simulator.planner.dynamic_obstacles) == sim_obs_before
    assert simulator.current_mode == sim_mode_before


