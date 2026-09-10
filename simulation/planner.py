"""
MIRA Risk-Aware A* Path Planner & Route Scoring Engine
"""
import heapq
import math
from typing import List, Tuple, Set, Optional, Dict
from backend.app.config import (
    GRID_WIDTH,
    GRID_HEIGHT,
    STATIC_OBSTACLES,
    HAZARD_ZONES,
    SAFE_ZONE_POS,
    MEDICAL_CAMP_POS,
)
from backend.app.schemas.types import Route


def heuristic(a: Tuple[int, int], b: Tuple[int, int]) -> float:
    dx = abs(a[0] - b[0])
    dy = abs(a[1] - b[1])
    return (dx + dy) + (1.414 - 2) * min(dx, dy)


class GridPlanner:
    def __init__(
        self,
        width: int = GRID_WIDTH,
        height: int = GRID_HEIGHT,
        static_obstacles: Optional[List[Tuple[int, int]]] = None,
    ):
        self.width = width
        self.height = height
        self.static_obstacles: Set[Tuple[int, int]] = set(
            static_obstacles if static_obstacles is not None else STATIC_OBSTACLES
        )
        self.dynamic_obstacles: Set[Tuple[int, int]] = set()
        self.hazard_zones = HAZARD_ZONES

    def set_dynamic_obstacles(self, obstacles: List[Tuple[int, int]]):
        self.dynamic_obstacles = set(obstacles)

    def add_dynamic_obstacle(self, pos: Tuple[int, int]):
        self.dynamic_obstacles.add(pos)

    def clear_dynamic_obstacles(self):
        self.dynamic_obstacles.clear()

    def is_blocked(self, pos: Tuple[int, int]) -> bool:
        if pos[0] < 0 or pos[0] >= self.width or pos[1] < 0 or pos[1] >= self.height:
            return True
        return pos in self.static_obstacles or pos in self.dynamic_obstacles

    def get_cell_hazard(self, pos: Tuple[int, int]) -> float:
        x, y = pos
        hazard = 0.0
        for z in self.hazard_zones:
            if z["x1"] <= x <= z["x2"] and z["y1"] <= y <= z["y2"]:
                hazard = max(hazard, float(z["hazard"]))
        return hazard

    def get_obstacle_proximity_penalty(self, pos: Tuple[int, int]) -> float:
        x, y = pos
        min_dist = float("inf")
        for ox, oy in self.dynamic_obstacles:
            d = math.hypot(x - ox, y - oy)
            if d < min_dist:
                min_dist = d
        if min_dist <= 1.0:
            return 80.0
        elif min_dist <= 2.0:
            return 40.0
        elif min_dist <= 3.0:
            return 15.0
        return 0.0

    def a_star(
        self,
        start: Tuple[int, int],
        goal: Tuple[int, int],
        risk_weight: float = 1.0,
        extra_blocked: Optional[Set[Tuple[int, int]]] = None,
    ) -> Optional[List[Tuple[int, int]]]:
        if self.is_blocked(start) or self.is_blocked(goal):
            return None

        blocked_set = set(self.static_obstacles | self.dynamic_obstacles)
        if extra_blocked:
            blocked_set |= extra_blocked

        open_set: List[Tuple[float, float, Tuple[int, int]]] = []
        heapq.heappush(open_set, (0.0, 0.0, start))
        came_from: Dict[Tuple[int, int], Tuple[int, int]] = {}
        g_score: Dict[Tuple[int, int], float] = {start: 0.0}

        directions = [
            (0, 1, 1.0), (1, 0, 1.0), (0, -1, 1.0), (-1, 0, 1.0),
            (1, 1, 1.414), (-1, 1, 1.414), (1, -1, 1.414), (-1, -1, 1.414)
        ]

        while open_set:
            _, current_g, current = heapq.heappop(open_set)

            if current == goal:
                path = [current]
                while current in came_from:
                    current = came_from[current]
                    path.append(current)
                path.reverse()
                return path

            if current_g > g_score.get(current, float("inf")):
                continue

            for dx, dy, move_cost in directions:
                neighbor = (current[0] + dx, current[1] + dy)
                if (
                    neighbor[0] < 0 or neighbor[0] >= self.width or
                    neighbor[1] < 0 or neighbor[1] >= self.height or
                    neighbor in blocked_set
                ):
                    continue

                if dx != 0 and dy != 0:
                    if (current[0] + dx, current[1]) in blocked_set and (current[0], current[1] + dy) in blocked_set:
                        continue

                cell_risk = self.get_cell_hazard(neighbor) + self.get_obstacle_proximity_penalty(neighbor)
                step_cost = move_cost + (risk_weight * (cell_risk / 20.0))
                tentative_g = current_g + step_cost

                if tentative_g < g_score.get(neighbor, float("inf")):
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    f_score = tentative_g + heuristic(neighbor, goal)
                    heapq.heappush(open_set, (f_score, tentative_g, neighbor))

        return None

    def evaluate_route(
        self,
        route_id: str,
        name: str,
        path: List[Tuple[int, int]],
        w_dist: float = 1.0,
        w_risk: float = 1.8,
        w_energy: float = 0.5,
    ) -> Route:
        if not path or len(path) < 2:
            return Route(
                id=route_id,
                name=name,
                points=path or [],
                length=0.0,
                risk_cost=100.0,
                energy_cost=100.0,
                total_score=9999.0,
                is_blocked=True,
            )

        length = 0.0
        total_risk = 0.0
        is_blocked = False

        for i in range(len(path) - 1):
            p1 = path[i]
            p2 = path[i + 1]
            seg_len = math.hypot(p2[0] - p1[0], p2[1] - p1[1])
            length += seg_len

            if p2 in self.dynamic_obstacles or p2 in self.static_obstacles:
                is_blocked = True

            hazard = self.get_cell_hazard(p2)
            prox_penalty = self.get_obstacle_proximity_penalty(p2)
            total_risk += (hazard + prox_penalty)

        avg_risk = total_risk / max(len(path) - 1, 1)
        normalized_risk = min(100.0, avg_risk)
        energy_cost = length * 1.2 + (avg_risk * 0.3)

        if is_blocked:
            total_score = 9999.0
        else:
            total_score = (w_dist * length) + (w_risk * normalized_risk) + (w_energy * energy_cost)

        return Route(
            id=route_id,
            name=name,
            points=path,
            length=round(length, 1),
            risk_cost=round(normalized_risk, 1),
            energy_cost=round(energy_cost, 1),
            total_score=round(total_score, 1),
            is_blocked=is_blocked,
        )

    def generate_candidate_routes(
        self,
        current_pos: Tuple[int, int],
        goal_pos: Tuple[int, int] = MEDICAL_CAMP_POS,
    ) -> List[Route]:
        routes: List[Route] = []

        path_a = self.a_star(current_pos, goal_pos, risk_weight=0.05)
        if path_a:
            routes.append(self.evaluate_route("route_a", "Route A (Direct)", path_a))

        path_b = self.a_star(current_pos, goal_pos, risk_weight=2.5)
        if path_b and path_b != path_a:
            routes.append(self.evaluate_route("route_b", "Route B (Safety Corridor)", path_b))

        avoid_cells: Set[Tuple[int, int]] = set()
        for x in range(10, 16):
            for y in range(0, 14):
                avoid_cells.add((x, y))
        path_c = self.a_star(current_pos, goal_pos, risk_weight=1.5, extra_blocked=avoid_cells)
        if path_c and path_c not in [path_a, path_b]:
            routes.append(self.evaluate_route("route_c", "Route C (Wide Perimeter)", path_c))

        if not routes and path_a:
            routes.append(self.evaluate_route("route_a", "Route A (Direct)", path_a))

        return routes

    def plan_safe_return(self, current_pos: Tuple[int, int]) -> Optional[Route]:
        path = self.a_star(current_pos, SAFE_ZONE_POS, risk_weight=1.5)
        if path:
            return self.evaluate_route("safe_return", "Safe Zone Evacuation", path)
        return None

