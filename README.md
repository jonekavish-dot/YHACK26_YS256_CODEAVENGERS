# MIRA — Mission Intelligence & Risk-Aware Autonomy

> **"Don't just navigate. Know when navigation becomes dangerous."**
>
> *YHACK'26 Software Track — Challenge 17: Autonomous Robot Mission Risk Assessment*  
> **Team**: CODEAVENGERS  
> **Team ID**: YS526

---

## Executive Summary

Conventional autonomous robot navigation stacks (e.g. ROS2 Nav2) excel at geometric questions: *"Which trajectory is shortest to reach the goal?"*

However, in harsh industrial operations, disaster relief, and dynamic outdoor environments, robots encounter gradual battery degradation, camera/lidar attenuation, wireless RF interference, and emerging environmental hazards. Conventional shortest-path planners continue blindly along dangerous paths until catastrophic collision or vehicle stranding occurs.

**MIRA** is a mission-level safety governor and decision layer operating above the navigation stack. MIRA continuously fuses:
1. **Battery Reserve Margin** vs safe-return requirements
2. **Perception Sensor Health** & confidence
3. **Communication Latency & Reliability**
4. **Spatial Obstacle Hazard & Density**
5. **Environmental Terrain & Hazard Zones**
6. **Mission Criticality & Risk Budget**
7. **AI Telemetry Anomaly Detection (Isolation Forest)**

MIRA dynamically calculates a normalized **0–100 Mission Risk Score**, produces **explainable trade-off justifications**, and autonomously enforces safety actions: `CONTINUE`, `SLOW_DOWN`, `REPLAN`, `DEGRADED_AUTONOMY`, `RETURN_TO_SAFE_ZONE`, or `EMERGENCY_STOP`.

---

## Key Differentiators

- **Mission Criticality Context**: The exact same physical robot state triggers different actions depending on mission priority (e.g. a routine inspection continues through moderate risks, whereas an emergency medical delivery immediately replans to safety corridors).
- **Graceful Degraded Autonomy**: When communications degrade or sever, MIRA does not freeze; it shifts to an onboard defensive safety policy (reduces speed by 40%, expands obstacle clearance margins, and navigates autonomously).
- **Proactive Safe Return**: Monitors energy consumption rate and predicts the point of no return before the vehicle is stranded in the field.
- **Empirical Baseline Comparison**: Real-time simulated benchmarking proving how MIRA mitigates collisions and cuts risk exposure compared to naive shortest-path planners.
- **Interactive Evaluator Diagnostics**: Transparent mathematical formulas, dynamic risk budgets, and ML decision scores exposed directly to judges.

---

## Team & Modular Project Architecture

The codebase is organized into 5 clean, decoupled modules designed for parallel development:

```
d:/Y-HACK 26/
├── backend/          # [Member 1 - Team Lead] FastAPI REST API, WebSocket stream, Multi-Factor Risk Engine,
│                     #   Safety Governor FSM, Isolation Forest ML Anomaly Engine, SQLite persistence
├── frontend/         # [Member 2] React 19 + TypeScript + Vite + Tailwind CSS tactical mission HUD,
│                     #   custom SVG UGV rover, interactive grid, charts, 85s demo tour, evaluator mode
├── simulation/       # [Member 3] Robot Digital Twin kinematics (2 Hz), 25x25 grid, Risk-Aware A* planner,
│                     #   shortest-path baseline evaluator, fault injection scenarios
├── tests/            # [Member 4] 29 automated tests (19 unit tests + 10 full integration pipeline tests)
└── docs/             # [Member 5] Architecture specifications, REST/WebSocket API specs, judge presentation script
```

---

## High-Level Architecture

```
                          MIRA
                           |
                  Mission Manager & Digital Twin
                           |
               +-----------+-----------+
               |           |           |
           Telemetry   Environment   Mission Profile
               |           |           |
               +-----------+-----------+
                           |
               +-----------------------+
               |  Hybrid Risk Engine   |
               |                       |
               |  Deterministic Multi- |
               |  Factor Rules (0-100) |
               |          +            |
               |  Isolation Forest ML  |
               +-----------+-----------+
                           |
                  Mission Risk Score
                           |
                    Safety Governor
                           |
           +---------------+---------------+
           |         |          |          |
       Continue   Slow Down   Replan   Degraded Mode / Safe Return
                           |
                   A* Risk Planner
                           |
                    Robot Action
                           |
                  Live Telemetry Loop
```

---

## Quick Start (Run Locally)

### Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js 18+ (Tested on Node.js 24)

### 1. Start Backend
```powershell
cd "d:\Y-HACK 26"
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
Backend API will be live at: `http://localhost:8000`  
Interactive API Docs (Swagger): `http://localhost:8000/docs`  
WebSocket Stream: `ws://localhost:8000/ws`

### 2. Start Frontend Dashboard
```powershell
cd "d:\Y-HACK 26\frontend"
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## Live Judge Evaluation & Demo Walkthrough

### Option A: Automated 85-Second Demo Tour (Recommended for Judges)
1. In the top-right header, click **`Start Demo Tour`** (or press the Play button on the Demo Tour banner).
2. Watch MIRA autonomously execute all 6 mission phases with visual countdown, milestone chips, and real-time state transitions:
   - **Phase 1: Nominal Start** (Green status, ~22 risk, optimal route)
   - **Phase 2: Dynamic Obstacle Injection** (Sudden barrier, risk elevation, autonomous `REPLAN`)
   - **Phase 3: Battery Degradation** (Consumption increase, caution envelope)
   - **Phase 4: Sensor Degradation** (Perception health drop, governor enforces `SLOW_DOWN`)
   - **Phase 5: Comm Degradation** (High latency, switch to `DEGRADED_AUTONOMY` mode)
   - **Phase 6: Combined Critical Fault** (Battery reserve breached, autonomous `RETURN_TO_SAFE_ZONE`)
   - **Phase 7: Full System Recovery** (Nominal state restored, mission continues)

### Option B: Interactive Manual Evaluation
1. **Initial Nominal State**: Observe robot **R01** moving along the optimal planned trajectory. Telemetry shows Battery ~85%, Sensor ~96%, Comm ~45ms, Risk Score ~18-24 (GREEN / NORMAL).
2. **Inject Dynamic Obstacle**: Click `[Dynamic Obstacle]` in the Event Control Panel (or click any empty cell directly on the 25x25 grid map). Obstacle appears, risk elevates, and MIRA triggers `REPLAN` via an alternative safety corridor with trade-off justification (+12m distance vs -62% risk).
3. **Drain Battery**: Click `[Drain Battery]`. Battery drops to 48% with consumption spike, driving battery risk into the caution envelope.
4. **Degrade Sensor**: Click `[Degrade Sensor]`. Perception health falls to 48%, triggering `SLOW_DOWN` to 0.5 m/s to widen safety reaction time.
5. **Degrade Communication**: Click `[Increase Comm Latency]`. Latency reaches 480ms, packet reliability drops to 68%, triggering **`DEGRADED AUTONOMY`** mode.
6. **Combined Fault & Safe Return**: Click `[Combined Fault]`. Battery falls below safe reserve floor, triggering autonomous `RETURN_TO_SAFE_ZONE` to the Purple Safe Zone at (4, 14).
7. **Full Recovery**: Click `[Recover All Subsystems & Clear Obstacles]` to restore nominal health and resume mission.
8. **Evaluator Mode & How MIRA Thinks**: Click `[Evaluator Mode]` in the header to inspect raw mathematical weights and Isolation Forest decision scores, or click `[How MIRA Thinks]` to inspect the 7-stage perception-to-action signal pipeline.
9. **What-If Sandbox & Baseline Comparison**: Switch to the **What-If Sandbox** to test arbitrary slider values, or **Baseline vs MIRA** to review empirical collision avoidance metrics.

---

## Project Verification

### 1. Automated Test Suite (29/29 Pass)
Run all unit and integration tests:
```powershell
python -m pytest tests -v
```
All **29/29 tests pass** with 100% success (19 unit tests covering risk bounds, battery depletion, sensor attenuation, comm latency, obstacle avoidance, safety governor policies, kinematics + 10 integration tests covering REST API, deterministic risk vectors, edge cases, context sensitivity, 6 governor states, route trade-offs, SQLite persistence, and baseline benchmarking).

### 2. Full Trophy Demo Multi-Run Validation (5/5 Pass)
Run the 5-cycle consecutive demo validation test:
```powershell
python tests/verify_trophy_runs.py
```
All **5/5 consecutive end-to-end runs pass** (100.0% reliability).

