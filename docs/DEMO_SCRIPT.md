# MIRA — Live Demonstration Script (YHACK'26 Challenge 17)

## Mission Objective
Demonstrate real-time autonomous robot mission risk assessment, continuous telemetry-driven governor actions, dynamic obstacle replanning, degraded autonomy handling, safe recovery, and empirical baseline benchmarking.

---

## Step-by-Step Presentation Flow

### Act 1: Mission Launch & Nominal Navigation
1. Open Mission Operations Dashboard at `http://localhost:5173`.
2. Select Mission Profile: **Emergency Medical Delivery** (Depot $\to$ Medical Camp).
3. Observe:
   - Robot **R01** moves at cruising speed (1.0 m/s).
   - Telemetry: Battery 85%, Sensor Health 96%, Latency 45ms.
   - Mission Risk Gauge: 18–24 / 100 (**GREEN / NORMAL**).

### Act 2: Dynamic Obstacle & Autonomous Replanning
1. Click **`[Dynamic Obstacle]`** on the Event Control Panel (or click directly on the grid ahead of the robot).
2. Observe:
   - Dynamic obstacle appears directly on the robot's upcoming path.
   - Obstacle risk spikes; Composite risk climbs to **ORANGE / HIGH RISK**.
   - Safety Governor commands **`REPLAN`**.
   - Robot dynamically switches trajectory to the bypass safety corridor without halting.
   - Decision Panel shows tradeoff: *+12.0m travel distance, -62% route risk exposure*.

### Act 3: Sensor Attenuation & Speed Throttling
1. Click **`[Degrade Sensor]`**.
2. Observe:
   - Perception health drops to 48%.
   - Safety Governor issues **`SLOW_DOWN`**.
   - Robot speed automatically drops to 0.5 m/s to expand the perception safety envelope.

### Act 4: Wireless Failure & Degraded Autonomy Mode
1. Click **`[Increase Comm Latency]`**.
2. Observe:
   - Ping reaches 480ms, packet reliability drops to 68%.
   - Current Operating Mode switches to **`DEGRADED AUTONOMY`** (pulsing amber badge).
   - Robot maintains local autonomous collision avoidance independently from base station teleoperation.

### Act 5: Compound Fault & Safe Zone Diversion
1. Click **`[Combined Fault]`**.
2. Observe:
   - Battery falls to 24%, crossing the safe-return reserve floor.
   - Safety Governor evaluates that reaching Medical Camp is unachievable without vehicle stranding.
   - Governor issues **`RETURN_TO_SAFE_ZONE`**.
   - Robot safely detours to the designated Purple Safe Zone at (4, 14).

### Act 6: Subsystem Recovery & Mission Continuation
1. Click **`[Recover All Subsystems & Clear Obstacles]`**.
2. Observe:
   - Subsystems return to nominal health (Battery 88%, Sensor 98%, Ping 38ms).
   - Risk drops back to **GREEN**.
   - Robot safely resumes navigation to Medical Camp.

### Act 7: What-If Sandbox & Baseline Comparison
1. Switch to **What-If Sandbox** tab:
   - Drag battery, sensor, and latency sliders to demonstrate instantaneous governor adaptation.
2. Switch to **Baseline vs MIRA** tab:
   - Show empirical metrics proving zero collisions, eliminated near-misses, and -82% risk reduction compared to naive shortest-path planners.

