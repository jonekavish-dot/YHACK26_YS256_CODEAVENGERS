# MIRA Technical System Audit Report (YHACK'26 Challenge 17)

**Auditor Personas:**
- Senior Robotics Software Engineer
- Autonomous Systems Safety Engineer
- AI/ML Engineer
- Full-Stack QA Engineer
- UI/UX Product Designer

---

## 1. Executive Summary & Architecture Overview

MIRA (Mission Intelligence & Risk-Aware Autonomy) is designed as a mission-level safety governor for autonomous ground vehicles (UGVs) and robotics platforms. Rather than competing with geometric path planners (such as ROS2 Nav2 / MoveBase), MIRA sits above the navigation controller to determine whether mission execution remains safe under dynamically evolving operational, environmental, and physical constraints.

The repository is organized into five decoupled modules:
- **`backend/`**: FastAPI REST API, WebSocket telemetry streaming server, deterministic multi-factor risk engine, AI Isolation Forest anomaly detector, Safety Governor decision engine, explainability engine, and SQLite database persistence.
- **`simulation/`**: Robot Digital Twin kinematics simulation (2 Hz tick loop), 25x25 grid map environment, risk-aware A* path planner, shortest-path baseline evaluator, and scenario presets.
- **`frontend/`**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, and Recharts mission control operations dashboard.
- **`tests/`**: Pytest automated test suite (currently 19 unit tests passing).
- **`docs/`**: Architecture diagrams, API specifications, and live judge demo scripts.

---

## 2. Dependency & Environment Summary

### Backend
- **Python Version**: 3.14.3 (Windows x86_64)
- **FastAPI / Starlette**: 0.141.1 / 0.46.0 (Asynchronous REST API, CORS middleware, lifespan background broadcaster)
- **WebSockets / Uvicorn**: 16.0 / 0.48.0 (2 Hz live bi-directional simulation telemetry stream)
- **Pydantic**: 2.13.4 / pydantic-core 2.46.4 (Strict runtime data validation)
- **scikit-learn**: 1.9.0 (Isolation Forest anomaly detection on 9-dimensional operational telemetry)
- **NumPy / Pandas**: 2.4.6 / 3.0.5 (Numerical arrays, feature matrices, synthetic baseline generation)
- **NetworkX**: 3.6.1 (Graph algorithms and spatial topology support)
- **SQLite3**: Standard library (Persistent storage for missions, telemetry history, risk events, and decisions)

### Frontend
- **Node.js**: v24.14.1 / npm 11.15.0
- **React**: 19.2.0 (Component hierarchy, hooks, state management)
- **TypeScript**: 5.9.3 (Strict type checking)
- **Vite**: 8.3.0 (ESM development server and production bundler)
- **Tailwind CSS**: 3.4.19 (Dark operations mission control design system)
- **Lucide React**: 1.16.0 (High-density tactical iconography)
- **Recharts**: 3.8.0 (Live risk trajectory timeline area charts)

---

## 3. Current Feature Inventory

| Subsystem | Feature | Status | Implementation File |
| :--- | :--- | :--- | :--- |
| **Risk Assessment** | Multi-Factor Risk Engine (6 normalized factors) | Verified | `backend/app/services/risk_engine.py` |
| **Risk Assessment** | Mission Risk Budget & Profile Sensitivity | Verified | `backend/app/config.py` & `backend/app/services/safety_governor.py` |
| **AI / ML** | Isolation Forest Anomaly Detection | Verified | `backend/app/services/anomaly_engine.py` |
| **Decision Layer** | Safety Governor (CONTINUE, SLOW, REPLAN, DEGRADED, RETURN, E-STOP) | Verified | `backend/app/services/safety_governor.py` |
| **Decision Layer** | Explainability Engine (Telemetry drivers + Tradeoff analysis) | Verified | `backend/app/services/explanation_engine.py` |
| **Navigation** | Risk-Aware A* Grid Planner (Clearance fields & hazard penalties) | Verified | `simulation/planner.py` |
| **Simulation** | Robot Digital Twin Kinematics & Energy Burn Loop | Verified | `simulation/simulator.py` |
| **Simulation** | Fault Injection Suite (Obstacle, Battery, Sensor, Comm, Hazard, Combined) | Verified | `simulation/simulator.py` |
| **Benchmarking** | Empirical Baseline Comparison (MIRA vs Shortest-Path A*) | Verified | `simulation/baseline_evaluator.py` |
| **Persistence** | SQLite Mission, Telemetry & Audit Event Logging | Verified | `backend/app/models/database.py` |
| **API / Stream** | REST Endpoints & 2 Hz WebSocket Stream | Verified | `backend/app/api/routes.py` & `websocket.py` |
| **User Interface** | Tactical Grid Mission Map with interactive obstacle drop | Verified | `frontend/src/components/MissionMap.tsx` |
| **User Interface** | Circular Risk Gauge with status thresholds & anomaly badge | Verified | `frontend/src/components/RiskGauge.tsx` |
| **User Interface** | Normalized Factor Breakdown Cards & Live Telemetry Panel | Verified | `frontend/src/components/RiskBreakdown.tsx` & `TelemetryPanel.tsx` |
| **User Interface** | Decision & Explainability Panel with route tradeoffs | Verified | `frontend/src/components/DecisionPanel.tsx` |
| **User Interface** | Event Injection Control Panel | Verified | `frontend/src/components/EventControlPanel.tsx` |
| **User Interface** | Risk Trajectory Timeline Chart | Verified | `frontend/src/components/RiskTimeline.tsx` |
| **User Interface** | What-If Interactive Telemetry Sandbox | Verified | `frontend/src/components/WhatIfSimulator.tsx` |
| **User Interface** | Empirical Benchmark Comparison Tab | Verified | `frontend/src/components/BaselineComparison.tsx` |
| **User Interface** | Decision Audit Log Trail | Verified | `frontend/src/components/DecisionLog.tsx` |

---

## 4. Probable Bugs, Edge Cases & Integration Risks Identified

### A. Backend & Simulator Logic
1. **Empty Route Handling on Total Grid Obstruction**:
   - In `simulation/simulator.py:237`: `if decision.selected_route_id and self.active_route and decision.selected_route_id != self.active_route.id:`
   - *Risk*: If all routes to the goal are blocked, `self.active_route` is set to `None`. When the governor orders `RETURN_TO_SAFE_ZONE`, `self.active_route` is `None`, so the condition `self.active_route` evaluates to `False`. The robot fails to adopt the safe return path!
   - *Fix*: Allow route selection even if `self.active_route is None`: `if decision.selected_route_id and (self.active_route is None or decision.selected_route_id != self.active_route.id):`.

2. **Fault Event Request Parameter Serialization**:
   - In `backend/app/api/routes.py`, endpoints like `/events/battery-drain` expect `Optional[FaultEventRequest]`.
   - In `FaultEventRequest`: `event_type` was required without a default. If a client sends `{ params: { battery: 20 } }`, FastAPI returned HTTP 422.
   - *Fix*: Provide default `event_type: str = "fault"` and allow root-level payload extraction.

3. **Rapid Event Spamming & Race Conditions**:
   - When rapid clicks occur (e.g. clicking Obstacle 5 times in 200ms), `_replan_all_routes()` and `_evaluate_cycle()` run sequentially on a single thread. While Python's GIL avoids memory corruption, asynchronous WebSocket broadcasts during mid-evaluation could send partially updated route indices.
   - *Fix*: Add thread-safe / asyncio reentrancy lock around simulation state mutations during fault injections.

4. **Negative or Impossible Telemetry Inputs**:
   - What-If and API endpoints must clamp values: Battery strictly [0, 100], Sensor strictly [0, 100], Latency strictly [0, 2000], Hazard strictly [0, 100].

### B. UI/UX & Interaction Gaps
1. **Robot Visual Representation**:
   - The current robot marker is a simple circle with a ring. For a winning hackathon presentation, it needs an authentic robotic search-and-rescue rover visual (chassis, dual treads/wheels, lidar dome, front LED headlights, and directional radar sweep cone).
2. **Missing Evaluator Mode**:
   - Evaluators currently cannot see the raw mathematical weights, dynamic risk budget calculation, or Isolation Forest decision function values. Adding a toggleable **Evaluator Inspection Console** is crucial for judges.
3. **Missing Automated Demo Tour**:
   - A judge may want to click "Start Demo Tour" and watch MIRA autonomously guide the robot through the 90-second failure-and-recovery narrative with an on-screen timeline tracker.
4. **Visual Polish & Aerospace Command Center Hierarchy**:
   - Needs metallic/glass panel styling, subtle telemetry number transitions, and an interactive "How MIRA Thinks" pipeline view.

---

## 5. Actionable Plan for Next Phases

1. **Phase 2 & 3**: Add comprehensive integration tests (API $\to$ Simulator $\to$ Risk Engine $\to$ Governor $\to$ Planner $\to$ DB), fix edge cases (null route handling, parameter normalization).
2. **Phase 4 & 5**: Refine UI/UX with robotics command center design, glassmorphic styling, and semantic indicators.
3. **Phase 6 & 7**: Implement animated rover visual, directional scanning radar cone, dynamic obstacle detection pulse, and Evaluator Inspection Mode.
4. **Phase 8 & 9**: Build automated 90-second Demo Controller and perform stress/performance testing.
5. **Phase 10 & 11**: Execute 5 consecutive automated demo runs and generate `FINAL_QA_REPORT.md`.

