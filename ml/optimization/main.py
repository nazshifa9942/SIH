from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from optimizer import optimize


app = FastAPI(
    title="SIH26006 Optimization Service",
    version="1.0.0",
)


class OptimizationRequest(BaseModel):
    cargo: Dict[str, Any]
    originPort: Dict[str, Any]
    destinationPort: Dict[str, Any]
    vessels: list[Dict[str, Any]] = []
    availability: list[Dict[str, Any]] = []
    forecast: Dict[str, Any] | None = None
    originCongestion: Dict[str, Any] | None = None
    destinationCongestion: Dict[str, Any] | None = None
    feasibleVessels: list[Dict[str, Any]] = []
    constraintChecks: list[Dict[str, Any]] = []


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "sih26006-optimization",
        "engine": "OR-Tools CP-SAT",
        "model": "real-optimizer",
    }


@app.post("/optimize/vessel-plan")
def optimize_vessel_plan(request: OptimizationRequest):
    try:
        return optimize(request.model_dump())
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Optimization engine error: {exc}",
        ) from exc
