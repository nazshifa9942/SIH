"""
Join the freight fixtures with the five auxiliary datasets and derive
the feature set the model trains on.

All auxiliary series are joined with a *backward* as-of merge (i.e. the
most recent value known on/before the fixture date), grouped by the
relevant key (destination port, vessel type, cargo type). This avoids
leaking future information into the training set.
"""

import numpy as np
import pandas as pd

from . import config


def _asof_merge_by_group(
    left: pd.DataFrame,
    right: pd.DataFrame,
    group_cols: list,
    value_cols: list,
    suffix: str,
) -> pd.DataFrame:
    """merge_asof grouped by one or more categorical keys."""
    left = left.sort_values("date").reset_index(drop=True)
    right = right.sort_values("date").reset_index(drop=True)

    renamed = {c: f"{c}{suffix}" for c in value_cols}
    right = right.rename(columns=renamed)

    merged = pd.merge_asof(
        left,
        right[["date", *group_cols, *renamed.values()]],
        on="date",
        by=group_cols,
        direction="backward",
    )
    return merged


def add_marine_fuel_features(freight: pd.DataFrame, marine_fuel: pd.DataFrame) -> pd.DataFrame:
    """Average marine fuel price at the destination port, as of the fixture date."""
    alias = {k: v["fuel_name"] for k, v in config.DEST_PORT_ALIASES.items()}
    fuel = marine_fuel.copy()
    fuel["destination_port_std"] = fuel["port_or_benchmark"].map(
        {v: k for k, v in alias.items()}
    )
    fuel = fuel.dropna(subset=["destination_port_std"])

    daily_avg = (
        fuel.groupby(["date", "destination_port_std"])["price"]
        .mean()
        .reset_index()
        .rename(columns={"price": "dest_port_marine_fuel_avg"})
    )

    return _asof_merge_by_group(
        freight,
        daily_avg,
        group_cols=["destination_port_std"],
        value_cols=["dest_port_marine_fuel_avg"],
        suffix="",
    )


def add_commodity_price_features(freight: pd.DataFrame, commodity_price: pd.DataFrame) -> pd.DataFrame:
    freight = freight.copy()
    freight["_commodity_std"] = freight["cargo_type_std"].map(config.CARGO_TO_COMMODITY)

    cp = (
        commodity_price.groupby(["date", "commodity_std"])["price"]
        .mean()
        .reset_index()
        .rename(columns={"commodity_std": "_commodity_std", "price": "commodity_price"})
    )

    merged = _asof_merge_by_group(
        freight.rename(columns={"_commodity_std": "_commodity_std"}),
        cp,
        group_cols=["_commodity_std"],
        value_cols=["commodity_price"],
        suffix="",
    )
    merged = merged.drop(columns=["_commodity_std"])
    return merged


def add_demand_proxy_features(freight: pd.DataFrame, economic_indicator: pd.DataFrame) -> pd.DataFrame:
    freight = freight.copy()
    freight["_indicator_name"] = freight["cargo_type_std"].map(config.CARGO_TO_DEMAND_PROXY)

    ei = economic_indicator[
        economic_indicator["indicator_name"].isin(config.CARGO_TO_DEMAND_PROXY.values())
    ][["date", "indicator_name", "value"]].rename(
        columns={"indicator_name": "_indicator_name", "value": "shipping_demand_proxy"}
    )

    merged = _asof_merge_by_group(
        freight,
        ei,
        group_cols=["_indicator_name"],
        value_cols=["shipping_demand_proxy"],
        suffix="",
    )
    merged = merged.drop(columns=["_indicator_name"])
    return merged


def add_port_congestion_features(freight: pd.DataFrame, port_congestion: pd.DataFrame) -> pd.DataFrame:
    alias = {k: v["congestion_vessel_name"] for k, v in config.DEST_PORT_ALIASES.items()}
    pc = port_congestion.copy()
    pc["destination_port_std"] = pc["port"].map({v: k for k, v in alias.items()})
    pc = pc.dropna(subset=["destination_port_std"])

    return _asof_merge_by_group(
        freight,
        pc,
        group_cols=["destination_port_std"],
        value_cols=["avg_wait_hours", "max_wait_hours", "port_congestion_index"],
        suffix="_pc",
    )


def add_vessel_availability_features(freight: pd.DataFrame, vessel_availability: pd.DataFrame) -> pd.DataFrame:
    alias = {k: v["congestion_vessel_name"] for k, v in config.DEST_PORT_ALIASES.items()}
    va = vessel_availability.copy()
    va["destination_port_std"] = va["port"].map({v: k for k, v in alias.items()})
    va = va.dropna(subset=["destination_port_std"])

    return _asof_merge_by_group(
        freight,
        va,
        group_cols=["destination_port_std", "vessel_type"],
        value_cols=["vessel_availability", "open_vessel", "regional_vessel_supply"],
        suffix="_va",
    )


def add_calendar_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month
    df["quarter"] = df["date"].dt.quarter
    df["day_of_week"] = df["date"].dt.dayofweek
    df["day_of_year"] = df["date"].dt.dayofyear
    return df


def add_route_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    """Lagged / rolling freight_rate for the same route+vessel+cargo, to
    capture momentum without leaking the current observation."""
    df = df.sort_values("date").copy()
    key = ["origin_port_std", "destination_port_std", "vessel_type", "cargo_type_std"]
    grp = df.groupby(key)[config.TARGET_COL]

    df["route_freight_rate_lag1"] = grp.shift(1)
    df["route_freight_rate_rolling7_mean"] = (
        grp.shift(1).groupby([df[k] for k in key]).transform(lambda s: s.rolling(7, min_periods=1).mean())
    )
    return df


def build_feature_table(raw: dict) -> pd.DataFrame:
    """Run the full join + feature pipeline and return the model-ready table."""
    df = raw["freight"].copy()

    df = add_marine_fuel_features(df, raw["marine_fuel"])
    df = add_commodity_price_features(df, raw["commodity_price"])
    df = add_demand_proxy_features(df, raw["economic_indicator"])
    df = add_port_congestion_features(df, raw["port_congestion"])
    df = add_vessel_availability_features(df, raw["vessel_availability"])
    df = add_calendar_features(df)
    df = add_route_lag_features(df)

    # Fill remaining gaps (e.g. cargo types with no commodity price series,
    # or the very first observation of a route with no lag yet) with -1 as
    # an explicit "unknown" flag that tree models can split on.
    numeric_feature_cols = [
        "dest_port_marine_fuel_avg",
        "commodity_price",
        "shipping_demand_proxy",
        "avg_wait_hours_pc",
        "max_wait_hours_pc",
        "port_congestion_index_pc",
        "vessel_availability_va",
        "open_vessel_va",
        "regional_vessel_supply_va",
        "route_freight_rate_lag1",
        "route_freight_rate_rolling7_mean",
    ]
    for col in numeric_feature_cols:
        df[f"{col}_missing"] = df[col].isna().astype(int)
        df[col] = df[col].fillna(-1)

    return df


FEATURE_COLUMNS = [
    "origin_port_std",
    "destination_port_std",
    "vessel_type",
    "cargo_type_std",
    "fuel_price_vlsfo_usd",
    "dest_port_wait_hours",
    "dest_port_marine_fuel_avg",
    "commodity_price",
    "shipping_demand_proxy",
    "avg_wait_hours_pc",
    "max_wait_hours_pc",
    "port_congestion_index_pc",
    "vessel_availability_va",
    "open_vessel_va",
    "regional_vessel_supply_va",
    "route_freight_rate_lag1",
    "route_freight_rate_rolling7_mean",
    "year",
    "month",
    "quarter",
    "day_of_week",
    "day_of_year",
    "dest_port_marine_fuel_avg_missing",
    "commodity_price_missing",
    "shipping_demand_proxy_missing",
    "avg_wait_hours_pc_missing",
    "max_wait_hours_pc_missing",
    "port_congestion_index_pc_missing",
    "vessel_availability_va_missing",
    "open_vessel_va_missing",
    "regional_vessel_supply_va_missing",
    "route_freight_rate_lag1_missing",
    "route_freight_rate_rolling7_mean_missing",
]
