"""
Load the six raw CSVs used for freight rate forecasting.
"""

import pandas as pd

from . import config


def load_freight() -> pd.DataFrame:
    df = pd.read_csv(config.FREIGHT_FILE, parse_dates=["date"])
    return df


def load_marine_fuel() -> pd.DataFrame:
    df = pd.read_csv(config.MARINE_FUEL_FILE, parse_dates=["date"])
    return df


def load_commodity_price() -> pd.DataFrame:
    df = pd.read_csv(config.COMMODITY_PRICE_FILE, parse_dates=["date"])
    return df


def load_economic_indicator() -> pd.DataFrame:
    df = pd.read_csv(config.ECONOMIC_INDICATOR_FILE, parse_dates=["date"])
    return df


def load_port_congestion() -> pd.DataFrame:
    df = pd.read_csv(config.PORT_CONGESTION_FILE, parse_dates=["date"])
    return df


def load_vessel_availability() -> pd.DataFrame:
    df = pd.read_csv(config.VESSEL_AVAILABILITY_FILE, parse_dates=["date"])
    return df


def load_all() -> dict:
    """Return every raw table in a dict keyed by short name."""
    return {
        "freight": load_freight(),
        "marine_fuel": load_marine_fuel(),
        "commodity_price": load_commodity_price(),
        "economic_indicator": load_economic_indicator(),
        "port_congestion": load_port_congestion(),
        "vessel_availability": load_vessel_availability(),
    }
