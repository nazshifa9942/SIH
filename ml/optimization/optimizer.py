"""
SIH26006 real vessel/voyage optimization engine.

Uses OR-Tools CP-SAT for vessel/trip allocation.

The current Prisma schema has no route coordinates/distance table, so this
service deliberately does NOT invent transit time, fuel, demurrage, port,
or repositioning formulas.

The returned totalEstimatedCost is therefore a transparent charter-cost
score: dailyCharterCost * used trips. It is not a full voyage-cost model.
"""

from __future__ import annotations

from math import ceil
from typing import Any, Dict, List, Optional

from ortools.sat.python import cp_model

SCALE_MT = 1000  # supports 0.001 MT precision


def num(value: Any, default: Optional[float] = None) -> Optional[float]:
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def normalize_text(value: Any) -> str:
    return str(value or "").strip().lower()


def latest_availability(vessel_id: str, availability: List[Dict[str, Any]]):
    rows = [
        row for row in availability
        if str(row.get("vesselId")) == str(vessel_id)
    ]
    if not rows:
        return None
    rows.sort(key=lambda r: str(r.get("observedAt") or ""), reverse=True)
    return rows[0]


def availability_passes(
    vessel: Dict[str, Any],
    availability: List[Dict[str, Any]],
    deadline: Optional[str],
):
    status = normalize_text(vessel.get("availabilityStatus"))

    if status and status not in {"available", "active", "ready"}:
        return False, f"Vessel status is '{vessel.get('availabilityStatus')}'."

    latest = latest_availability(str(vessel.get("id")), availability)

    # Missing observations mean availability is unknown, not automatically
    # infeasible. The current project has no documented availability-write API.
    if latest is None:
        return True, "No availability observation supplied; availability is unknown."

    row_status = normalize_text(latest.get("status"))
    if row_status and row_status not in {"available", "active", "ready"}:
        return False, f"Latest availability status is '{latest.get('status')}'."

    if not deadline:
        return True, "Availability status passed."

    available_from = latest.get("availableFrom")
    available_until = latest.get("availableUntil")

    if available_from and str(available_from) > str(deadline):
        return False, "Vessel becomes available after the cargo deadline."

    if available_until and str(available_until) < str(deadline):
        return False, "Vessel availability ends before the cargo deadline."

    return True, "Vessel availability window covers the cargo deadline."


def geometric_checks(
    vessel: Dict[str, Any],
    origin_port: Dict[str, Any],
    destination_port: Dict[str, Any],
):
    checks = []
    all_passed = True

    for port, label in (
        (origin_port, "ORIGIN"),
        (destination_port, "DESTINATION"),
    ):
        for code, vessel_value, port_limit in (
            ("DRAFT", vessel.get("draftM"), port.get("maxDraftM")),
            ("LOA", vessel.get("loaM"), port.get("maxLoaM")),
            ("BEAM", vessel.get("beamM"), port.get("maxBeamM")),
        ):
            vv = num(vessel_value)
            limit = num(port_limit)

            if vv is None or limit is None:
                checks.append({
                    "code": f"{label}_{code}_NOT_EVALUATED",
                    "vesselId": vessel.get("id"),
                    "portId": port.get("id"),
                    "passed": True,
                    "message": f"{code} check skipped because a required value is missing.",
                })
                continue

            passed = vv <= limit
            all_passed = all_passed and passed

            checks.append({
                "code": f"{label}_{code}",
                "vesselId": vessel.get("id"),
                "portId": port.get("id"),
                "passed": passed,
                "message": (
                    f"{code} {vv:g} <= port limit {limit:g}."
                    if passed
                    else f"{code} {vv:g} exceeds port limit {limit:g}."
                ),
            })

    return all_passed, checks


def build_candidates(payload: Dict[str, Any]):
    cargo = payload.get("cargo") or {}
    vessels = payload.get("feasibleVessels") or payload.get("vessels") or []
    availability = payload.get("availability") or []
    origin_port = payload.get("originPort") or {}
    destination_port = payload.get("destinationPort") or {}

    quantity = num(cargo.get("quantityMt"), 0.0) or 0.0
    deadline = cargo.get("requiredDate")

    candidates = []
    checks = []

    for vessel in vessels:
        vessel_id = vessel.get("id")
        capacity = num(vessel.get("capacityMt"))
        charter = num(vessel.get("dailyCharterCost"), 0.0) or 0.0

        if not vessel_id or capacity is None or capacity <= 0:
            checks.append({
                "code": "VESSEL_CAPACITY",
                "vesselId": vessel_id,
                "passed": False,
                "message": "Vessel has no positive capacity.",
            })
            continue

        available_ok, availability_message = availability_passes(
            vessel, availability, deadline
        )

        checks.append({
            "code": "AVAILABILITY",
            "vesselId": vessel_id,
            "passed": available_ok,
            "message": availability_message,
        })

        if not available_ok:
            continue

        geometry_ok, geometry = geometric_checks(
            vessel, origin_port, destination_port
        )
        checks.extend(geometry)

        if not geometry_ok:
            continue

        max_trips = max(1, ceil(quantity / capacity))

        candidates.append({
            "vessel": vessel,
            "capacity": capacity,
            "max_trips": max_trips,
            "daily_charter_cost": max(0.0, charter),
        })

    return candidates, checks


def optimize(payload: Dict[str, Any]):
    cargo = payload.get("cargo") or {}
    quantity = num(cargo.get("quantityMt"))

    if quantity is None or quantity <= 0:
        return {
            "feasible": False,
            "recommendedPlan": [],
            "totalEstimatedCost": None,
            "numberOfTrips": 0,
            "constraintChecks": [{
                "code": "CARGO_QUANTITY",
                "passed": False,
                "message": "Cargo quantity must be positive.",
            }],
            "alternatives": [],
        }

    candidates, checks = build_candidates(payload)

    if not candidates:
        checks.append({
            "code": "NO_FEASIBLE_VESSEL",
            "passed": False,
            "message": "No vessel passed availability and port geometry checks.",
        })
        return {
            "feasible": False,
            "recommendedPlan": [],
            "totalEstimatedCost": None,
            "numberOfTrips": 0,
            "constraintChecks": checks,
            "alternatives": [],
        }

    model = cp_model.CpModel()
    quantity_units = int(round(quantity * SCALE_MT))

    variables = []
    used_vars = []
    cost_terms = []

    for vi, candidate in enumerate(candidates):
        capacity_units = int(round(candidate["capacity"] * SCALE_MT))

        for trip_no in range(1, candidate["max_trips"] + 1):
            qty = model.NewIntVar(
                0,
                capacity_units,
                f"quantity_v{vi}_t{trip_no}",
            )
            used = model.NewBoolVar(f"used_v{vi}_t{trip_no}")

            model.Add(qty > 0).OnlyEnforceIf(used)
            model.Add(qty == 0).OnlyEnforceIf(used.Not())

            # Trips on the same vessel are sequentially activated.
            if trip_no > 1:
                previous_used = variables[-1][3]
                model.Add(used <= previous_used)

            variables.append((vi, trip_no, qty, used))
            used_vars.append(used)

            charter_cost = max(
                0,
                int(round(candidate["daily_charter_cost"]))
            )
            cost_terms.append(used * charter_cost)

    model.Add(sum(qty for _, _, qty, _ in variables) == quantity_units)

    # Primary objective: minimum number of trips.
    # Secondary objective: lowest available daily-charter-cost score.
    max_daily_cost = max(
        [int(round(c["daily_charter_cost"])) for c in candidates] or [0]
    )
    trip_priority = max(1, max_daily_cost * max(1, len(candidates)) + 1)

    model.Minimize(
        sum(used_vars) * trip_priority + sum(cost_terms)
    )

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10
    solver.parameters.num_search_workers = 8

    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        checks.append({
            "code": "SOLVER",
            "passed": False,
            "message": "OR-Tools could not find a feasible allocation.",
        })
        return {
            "feasible": False,
            "recommendedPlan": [],
            "totalEstimatedCost": None,
            "numberOfTrips": 0,
            "constraintChecks": checks,
            "alternatives": [],
        }

    plan = []
    total_charter_score = 0.0

    for vi, trip_no, qty, used in variables:
        if not solver.Value(used):
            continue

        candidate = candidates[vi]

        plan.append({
            "vesselId": candidate["vessel"].get("id"),
            "vesselName": candidate["vessel"].get("name"),
            "tripNumber": trip_no,
            "quantityMT": round(solver.Value(qty) / SCALE_MT, 3),
        })

        total_charter_score += candidate["daily_charter_cost"]

    plan.sort(
        key=lambda item: (
            item["tripNumber"],
            item["vesselId"] or "",
        )
    )

    checks.append({
        "code": "DEADLINE_DURATION",
        "passed": True,
        "message": (
            "Transit duration was not invented because the current schema "
            "has no route distance/coordinates. Availability was checked "
            "against the deadline where availability data exists."
        ),
    })

    checks.append({
        "code": "COST_BASIS",
        "passed": True,
        "message": (
            "totalEstimatedCost = dailyCharterCost × used trips. "
            "This is a charter-cost score, not a full voyage-cost model."
        ),
    })

    return {
        "feasible": True,
        "recommendedPlan": plan,
        "totalEstimatedCost": round(total_charter_score, 2),
        "numberOfTrips": len(plan),
        "constraintChecks": checks,
        "alternatives": [],
    }
