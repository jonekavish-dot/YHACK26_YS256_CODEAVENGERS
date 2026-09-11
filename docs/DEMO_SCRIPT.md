# MIRA — Live Demonstration & Team Presentation Script
**YHACK'26 Software Track — Challenge 17: Autonomous Robot Mission Risk Assessment**
**Team**: CODEAVENGERS &nbsp;|&nbsp; **Team ID**: YS526

---

## 🧭 Core Concept & Philosophy

> **"Traditional navigation asks where the robot should go.
> MIRA asks whether the robot can still safely complete the mission."**

### Causal Flow of Autonomy
$$\text{Telemetry Changes} \longrightarrow \text{Risk Shifts} \longrightarrow \text{MIRA Explains Why} \longrightarrow \text{Safety Governor Decides} \longrightarrow \text{Planner Executes} \longrightarrow \text{Mission Safe Continuation or Abort}$$

---

## 👥 Engineering Team Ownership Matrix (The 4 Questions)

Every subsystem of MIRA was engineered with strict modularity. During evaluation, each team member directly addresses their subsystem answering four fundamental questions:

### 1. Lead Architect & Backend Engineer — `jonekavish-dot`
- **What did I build?**
  The core Risk Assessment Engine (`backend/app/services/risk_engine.py`), the deterministic Safety Governor FSM (`backend/app/services/safety_governor.py`), Isolation Forest Anomaly Detection (`backend/app/services/ml_anomaly.py`), and the high-throughput asynchronous FastAPI REST/WebSocket streaming backend (`backend/app/main.py`).
- **Why is it needed?**
  Mobile robots cannot rely solely on distance geometry. They require an executive mission governor running *above* the planner that continuously synthesizes telemetry, evaluates multi-factor hazard weights, and commands deterministic, safety-critical actions without non-deterministic LLM hallucinations.
- **How does it work?**
  Calculates a continuous $0\text{–}100$ composite risk using weighted geometric combinations across 5 physical axes (battery state, perception health, comm latency, obstacle proximity, environmental hazard). The Safety Governor FSM deterministically maps composite risk and mission profile budgets to discrete operational states: `MAINTAIN_ROUTE`, `WARN_OPERATOR`, `SLOW_DOWN`, `REPLAN`, `RETURN_TO_SAFE_ZONE`, or `EMERGENCY_STOP`.
- **What evidence proves it?**
  $46/46$ passing automated unit/integration tests (`pytest tests/`), $0$ runtime crashes across $5/5$ continuous trophy validation runs, and sub-millisecond risk engine execution verified in integration test fixtures.

---

### 2. Frontend UI/UX Product Engineer — `Kamalesh-0208`
- **What did I build?**
  The interactive Mission Operations Tactical HUD (`frontend/`), implemented with React 19, TypeScript, TailwindCSS, and Vite. Features the 4-Pillars Decision Panel (`DecisionPanel.tsx`), human-readable Risk Gauge (`RiskGauge.tsx`), SVG differential-drive robot kinematics renderer (`GridCanvas.tsx`), interactive What-If Simulator (`WhatIfSimulator.tsx`), and automated Judge Demo Tour Controller (`DemoTourController.tsx`).
- **Why is it needed?**
  Autonomous systems fail in production when operators cannot interpret the robot's internal reasoning. Skeptical evaluators and field operators require immediate, transparent explainability answering *what* action was commanded, *why* it was chosen, *what* trade-off was accepted, and *what* the mission result is.
- **How does it work?**
  Subscribes to live WebSocket telemetry ($2\text{ Hz}$ update cycle), visualizes risk heatmaps and active hazard corridors directly on an interactive $25\times 25$ spatial grid, and extracts explainability records using structured causal provenance.
- **What evidence proves it?**
  Zero TypeScript compiler errors in strict mode, responsive SVG rendering synchronized at the $2\text{ Hz}$ simulation rate, and verified live scenario injection without client state desynchronization.

---

### 3. Robotics Simulation & Planner Engineer — `dineshbalu7f-glitch`
- **What did I build?**
  The continuous $25\times 25$ Digital Twin Simulation Environment (`simulation/environment.py`), the Risk-Aware Multi-Criteria A* Trajectory Planner (`simulation/planner.py`), dynamic obstacle generator, and the Monte Carlo Baseline Evaluator (`simulation/baseline_evaluator.py`).
- **Why is it needed?**
  To scientifically prove MIRA's superiority over standard ROS2 Nav2 / Euclidean A* navigation without relying on hand-wavy marketing claims. Evaluators demand rigorous, reproducible physics simulations where both the baseline and MIRA face identical dynamic disturbances.
- **How does it work?**
  The Digital Twin executes a $2\text{ Hz}$ step loop modeling differential-drive kinematics, continuous battery depletion based on velocity, sensor noise injection, and dynamic obstacles moving across path corridors. The Risk-Aware Planner computes cost-augmented paths using $f(n) = g(n) + h(n) + \alpha \cdot \text{Risk}(n) + \beta \cdot \text{Hazard}(n)$, steering trajectories away from dangerous zones.
- **What evidence proves it?**
  Reproducible 20-trial paired Monte Carlo empirical benchmark (`seed=42`) demonstrating:
  - **Goal Arrival Rate**: $100.0\%$ (Baseline: $85.0\%$)
  - **MIRA Collisions**: $0$ (Baseline: $3$)
  - **MIRA Near-Misses**: $3$ (Baseline: $37$)
  - **Physical Risk Exposure**: $2.2$ vs $25.5\text{ pts}$ ($-91.4\%$ reduction vs baseline).

---

### 4. QA, Verification & Reliability Engineer — `kvpranesh`
- **What did I build?**
  The automated test suite (`tests/`), end-to-end integration harness, multi-run reliability trophy verifier (`tests/verify_trophy_runs.py`), and Hardware Abstraction Layer compliance test suite (`tests/test_hal.py`).
- **Why is it needed?**
  Hackathon submissions frequently fail live demonstrations due to unhandled edge cases, null pointer exceptions, or state race conditions. Mission-critical autonomy requires verified fault tolerance and rigorous edge-case coverage.
- **How does it work?**
  Constructs parameterized test fixtures covering extreme edge cases: catastrophic sensor failure ($0\%$ health), severe battery exhaustion ($5\%$ SOC), total communication blackouts ($>1500\text{ms}$ latency), dynamic obstacle spawn directly on the robot's current coordinate, and invalid WebSocket payloads.
- **What evidence proves it?**
  $46$ test cases executed and passed in $<1.5\text{s}$, $5/5$ consecutive unattended end-to-end trophy runs without dropped frames or server memory leaks, and $100\%$ determinism verified across seeded simulations.

---

### 5. Systems Engineer & Technical Writer — `gowshikgunal22`
- **What did I build?**
  The Hardware Abstraction Layer specification (`backend/app/hal/`), edge deployment profiles (NVIDIA Jetson Orin Nano, Raspberry Pi 5), system architecture design document (`docs/ARCHITECTURE.md`), and comprehensive REST/WebSocket API documentation.
- **Why is it needed?**
  MIRA is engineered for real-world robotics deployment, not as a toy simulator. Evaluators need to know how MIRA bridges to physical ROS2 micro-ROS architectures, UART/CAN bus motor controllers, and edge compute envelopes.
- **How does it work?**
  Designed modular HAL interfaces (`RobotHardwareBridge`) separating simulated telemetry from physical ROS2 sensor topics (`/sensor_msgs/LaserScan`, `/sensor_msgs/BatteryState`, `/nav_msgs/Odometry`). Architected for lightweight edge execution on low-power ARM architectures without cloud dependencies.
- **What evidence proves it?**
  Complete executable HAL test fixtures (`tests/test_hal.py`) verifying synthetic and bridge interface compliance, zero external cloud dependency, and offline-first edge architecture.

---

## 🎬 The 8-Step Evaluator Demonstration Script

Follow this exact sequence during the live evaluator presentation (also automated via the **Automated Judge Demo Tour** in the UI header):

| Step | Phase | What the Presenter Says | Operational Event Injected | Observed System Response |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **MISSION** | *"This is the robot mission and its destination: R01 departs the Depot to deliver emergency medical supplies to the Field Station."* | Launch Mission (`EMERGENCY_DELIVERY`) | Robot sets off along nominal trajectory at $1.0\text{ m/s}$. Risk Gauge is **GREEN** ($18/100$). |
| **2** | **BASELINE** | *"Traditional distance-oriented navigation focuses solely on reaching the goal via the shortest Euclidean path, blind to subsystem health."* | Observe static baseline path overlay | Yellow dashed baseline route follows direct line through potential hazard corridors. |
| **3** | **FAULT** | *"Now we introduce real-world subsystem and environment degradation: a dynamic obstacle obstructs the corridor, and perception health drops."* | Click `[Dynamic Obstacle]` + `[Degrade Sensor]` | Obstacle appears ahead. Camera perception drops to $42\%$. Spatial and sensor risk surge. |
| **4** | **RISK** | *"MIRA detects the changing operating risk: the multi-factor engine continuously recalculates risk weights in real time."* | Observe Risk Breakdown Panel | Composite risk spikes to **HIGH** ($68/100$). Perception and Proximity factors illuminate in amber/rose. |
| **5** | **DECISION** | *"The Safety Governor explains and chooses the safer operational response: throttling speed when sensing degrades, then rerouting when the corridor is obstructed."* | Click `[Degrade Sensor]`, then `[Dynamic Obstacle]` | Perception degradation triggers **ACTION**: `SLOW_DOWN`. When corridor is obstructed, Governor commands **ACTION**: `REPLAN`. **WHY**: *Sensor degraded below safe threshold + path obstructed*. **TRADEOFF**: *+2.9m detour to avoid collision in tested scenario*. |
| **6** | **PLANNER** | *"The planner adapts the trajectory when necessary, generating a safe bypass corridor away from the hazard zone."* | Live Grid Canvas replan | Blue trajectory automatically arcs around the obstacle with a $2.0\text{m}$ clearance buffer. |
| **7** | **RESULT** | *"The robot either continues safely or aborts safely. Here, the robot bypasses the obstacle with zero contact and safely delivers supplies."* | Click `[Recover Subsystems]` | Subsystems recover, robot arrives safely at Medical Camp. **Zero collisions in tested run**. |
| **8** | **EVIDENCE** | *"Here is the empirical benchmark comparison: 20 randomized paired trials prove MIRA eliminates collisions (0 vs 3) and reduces physical risk exposure by 91.4%."* | Switch to **Baseline vs MIRA** Tab & Click `[Run Benchmark]` | Live Monte Carlo runs 20 paired trials: Baseline incurs 3 collisions and 37 near-misses (85% arrival); MIRA achieves 0 collisions and 3 near-misses (100% arrival), reducing risk exposure from 25.5 to 2.2 pts. |

---

## 💡 Quick Presets for Interactive Q&A ("What-If" Sandbox)

When evaluators ask questions about edge cases, switch to the **What-If Sandbox** tab and demonstrate instant deterministic responses:

1. **"What if the camera completely occludes in smoke?"**
   $\to$ Select *Degraded Camera $\to$ SLOW_DOWN*: Speed halves immediately to preserve stopping distance margin.
2. **"What if the battery depletes halfway through?"**
   $\to$ Select *Battery Low $\to$ RETURN_TO_BASE*: Evaluates energy floor ($25\%$) and commands safe abort to base rather than stranding.
3. **"What if wireless communication drops completely?"**
   $\to$ Select *Comms Drop $\to$ CAUTION / AUTONOMY*: Switches to local onboard fail-safe autonomy policy (`DEGRADED_AUTONOMY`) with widened safety margins.
4. **"What if all systems fail at once?"**
   $\to$ Select *Catastrophic $\to$ EMERGENCY_STOP*: Immediate kinematic halt, engaging fail-safe holding brake to protect bystanders and vehicle.
