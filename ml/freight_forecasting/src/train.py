# """
# Train an XGBoost regression model to forecast ocean freight rates
# (USD/Tonne) for India-bound dry-bulk / tanker fixtures.

# Usage:
#     python -m src.train
# """

# import json
# import logging

# import joblib
# import matplotlib
# import numpy as np
# import pandas as pd
# import xgboost as xgb
# from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, mean_squared_error, r2_score

# matplotlib.use("Agg")
# import matplotlib.pyplot as plt

# from . import config, data_loader
# from .feature_engineering import FEATURE_COLUMNS, build_feature_table

# logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
# log = logging.getLogger("train")


# def time_based_split(df: pd.DataFrame, test_fraction: float):
#     """Hold out the most recent slice of dates as the test set, so the
#     model is evaluated the way it will actually be used: forecasting
#     the future from the past."""
#     df = df.sort_values("date")
#     cutoff_idx = int(len(df) * (1 - test_fraction))
#     cutoff_date = df.iloc[cutoff_idx]["date"]
#     train_df = df[df["date"] < cutoff_date]
#     test_df = df[df["date"] >= cutoff_date]
#     return train_df, test_df, cutoff_date


# def main():
#     config.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
#     config.MODELS_DIR.mkdir(parents=True, exist_ok=True)
#     config.REPORTS_DIR.mkdir(parents=True, exist_ok=True)

#     log.info("Loading raw datasets ...")
#     raw = data_loader.load_all()

#     log.info("Building joined feature table ...")
#     features_df = build_feature_table(raw)
#     features_df.to_parquet(config.PROCESSED_FEATURES_FILE, index=False)
#     log.info("Feature table shape: %s -> saved to %s", features_df.shape, config.PROCESSED_FEATURES_FILE)

#     train_df, test_df, cutoff_date = time_based_split(features_df, config.TEST_SIZE_FRACTION)
#     log.info(
#         "Train rows: %d (up to %s) | Test rows: %d (from %s)",
#         len(train_df), cutoff_date, len(test_df), cutoff_date,
#     )

#     X_train, y_train = train_df[FEATURE_COLUMNS], train_df[config.TARGET_COL]
#     X_test, y_test = test_df[FEATURE_COLUMNS], test_df[config.TARGET_COL]

#     for col in config.CATEGORICAL_FEATURES:
#         X_train[col] = X_train[col].astype("category")
#         X_test[col] = X_test[col].astype("category")

#     model = xgb.XGBRegressor(
#         objective="reg:squarederror",
#         n_estimators=2000,
#         learning_rate=0.03,
#         max_depth=8,
#         subsample=0.8,
#         colsample_bytree=0.8,
#         tree_method="hist",
#         enable_categorical=True,
#         eval_metric="mae",
#         early_stopping_rounds=100,
#         random_state=config.RANDOM_STATE,
#     )

#     log.info("Training XGBoost model ...")
#     model.fit(
#         X_train,
#         y_train,
#         eval_set=[(X_test, y_test)],
#         verbose=200,
#     )

#     preds = model.predict(X_test)
#     metrics = {
#         "mae": float(mean_absolute_error(y_test, preds)),
#         "rmse": float(np.sqrt(mean_squared_error(y_test, preds))),
#         "mape": float(mean_absolute_percentage_error(y_test, preds)),
#         "r2": float(r2_score(y_test, preds)),
#         "n_train": int(len(train_df)),
#         "n_test": int(len(test_df)),
#         "test_cutoff_date": str(cutoff_date.date()),
#         "best_iteration": int(model.best_iteration) if model.best_iteration is not None else int(model.n_estimators),
#     }
#     log.info("Test metrics: %s", metrics)

#     with open(config.METRICS_FILE, "w") as f:
#         json.dump(metrics, f, indent=2)

#     joblib.dump(
#         {"model": model, "feature_columns": FEATURE_COLUMNS, "categorical_features": config.CATEGORICAL_FEATURES},
#         config.MODEL_FILE,
#     )
#     log.info("Model saved to %s", config.MODEL_FILE)

    

#     # --- Feature importance plot ---
#     importance = pd.Series(model.feature_importances_, index=FEATURE_COLUMNS).sort_values(ascending=True)
#     plt.figure(figsize=(8, 10))
#     importance.tail(20).plot(kind="barh")
#     plt.title("Top 20 feature importances (XGBoost, gain)")
#     plt.tight_layout()
#     plt.savefig(config.FEATURE_IMPORTANCE_FILE, dpi=150)
#     plt.close()

#     # --- Predicted vs actual plot ---
#     plt.figure(figsize=(7, 7))
#     plt.scatter(y_test, preds, alpha=0.2, s=8)
#     lims = [min(y_test.min(), preds.min()), max(y_test.max(), preds.max())]
#     plt.plot(lims, lims, "r--", linewidth=1)
#     plt.xlabel("Actual freight_rate (USD/Tonne)")
#     plt.ylabel("Predicted freight_rate (USD/Tonne)")
#     plt.title(f"Predicted vs actual (test set, MAE={metrics['mae']:.3f})")
#     plt.tight_layout()
#     plt.savefig(config.PRED_VS_ACTUAL_FILE, dpi=150)
#     plt.close()

#     log.info("Reports saved to %s", config.REPORTS_DIR)
#     return metrics


# if __name__ == "__main__":
#     main()



"""
Train an XGBoost regression model to forecast ocean freight rates
(USD/Tonne) for India-bound dry-bulk / tanker fixtures.

Usage:
    python -m src.train
"""

import json
import logging

import matplotlib
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import (
    mean_absolute_error,
    mean_absolute_percentage_error,
    mean_squared_error,
    r2_score,
)

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from . import config, data_loader
from .feature_engineering import FEATURE_COLUMNS, build_feature_table


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

log = logging.getLogger("train")


def time_based_split(df: pd.DataFrame, test_fraction: float):
    """
    Hold out the most recent slice of dates as the test set.
    This evaluates the model in a forecasting-style setup.
    """
    df = df.sort_values("date")

    cutoff_idx = int(len(df) * (1 - test_fraction))
    cutoff_date = df.iloc[cutoff_idx]["date"]

    train_df = df[df["date"] < cutoff_date]
    test_df = df[df["date"] >= cutoff_date]

    return train_df, test_df, cutoff_date


def main():

    # ---------------------------------------------------------
    # Prepare directories
    # ---------------------------------------------------------

    config.PROCESSED_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    config.MODELS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    config.REPORTS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    # ---------------------------------------------------------
    # Load data
    # ---------------------------------------------------------

    log.info("Loading raw datasets ...")

    raw = data_loader.load_all()

    # ---------------------------------------------------------
    # Build feature table
    # ---------------------------------------------------------

    log.info("Building joined feature table ...")

    features_df = build_feature_table(raw)

    features_df.to_parquet(
        config.PROCESSED_FEATURES_FILE,
        index=False,
    )

    log.info(
        "Feature table shape: %s -> saved to %s",
        features_df.shape,
        config.PROCESSED_FEATURES_FILE,
    )

    # ---------------------------------------------------------
    # Time-based train/test split
    # ---------------------------------------------------------

    train_df, test_df, cutoff_date = time_based_split(
        features_df,
        config.TEST_SIZE_FRACTION,
    )

    log.info(
        "Train rows: %d (up to %s) | Test rows: %d (from %s)",
        len(train_df),
        cutoff_date,
        len(test_df),
        cutoff_date,
    )

    # ---------------------------------------------------------
    # Prepare X and y
    # ---------------------------------------------------------

    X_train = train_df[FEATURE_COLUMNS].copy()
    y_train = train_df[config.TARGET_COL]

    X_test = test_df[FEATURE_COLUMNS].copy()
    y_test = test_df[config.TARGET_COL]

    # Native categorical features
    for col in config.CATEGORICAL_FEATURES:
        X_train[col] = X_train[col].astype("category")
        X_test[col] = X_test[col].astype("category")

    # ---------------------------------------------------------
    # Create XGBoost model
    # ---------------------------------------------------------

    model = xgb.XGBRegressor(
        objective="reg:squarederror",
        n_estimators=2000,
        learning_rate=0.03,
        max_depth=8,
        subsample=0.8,
        colsample_bytree=0.8,
        tree_method="hist",
        enable_categorical=True,
        eval_metric="mae",
        early_stopping_rounds=100,
        random_state=config.RANDOM_STATE,
    )

    # ---------------------------------------------------------
    # Train
    # ---------------------------------------------------------

    log.info("Training XGBoost model ...")

    model.fit(
        X_train,
        y_train,
        eval_set=[
            (X_test, y_test)
        ],
        verbose=200,
    )

    # ---------------------------------------------------------
    # Predictions
    # ---------------------------------------------------------

    preds = model.predict(X_test)

    # ---------------------------------------------------------
    # Evaluation metrics
    # ---------------------------------------------------------

    metrics = {
        "mae": float(
            mean_absolute_error(
                y_test,
                preds,
            )
        ),

        "rmse": float(
            np.sqrt(
                mean_squared_error(
                    y_test,
                    preds,
                )
            )
        ),

        "mape": float(
            mean_absolute_percentage_error(
                y_test,
                preds,
            )
        ),

        "r2": float(
            r2_score(
                y_test,
                preds,
            )
        ),

        "n_train": int(
            len(train_df)
        ),

        "n_test": int(
            len(test_df)
        ),

        "test_cutoff_date": str(
            cutoff_date.date()
        ),

        "best_iteration": (
            int(model.best_iteration)
            if model.best_iteration is not None
            else int(model.n_estimators)
        ),
    }

    log.info(
        "Test metrics: %s",
        metrics,
    )

    # ---------------------------------------------------------
    # Save metrics
    # ---------------------------------------------------------

    with open(
        config.METRICS_FILE,
        "w",
    ) as f:

        json.dump(
            metrics,
            f,
            indent=2,
        )

    # ---------------------------------------------------------
    # Save native XGBoost Booster
    # ---------------------------------------------------------
    #
    # IMPORTANT:
    # Do NOT use:
    #
    # model.save_model(...)
    #
    # because XGBoost 3.0.2 + the current sklearn
    # wrapper is throwing `_estimator_type undefined`.
    #
    # Instead, save the underlying Booster directly.
    # ---------------------------------------------------------

    booster = model.get_booster()

    model.get_booster().save_model(str(config.MODEL_FILE))

    log.info(
        "XGBoost Booster saved to %s",
        config.MODEL_FILE,
    )

    # ---------------------------------------------------------
    # Feature importance
    # ---------------------------------------------------------

    importance = pd.Series(
        model.feature_importances_,
        index=FEATURE_COLUMNS,
    ).sort_values(
        ascending=True
    )

    plt.figure(
        figsize=(8, 10)
    )

    importance.tail(20).plot(
        kind="barh"
    )

    plt.title(
        "Top 20 feature importances (XGBoost, gain)"
    )

    plt.tight_layout()

    plt.savefig(
        config.FEATURE_IMPORTANCE_FILE,
        dpi=150,
    )

    plt.close()

    # ---------------------------------------------------------
    # Predicted vs Actual
    # ---------------------------------------------------------

    plt.figure(
        figsize=(7, 7)
    )

    plt.scatter(
        y_test,
        preds,
        alpha=0.2,
        s=8,
    )

    lims = [
        min(
            y_test.min(),
            preds.min(),
        ),
        max(
            y_test.max(),
            preds.max(),
        ),
    ]

    plt.plot(
        lims,
        lims,
        "r--",
        linewidth=1,
    )

    plt.xlabel(
        "Actual freight_rate (USD/Tonne)"
    )

    plt.ylabel(
        "Predicted freight_rate (USD/Tonne)"
    )

    plt.title(
        f"Predicted vs actual "
        f"(test set, MAE={metrics['mae']:.3f})"
    )

    plt.tight_layout()

    plt.savefig(
        config.PRED_VS_ACTUAL_FILE,
        dpi=150,
    )

    plt.close()

    # ---------------------------------------------------------
    # Done
    # ---------------------------------------------------------

    log.info(
        "Reports saved to %s",
        config.REPORTS_DIR,
    )

    log.info(
        "Training completed successfully."
    )

    return metrics


if __name__ == "__main__":
    main()