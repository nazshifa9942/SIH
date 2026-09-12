"""
Central configuration: paths and the lookup tables used to join the
six raw datasets together (they use different spellings/formats for
the same ports and cargo types).
"""

from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT_DIR / "data" / "raw"
PROCESSED_DIR = ROOT_DIR / "data" / "processed"
MODELS_DIR = ROOT_DIR / "models"
REPORTS_DIR = ROOT_DIR / "reports"

FREIGHT_FILE = RAW_DIR / "freight_clean_improved.csv"
MARINE_FUEL_FILE = RAW_DIR / "marine_fuel_clean.csv"
COMMODITY_PRICE_FILE = RAW_DIR / "commodity_price_clean_improved.csv"
ECONOMIC_INDICATOR_FILE = RAW_DIR / "economic_indicator_improved.csv"
PORT_CONGESTION_FILE = RAW_DIR / "port_congestion_metrics_improved.csv"
VESSEL_AVAILABILITY_FILE = RAW_DIR / "vessel_availability_improved.csv"

PROCESSED_FEATURES_FILE = PROCESSED_DIR / "model_features.parquet"

# Native XGBoost JSON model
MODEL_FILE = MODELS_DIR / "freight_rate_model.json"

METRICS_FILE = REPORTS_DIR / "metrics.json"
FEATURE_IMPORTANCE_FILE = REPORTS_DIR / "feature_importance.png"
PRED_VS_ACTUAL_FILE = REPORTS_DIR / "predicted_vs_actual.png"

# ---------------------------------------------------------------------------
# Destination port name -> the spelling used in each auxiliary dataset
# ---------------------------------------------------------------------------
DEST_PORT_ALIASES = {
    "CHENNAI": {
        "congestion_vessel_name": "Chennai Port",
        "fuel_name": "Chennai",
    },
    "VISAKHAPATNAM": {
        "congestion_vessel_name": "Visakhapatnam Port (Vizag)",
        "fuel_name": "Visakhapatnam",
    },
    "TUTICORIN": {
        "congestion_vessel_name": "V.O. Chidambaranar Port (Tuticorin / VOC Port)",
        "fuel_name": "V.O. Chidambaranar Port (Tuticorin)",
    },
    "KOLKATA_HALDIA": {
        "congestion_vessel_name": "Kolkata / Haldia Dock Complex (HDC)",
        "fuel_name": "Haldia",
    },
    "PARADIP": {
        "congestion_vessel_name": "Paradip Port",
        "fuel_name": "Paradip",
    },
    "KAMARAJAR": {
        "congestion_vessel_name": "Kamarajar Port (Ennore)",
        "fuel_name": "Kamarajar Port (Ennore)",
    },
}

# ---------------------------------------------------------------------------
# Cargo type (freight dataset) -> commodity price series / demand-proxy name
# ---------------------------------------------------------------------------
CARGO_TO_COMMODITY = {
    "THERMAL_COAL": "COAL",
    "COKING_COAL": "COAL",
    "GRAIN": "GRAIN",
    "IRON_ORE": "IRON_ORE",
    "PALM_OIL": None,
    "POL_CRUDE": None,
}

CARGO_TO_DEMAND_PROXY = {
    "THERMAL_COAL": "THERMAL_COAL_SHIPPING_DEMAND_PROXY",
    "COKING_COAL": "COKING_COAL_SHIPPING_DEMAND_PROXY",
    "GRAIN": "GRAIN_SHIPPING_DEMAND_PROXY",
    "IRON_ORE": "IRON_ORE_SHIPPING_DEMAND_PROXY",
    "PALM_OIL": "PALM_OIL_SHIPPING_DEMAND_PROXY",
    "POL_CRUDE": "POL/CRUDE_SHIPPING_DEMAND_PROXY",
}

TARGET_COL = "freight_rate"

CATEGORICAL_FEATURES = [
    "origin_port_std",
    "destination_port_std",
    "vessel_type",
    "cargo_type_std",
]

RANDOM_STATE = 42
TEST_SIZE_FRACTION = 0.15