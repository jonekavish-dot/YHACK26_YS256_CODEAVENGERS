"""
MIRA REST API Endpoints
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from simulation.simulator import simulator
from simulation.baseline_evaluator import baseline_evaluator
from ..services.risk_engine import risk_engine
from ..services.safety_governor import safety_governor
from ..services.explanation_engine import explanation_engine
from ..models.database import db
from ..schemas.types import (
    SimulationState,
    MissionMetrics,
    WhatIfRequest,
    WhatIfResponse,
    FaultEventRequest,
    Telemetry,
    ActionEnum,
    ModeEnum,
    BenchmarkResponse,
)
from ..config import MISSION_PROFILES

router = APIRouter()


@router.get("/health")
def health_check() -> Dict[str, Any]:
    return {
        "status": "online",
        "service": "MIRA Mission Intelligence & Risk-Aware Autonomy",
        "version": "1.0.0",
        "simulator_running": simulator.is_running,
    }


@router.get("/robots")
def get_robots() -> List[Dict[str, Any]]:
    return [{
        "robot_id": simulator.robot_id,
        "model": "MIRA-UGV-Explorer-IV",
        "status": "ACTIVE" if simulator.is_running else "IDLE",
        "pos": [simulator.pos[0], simulator.pos[1]],
        "battery": simulator.battery,
    }]


@router.get("/missions")
def get_missions() -> Dict[str, Any]:
    return {
        "current_mission_id": simulator.mission_id,
        "available_profiles": [
            {
                "key": k,
                "name": v.name,
                "criticality_score": v.criticality_score,
                "risk_budget": v.risk_budget,
                "description": v.description,
            }
            for k, v in MISSION_PROFILES.items()
        ]
    }


@router.get("/mission/{mission_id}")
def get_mission(mission_id: str) -> Dict[str, Any]:
    state = simulator.get_state()
    return state.model_dump()


@router.get("/robot/{robot_id}/state")
def get_robot_state(robot_id: str) -> Dict[str, Any]:
    return simulator.get_state().model_dump()


@router.get("/risk/{mission_id}")
def get_risk(mission_id: str) -> Dict[str, Any]:
    return {
        "mission_id": simulator.mission_id,
        "risk": simulator.current_risk.model_dump(),
        "decision": simulator.current_decision.model_dump(),
    }


@router.get("/routes/{mission_id}")
def get_routes(mission_id: str) -> Dict[str, Any]:
    return {
        "active_route": simulator.active_route.model_dump() if simulator.active_route else None,
        "candidate_routes": [r.model_dump() for r in simulator.candidate_routes],
        "safe_return_route": simulator.safe_return_route.model_dump() if simulator.safe_return_route else None,
    }


# Simulation Controls
@router.post("/mission/start")
def start_mission(profile: str = "EMERGENCY_DELIVERY") -> Dict[str, Any]:
    simulator.reset(profile)
    return {"status": "started", "mission_id": simulator.mission_id, "profile": profile}


@router.post("/mission/pause")
def pause_mission() -> Dict[str, Any]:
    simulator.is_paused = True
    return {"status": "paused"}


@router.post("/mission/resume")
def resume_mission() -> Dict[str, Any]:
    simulator.is_paused = False
    return {"status": "resumed"}


@router.post("/mission/reset")
def reset_mission(profile: str = "EMERGENCY_DELIVERY") -> Dict[str, Any]:
    simulator.reset(profile)
    return {"status": "reset", "mission_id": simulator.mission_id}


@router.post("/mission/speed")
def set_simulation_speed(speed: float = Query(..., ge=0.5, le=10.0)) -> Dict[str, Any]:
    simulator.sim_speed = speed
    return {"status": "speed_updated", "speed": simulator.sim_speed}


# Event Injections
@router.post("/events/obstacle")
def inject_obstacle(req: Optional[FaultEventRequest] = None) -> Dict[str, Any]:
    pos = None
    if req:
        p = req.params or req.model_dump()
        if "x" in p and "y" in p and p["x"] is not None and p["y"] is not None:
            pos = (int(p["x"]), int(p["y"]))
    simulator.inject_dynamic_obstacle(pos)
    return {"status": "obstacle_injected", "dynamic_obstacles": list(simulator.planner.dynamic_obstacles)}


@router.post("/events/battery-drain")
def inject_battery_drain(req: Optional[FaultEventRequest] = None) -> Dict[str, Any]:
    level = 28.0
    if req:
        p = req.params or req.model_dump()
        if "battery" in p and p["battery"] is not None:
            level = float(p["battery"])
    simulator.inject_battery_drain(level)
    return {"status": "battery_drained", "battery": simulator.battery}


@router.post("/events/sensor-degradation")
def inject_sensor_degradation(req: Optional[FaultEventRequest] = None) -> Dict[str, Any]:
    health = 48.0
    if req:
        p = req.params or req.model_dump()
        if "sensor_health" in p and p["sensor_health"] is not None:
            health = float(p["sensor_health"])
        elif "health" in p and p["health"] is not None:
            health = float(p["health"])
    simulator.inject_sensor_degradation(health)
    return {"status": "sensor_degraded", "sensor_health": simulator.sensor_health}


@router.post("/events/communication-degradation")
def inject_comm_degradation(req: Optional[FaultEventRequest] = None) -> Dict[str, Any]:
    latency = 480.0
    reliability = 68.0
    if req:
        p = req.params or req.model_dump()
        if "latency" in p and p["latency"] is not None:
            latency = float(p["latency"])
        if "reliability" in p and p["reliability"] is not None:
            reliability = float(p["reliability"])
    simulator.inject_communication_latency(latency, reliability)
    return {
        "status": "comm_degraded",
        "latency": simulator.comm_latency,
        "reliability": simulator.comm_reliability,
    }


@router.post("/events/environment-risk")
def inject_environment_risk(req: Optional[FaultEventRequest] = None) -> Dict[str, Any]:
    hazard = 85.0
    if req:
        p = req.params or req.model_dump()
        if "hazard" in p and p["hazard"] is not None:
            hazard = float(p["hazard"])
    simulator.inject_environment_hazard(hazard)
    return {"status": "env_hazard_injected", "hazard": hazard}


@router.post("/events/combined-fault")
def inject_combined_fault() -> Dict[str, Any]:
    simulator.inject_combined_fault()
    return {"status": "combined_fault_injected"}


@router.post("/events/recover")
def recover_system() -> Dict[str, Any]:
    simulator.recover_system()
    return {"status": "system_recovered"}


# Metrics & Comparisons
@router.get("/metrics/{mission_id}")
def get_mission_metrics(mission_id: str) -> Dict[str, Any]:
    metrics = simulator.get_metrics()
    return metrics.model_dump()


@router.get("/audit-logs/{mission_id}")
def get_audit_logs(mission_id: str) -> Dict[str, Any]:
    decisions = db.get_recent_decisions(simulator.mission_id, limit=30)
    events = db.get_recent_events(simulator.mission_id, limit=30)
    return {
        "mission_id": simulator.mission_id,
        "decisions": decisions,
        "events": events,
    }


# What-If Sandbox Endpoint
@router.post("/what-if", response_model=WhatIfResponse)
def evaluate_what_if(req: WhatIfRequest) -> WhatIfResponse:
    sim_telemetry = Telemetry(
        robot_id="WHAT_IF_ROBOT",
        x=simulator.pos[0],
        y=simulator.pos[1],
        battery=req.battery,
        sensor_health=req.sensor_health,
        communication_latency=req.communication_latency,
        communication_reliability=max(0.0, 100.0 - (req.communication_latency / 10.0)),
        speed=1.0,
        obstacle_distance=max(0.5, 10.0 * (1.0 - req.obstacle_density)),
        obstacle_density=req.obstacle_density,
        environment_risk=req.environment_risk,
    )

    sim_risk = risk_engine.evaluate(
        telemetry=sim_telemetry.model_dump(),
        mission_profile_key=req.mission_profile,
        route_blocked=req.obstacle_density > 0.75,
    )

    sim_decision = safety_governor.decide(
        telemetry=sim_telemetry,
        risk=sim_risk,
        active_route=simulator.active_route,
        candidate_routes=simulator.candidate_routes,
        safe_return_route=simulator.safe_return_route,
        mission_profile_key=req.mission_profile,
    )

    tradeoff = (
        sim_decision.explanation.tradeoff_summary
        or "Maintain defensive posture to avert system hazard."
    )

    return WhatIfResponse(
        composite_risk=sim_risk.composite_risk,
        risk_level=sim_risk.risk_level.value,
        breakdown=sim_risk,
        recommended_action=sim_decision.action.value,
        operating_mode=sim_decision.mode.value,
        explanation=sim_decision.explanation.rationale,
        tradeoff_advice=tradeoff,
    )


@router.post("/events/block-all-corridors")
def inject_block_all_corridors() -> Dict[str, Any]:
    simulator.inject_block_all_corridors()
    return {"status": "all_corridors_blocked"}


@router.post("/benchmark/run", response_model=BenchmarkResponse)
def run_reproducible_benchmark(
    trials: int = Query(default=20, ge=1, le=100, description="Number of Monte Carlo trials to execute (1-100)"),
    seed: int = Query(default=42, description="Isolated random seed for reproducible benchmark execution"),
) -> BenchmarkResponse:
    results = baseline_evaluator.run_multi_trial_benchmark(num_trials=trials, seed=seed)
    return results


@router.post("/sandbox/compare-profiles")
def compare_profiles(req: WhatIfRequest) -> Dict[str, Any]:
    from backend.app.config import MISSION_PROFILES
    results = {}
    for key, prof in MISSION_PROFILES.items():
        sim_telemetry = Telemetry(
            robot_id="COMPARE_ROBOT",
            x=simulator.pos[0],
            y=simulator.pos[1],
            battery=req.battery,
            sensor_health=req.sensor_health,
            communication_latency=req.communication_latency,
            communication_reliability=max(0.0, 100.0 - (req.communication_latency / 10.0)),
            speed=1.0,
            obstacle_distance=max(0.5, 10.0 * (1.0 - req.obstacle_density)),
            obstacle_density=req.obstacle_density,
            environment_risk=req.environment_risk,
        )
        sim_risk = risk_engine.evaluate(
            telemetry=sim_telemetry.model_dump(),
            mission_profile_key=key,
            route_blocked=req.obstacle_density > 0.75,
        )
        sim_decision = safety_governor.decide(
            telemetry=sim_telemetry,
            risk=sim_risk,
            active_route=simulator.active_route,
            candidate_routes=simulator.candidate_routes,
            safe_return_route=simulator.safe_return_route,
            mission_profile_key=key,
        )
        results[key] = {
            "profile_name": prof.name,
            "criticality": prof.criticality_score,
            "risk_budget": prof.risk_budget,
            "composite_risk": sim_risk.composite_risk,
            "budget_exceeded": sim_risk.budget_exceeded,
            "risk_level": sim_risk.risk_level.value,
            "action": sim_decision.action.value,
            "mode": sim_decision.mode.value,
            "rationale": sim_decision.explanation.rationale,
        }
    return {"profiles": results}

