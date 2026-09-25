import numpy as np
import pandas as pd
from scipy.stats import ks_2samp
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder


def fidelity_score(real_df: pd.DataFrame, synthetic_df: pd.DataFrame) -> dict:
    scores = {}
    for col in real_df.columns:
        if col not in synthetic_df.columns:
            continue
        if pd.api.types.is_numeric_dtype(real_df[col]):
            stat, _ = ks_2samp(real_df[col].dropna(), synthetic_df[col].dropna())
            scores[col] = round(1 - stat, 3)
        else:
            real_dist = real_df[col].value_counts(normalize=True)
            synth_dist = synthetic_df[col].value_counts(normalize=True)
            all_categories = set(real_dist.index) | set(synth_dist.index)
            diff = sum(abs(real_dist.get(c, 0) - synth_dist.get(c, 0)) for c in all_categories)
            scores[col] = round(1 - diff / 2, 3)

    scores["overall"] = round(np.mean(list(scores.values())), 3)
    return scores


def utility_score(real_df: pd.DataFrame, synthetic_df: pd.DataFrame, target_col: str) -> dict:
    real_df = real_df.copy()
    synthetic_df = synthetic_df.copy()

    # Fit ONE encoder per column on the combined real+synthetic values,
    # so both dataframes map categories to the same integer codes.
    for col in real_df.columns:
        if not pd.api.types.is_numeric_dtype(real_df[col]):
            combined = pd.concat([real_df[col], synthetic_df[col]], axis=0).astype(str)
            le = LabelEncoder().fit(combined)
            real_df[col] = le.transform(real_df[col].astype(str))
            synthetic_df[col] = le.transform(synthetic_df[col].astype(str))

    X_real, y_real = real_df.drop(columns=[target_col]), real_df[target_col]
    X_synth, y_synth = synthetic_df.drop(columns=[target_col]), synthetic_df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(X_real, y_real, test_size=0.3, random_state=42)

    real_model = LogisticRegression(max_iter=1000).fit(X_train, y_train)
    real_acc = real_model.score(X_test, y_test)

    synth_model = LogisticRegression(max_iter=1000).fit(X_synth, y_synth)
    synth_acc = synth_model.score(X_test, y_test)

    return {
        "real_accuracy": round(real_acc, 3),
        "synthetic_accuracy": round(synth_acc, 3),
        "utility_ratio": round(synth_acc / real_acc, 3) if real_acc > 0 else 0
    }


def privacy_score(real_df: pd.DataFrame, synthetic_df: pd.DataFrame) -> dict:
    def prep(df):
        df = df.copy()
        for col in df.columns:
            if not pd.api.types.is_numeric_dtype(df[col]):
                df[col] = LabelEncoder().fit_transform(df[col].astype(str))
        return df.values

    real_vals = prep(real_df)
    synth_vals = prep(synthetic_df)

    min_dists = []
    for row in synth_vals:
        dists = np.linalg.norm(real_vals - row, axis=1)
        min_dists.append(dists.min())

    avg_min_dist = np.mean(min_dists)
    return {
        "avg_nearest_neighbor_distance": round(float(avg_min_dist), 3),
        "note": "Higher distance = less risk of synthetic rows matching real ones too closely"
    }


def synthguard_score(fidelity: dict, utility: dict, privacy: dict) -> float:
    fid = fidelity["overall"]
    util = min(utility["utility_ratio"], 1.0)
    priv = min(privacy["avg_nearest_neighbor_distance"] / 2, 1.0)
    return round((fid * 0.4 + util * 0.3 + priv * 0.3) * 100, 1)