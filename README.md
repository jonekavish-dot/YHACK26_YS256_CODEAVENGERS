# MIRA — Mission Intelligence & Risk-Aware Autonomy

> **"Don't just navigate. Know when navigation becomes dangerous."**
>
> *YHACK'26 Software Track — Challenge 17: Autonomous Robot Mission Risk Assessment*

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

## Live Judge Demo Script (Step-by-Step)

Follow this deterministic sequence during evaluation:

1. **Initial Nominal State**:
   - Mission: *Emergency Medical Supply Delivery* (Depot $\to$ Medical Camp).
   - Observe robot **R01** moving along the optimal planned trajectory.
   - Telemetry shows Battery ~85%, Sensor ~96%, Comm ~45ms, Risk Score ~18-24 (GREEN / NORMAL).

2. **Event 1: Inject Dynamic Obstacle**:
   - Click `[Dynamic Obstacle]` in the Event Control Panel (or click any cell directly on the grid map).
   - *Observation*: Obstacle appears on the route. Risk elevates to YELLOW/ORANGE.
   - *Governor Action*: Triggers `REPLAN`. Robot bypasses obstacle via the alternative safety corridor.
   - *Audit Rationale*: Displays distance delta (+12m) vs risk reduction (-62%).

3. **Event 2: Drain Battery**:
   - Click `[Drain Battery]`.
   - *Observation*: Battery drops to 28% and consumption spikes.
   - *Governor Action*: Battery risk escalates. If near the return threshold, MIRA plans for safe fallback.

4. **Event 3: Degrade Sensor**:
   - Click `[Degrade Sensor]`.
   - *Observation*: Perception health falls to 48%.
   - *Governor Action*: Governor triggers `SLOW_DOWN` to 0.5 m/s to widen the safety reaction horizon.

5. **Event 4: Degrade Communication**:
   - Click `[Increase Comm Latency]`.
   - *Observation*: Ping reaches 480ms, packet reliability drops to 68%.
   - *Governor Action*: UI enters **`DEGRADED AUTONOMY`** mode with amber warning badge. Robot transitions to local fail-safe guidance.

6. **Event 5: Combined Fault & Safe Return**:
   - Click `[Combined Fault]`.
   - *Observation*: Severe multi-factor breakdown. Battery falls below safe reserve floor.
   - *Governor Action*: Governor selects `RETURN_TO_SAFE_ZONE` and diverts robot safely to the Purple Safe Zone at (4, 14).

7. **Event 6: Full Recovery**:
   - Click `[Recover All Subsystems & Clear Obstacles]`.
   - *Observation*: All systems restore to nominal health, risk drops to GREEN, and normal mission execution resumes.

8. **Explore What-If Sandbox & Baseline Comparison**:
   - Switch to the **What-If Sandbox** tab to dynamically test arbitrary slider values.
   - Switch to the **Baseline vs MIRA** tab to review the empirical simulation metrics.

---

## Project Verification

Run automated test suite:
```powershell
python -m pytest backend/tests -v
```
All 19 test suites covering risk bounds, battery depletion, sensor attenuation, communication latency, obstacle avoidance, safety governor policies, and digital twin kinematics pass with 100% success.

