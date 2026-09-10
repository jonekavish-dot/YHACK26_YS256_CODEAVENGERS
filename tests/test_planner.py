"""
Unit tests for MIRA Grid Planner and Route Scoring
"""
import pytest
from simulation.planner import GridPlanner
from backend.app.config import DEPOT_POS, MEDICAL_CAMP_POS


def test_a_star_finds_valid_path():
    planner = GridPlanner()
    path = planner.a_star(DEPOT_POS, MEDICAL_CAMP_POS)
    assert path is not None
    assert len(path) > 10
    assert path[0] == DEPOT_POS
    assert path[-1] == MEDICAL_CAMP_POS

    for pt in path:
        assert pt not in planner.static_obstacles


def test_dynamic_obstacle_blocks_and_forces_detour():
    planner = GridPlanner()
    direct_path = planner.a_star(DEPOT_POS, MEDICAL_CAMP_POS)
    assert direct_path is not None

    midpoint = direct_path[len(direct_path) // 2]
    planner.add_dynamic_obstacle(midpoint)

    detour_path = planner.a_star(DEPOT_POS, MEDICAL_CAMP_POS)
    assert detour_path is not None
    assert midpoint not in detour_path


def test_risk_aware_route_scoring_prefers_safer_corridor():
    planner = GridPlanner()
    routes = planner.generate_candidate_routes(DEPOT_POS, MEDICAL_CAMP_POS)
    assert len(routes) >= 1

    safe_route = planner.plan_safe_return((12, 14))
    assert safe_route is not None
    assert safe_route.points[-1] == (4, 14)

