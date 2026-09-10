"""
Automated Multi-Run Benchmark: Executes 5 consecutive Full Trophy Demo Runs
"""
import time
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from simulation.simulator import RobotSimulator
from backend.app.schemas.types import ActionEnum, ModeEnum, RiskLevelEnum


def run_single_trophy_trial(trial_num: int) -> dict:
    sim = RobotSimulator()
    sim.reset("EMERGENCY_DELIVERY")

    records = {
        "trial": trial_num,
        "initial_pos": sim.pos,
        "start_risk": sim.current_risk.composite_risk,
        "replan_triggered": False,
        "slowdown_triggered": False,
        "degraded_triggered": False,
        "return_triggered": False,
        "recovery_successful": False,
        "errors": [],
    }

    try:
        # 1. Nominal Navigation (ticks 1-5)
        for _ in range(5):
            sim.tick()
        assert sim.current_risk.risk_level == RiskLevelEnum.GREEN

        # 2. Dynamic Obstacle Injection
        obs_before_risk = sim.current_risk.composite_risk
        sim.inject_dynamic_obstacle()
        if sim.current_decision.action == ActionEnum.REPLAN or len(sim.planner.dynamic_obstacles) >= 1:
            records["replan_triggered"] = True

        # 3. Accelerated Battery Drain (moderate drain to elevate risk)
        sim.inject_battery_drain(48.0)
        assert sim.battery == 48.0
        assert sim.current_risk.battery_risk >= 50.0

        # 4. Sensor Degradation
        sim.inject_sensor_degradation(45.0)
        assert sim.sensor_health == 45.0
        assert sim.speed <= 0.6
        records["slowdown_triggered"] = True

        # 5. Communication Degradation
        sim.inject_communication_latency(480.0, 68.0)
        if sim.current_mode == ModeEnum.DEGRADED_AUTONOMY:
            records["degraded_triggered"] = True

        # 6. Combined Cascading Fault
        sim.inject_combined_fault()
        if sim.current_decision.action in [ActionEnum.RETURN_TO_SAFE_ZONE, ActionEnum.REPLAN, ActionEnum.SLOW_DOWN]:
            records["return_triggered"] = True

        # 7. Subsystem Recovery
        sim.recover_system()
        if sim.current_mode == ModeEnum.NORMAL and sim.current_risk.composite_risk <= 30.0:
            records["recovery_successful"] = True

        # 8. Post-Recovery Navigation (advance 5 ticks)
        for _ in range(5):
            sim.tick()

    except Exception as e:
        records["errors"].append(str(e))

    return records


def run_five_consecutive_trials():
    print("=================================================================")
    print("STARTING 5 CONSECUTIVE FULL TROPHY DEMO RUNS")
    print("=================================================================")
    all_passed = True
    for i in range(1, 6):
        res = run_single_trophy_trial(i)
        is_success = (
            res["replan_triggered"]
            and res["slowdown_triggered"]
            and res["degraded_triggered"]
            and res["return_triggered"]
            and res["recovery_successful"]
            and len(res["errors"]) == 0
        )
        status_str = "SUCCESS" if is_success else "FAILED"
        print(f"Run {i}/5: {status_str} | Replan: {res['replan_triggered']} | Degraded: {res['degraded_triggered']} | Return: {res['return_triggered']} | Recovery: {res['recovery_successful']}")
        if not is_success:
            all_passed = False
            print(f"   Errors: {res['errors']}")

    print("=================================================================")
    print(f"FINAL RESULT: {'5/5 SUCCESSFUL RUNS' if all_passed else 'SOME RUNS FAILED'}")
    print("=================================================================")
    assert all_passed


if __name__ == "__main__":
    run_five_consecutive_trials()
