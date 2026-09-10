"""
MIRA Hardware Abstraction Layer & Telemetry Provider Interfaces
Establishes a clean separation between the mission-level safety governor and the underlying data source.

In this laptop-based prototype:
- SimulationTelemetryProvider serves as the primary Digital Twin telemetry source.

Future Edge Deployment:
- ROS2TelemetryProvider: Subscribes to Nav2 /odom, /scan, /battery_state, /diagnostics.
- MicrocontrollerTelemetryProvider: Ingests direct serial/CAN/MQTT telemetry from embedded MCUs.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from ..schemas.types import Telemetry


class TelemetryProvider(ABC):
    """
    Abstract Base Class defining the contract for telemetry ingestion into MIRA.
    """

    def connect(self) -> bool:
        """Establish connection to telemetry source."""
        return True

    def disconnect(self) -> bool:
        """Close connection to telemetry source."""
        return True

    def poll_telemetry(self) -> Telemetry:
        """Convenience alias to poll latest standardized telemetry."""
        return self.get_latest_telemetry()

    @abstractmethod
    def get_latest_telemetry(self) -> Telemetry:
        """Return the most recent standardized robot operational telemetry frame."""
        pass

    @abstractmethod
    def inject_fault(self, fault_type: str, params: Optional[Dict[str, Any]] = None) -> None:
        """Inject an operational or environmental perturbation into the provider."""
        pass


class SimulationTelemetryProvider(TelemetryProvider):
    """
    Digital Twin Telemetry Provider.
    Generates realistic 2 Hz kinematic, sensor, RF, and battery state updates.
    """

    def __init__(self, simulator_instance=None):
        self._simulator = simulator_instance

    def set_simulator(self, simulator_instance):
        self._simulator = simulator_instance

    def get_latest_telemetry(self) -> Telemetry:
        if self._simulator is not None:
            return self._simulator.current_telemetry
        return Telemetry()

    def inject_fault(self, fault_type: str, params: Optional[Dict[str, Any]] = None):
        if self._simulator is None:
            return
        p = params or {}
        if fault_type == "obstacle":
            pos = (int(p["x"]), int(p["y"])) if "x" in p and "y" in p else None
            self._simulator.inject_dynamic_obstacle(pos)
        elif fault_type == "battery_drain":
            self._simulator.inject_battery_drain(float(p.get("battery", 28.0)))
        elif fault_type == "sensor_degradation":
            self._simulator.inject_sensor_degradation(float(p.get("sensor_health", 48.0)))
        elif fault_type == "communication_degradation":
            self._simulator.inject_communication_latency(
                float(p.get("latency", 480.0)),
                float(p.get("reliability", 68.0))
            )
        elif fault_type == "environment_risk":
            self._simulator.inject_environment_hazard(float(p.get("hazard", 85.0)))
        elif fault_type == "combined_fault":
            self._simulator.inject_combined_fault()
        elif fault_type == "recover":
            self._simulator.recover_system()


# --- Future Real Robot Deployment Interfaces (Stubbed for Architectural Completeness) ---

class ROS2TelemetryProvider(TelemetryProvider):
    """
    [FUTURE HARDWARE DEPLOYMENT]
    Subscribes to ROS2 /odom, /scan, /battery_state, /diagnostics topics.
    Translates ROS2 message types into MIRA Telemetry schema.
    """

    def __init__(self, node_name: str = "mira_ros2_node", ros_node=None):
        self.node_name = node_name
        self._node = ros_node
        self._connected = False

    def connect(self) -> bool:
        self._connected = True
        return True

    def disconnect(self) -> bool:
        self._connected = False
        return True

    def get_latest_telemetry(self) -> Telemetry:
        return Telemetry(robot_id="ROS2_ROBOT_01")

    def inject_fault(self, fault_type: str, params: Optional[Dict[str, Any]] = None) -> None:
        raise NotImplementedError("Fault injection in physical ROS2 systems utilizes topic fault-injection plugins.")


class MicrocontrollerTelemetryProvider(TelemetryProvider):
    """
    [FUTURE HARDWARE DEPLOYMENT]
    Ingests serial / CAN bus telemetry from real robot sensor hubs (e.g. STM32 / ESP32).
    """

    def __init__(self, serial_port: str = "COM3", baudrate: int = 115200):
        self.serial_port = serial_port
        self.baudrate = baudrate

    def get_latest_telemetry(self) -> Telemetry:
        return Telemetry(robot_id="MCU_ROBOT_01")

    def inject_fault(self, fault_type: str, params: Optional[Dict[str, Any]] = None) -> None:
        pass

