from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

import pandas as pd

from src.predict import predict_for_new_rows


app = FastAPI(
    title="Freight Forecasting ML API",
    description="Real XGBoost freight rate forecasting service",
    version="1.0.0",
)


class PredictionRequest(BaseModel):
    origin: str
    destination: str
    vessel_type: str
    cargo_type: str
    date: str
    fuel_price_vlsfo_usd: Optional[float] = None
    dest_port_wait_hours: Optional[float] = None


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "freight-forecasting",
        "model": "real-xgboost",
    }


@app.post("/predict")
def predict(request: PredictionRequest):
    try:
        new_row = pd.DataFrame([{
            "timestamp": request.date,
            "origin_port": request.origin,
            "destination_port": request.destination,
            "vessel_type": request.vessel_type,
            "cargo_type": request.cargo_type,
            "freight_rate": float("nan"),
            "currency": "USD",
            "unit": "USD/Tonne",
            "fuel_price_vlsfo_usd": request.fuel_price_vlsfo_usd,
            "dest_port_wait_hours": request.dest_port_wait_hours,
            "origin_port_std": request.origin,
            "destination_port_std": request.destination,
            "cargo_type_std": request.cargo_type,
            "date": pd.to_datetime(request.date),
            "source_type": "PREDICTION_REQUEST",
        }])

        predictions = predict_for_new_rows(new_row)

        prediction = float(predictions.iloc[0])

        return {
            "success": True,
            "model": "real-xgboost",
            "prediction": prediction,
            "unit": "USD/Tonne",
            "route": {
                "origin": request.origin,
                "destination": request.destination,
            },
            "cargo_type": request.cargo_type,
            "vessel_type": request.vessel_type,
            "date": request.date,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )