import argparse

import pandas as pd
import xgboost as xgb

from . import config, data_loader
from .feature_engineering import FEATURE_COLUMNS, build_feature_table


def load_model():
    model = xgb.XGBRegressor(
        enable_categorical=True
    )

    model.load_model(str(config.MODEL_FILE))

    return (
        model,
        FEATURE_COLUMNS,
        config.CATEGORICAL_FEATURES,
    )


def predict_for_new_rows(new_rows: pd.DataFrame) -> pd.Series:

    new_rows = new_rows.copy()

    # Ensure date exists
    if "date" not in new_rows.columns:
        if "timestamp" in new_rows.columns:
            new_rows["date"] = pd.to_datetime(
                new_rows["timestamp"]
            )
        else:
            raise ValueError("Prediction rows must contain date.")

    new_rows["date"] = pd.to_datetime(
        new_rows["date"]
    )

    # Ensure numeric optional features
    for col in [
        "fuel_price_vlsfo_usd",
        "dest_port_wait_hours",
    ]:
        if col not in new_rows.columns:
            new_rows[col] = 0.0

        new_rows[col] = pd.to_numeric(
            new_rows[col],
            errors="coerce"
        ).fillna(0.0)

    # Load historical data
    raw = data_loader.load_all()

    history = raw["freight"].copy()

    # Combine historical + prediction rows
    combined = pd.concat(
        [
            history,
            new_rows
        ],
        ignore_index=True,
        sort=False,
    )

    combined = combined.sort_values(
        "date"
    ).reset_index(drop=True)

    raw["freight"] = combined

    # Build model features
    features_df = build_feature_table(raw)

    # Identify prediction rows
    if "source_type" in features_df.columns:

        result_rows = features_df[
            features_df["source_type"]
            == "PREDICTION_REQUEST"
        ].copy()

    else:

        result_rows = features_df.tail(
            len(new_rows)
        ).copy()

    if result_rows.empty:
        raise ValueError(
            "No prediction rows found after feature engineering."
        )

    # Make sure categorical columns are category dtype
    for col in config.CATEGORICAL_FEATURES:

        if col in result_rows.columns:

            result_rows[col] = (
                result_rows[col]
                .astype("category")
            )

    # Make numeric columns numeric
    for col in FEATURE_COLUMNS:

        if col not in config.CATEGORICAL_FEATURES:

            if col in result_rows.columns:

                result_rows[col] = pd.to_numeric(
                    result_rows[col],
                    errors="coerce"
                ).fillna(0.0)

    # Exact feature order
    X = result_rows[
        FEATURE_COLUMNS
    ].copy()

    # Final categorical conversion
    for col in config.CATEGORICAL_FEATURES:

        if col in X.columns:

            X[col] = X[col].astype("category")

    model, _, _ = load_model()

    predictions = model.predict(X)

    return pd.Series(
        predictions,
        index=result_rows.index,
        name="predicted_freight_rate",
    )


def main():

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--origin",
        required=True
    )

    parser.add_argument(
        "--destination",
        required=True
    )

    parser.add_argument(
        "--vessel_type",
        required=True
    )

    parser.add_argument(
        "--cargo_type",
        required=True
    )

    parser.add_argument(
        "--date",
        required=True
    )

    args = parser.parse_args()

    raw = data_loader.load_all()

    history = raw["freight"].copy()

    route_history = history[
        (
            history["origin_port_std"]
            == args.origin
        )
        &
        (
            history["destination_port_std"]
            == args.destination
        )
    ]

    fuel_price = 0.0
    wait_hours = 0.0

    if not route_history.empty:

        latest = route_history.iloc[-1]

        if "fuel_price_vlsfo_usd" in latest:
            fuel_price = pd.to_numeric(
                latest["fuel_price_vlsfo_usd"],
                errors="coerce"
            )

        if "dest_port_wait_hours" in latest:
            wait_hours = pd.to_numeric(
                latest["dest_port_wait_hours"],
                errors="coerce"
            )

    if pd.isna(fuel_price):
        fuel_price = 0.0

    if pd.isna(wait_hours):
        wait_hours = 0.0

    new_row = pd.DataFrame([{

        "timestamp": args.date,

        "origin_port": args.origin,

        "destination_port": args.destination,

        "origin_port_std": args.origin,

        "destination_port_std": args.destination,

        "vessel_type": args.vessel_type,

        "cargo_type": args.cargo_type,

        "cargo_type_std": args.cargo_type,

        "date": pd.to_datetime(args.date),

        "freight_rate": float("nan"),

        "currency": "USD",

        "unit": "USD/Tonne",

        "fuel_price_vlsfo_usd": float(fuel_price),

        "dest_port_wait_hours": float(wait_hours),

        "source_type": "PREDICTION_REQUEST",

    }])

    prediction = predict_for_new_rows(
        new_row
    )

    print(
        f"Predicted freight_rate: "
        f"{prediction.iloc[0]:.4f} USD/Tonne"
    )


if __name__ == "__main__":
    main()