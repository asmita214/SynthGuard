import pandas as pd
import re

PII_PATTERNS = {
    "email": re.compile(r"[^@]+@[^@]+\.[^@]+"),
    "phone": re.compile(r"^\+?[\d\s\-\(\)]{7,20}$"),
}

IDENTIFIER_NAME_PATTERNS = re.compile(r"(_key|_id|^id$|^key$)", re.IGNORECASE)


def detect_column_type(series: pd.Series) -> str:
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    if series.nunique() < 0.05 * len(series) or series.nunique() < 20:
        return "categorical"
    return "text"


def detect_pii(series: pd.Series, col_name: str) -> bool:
    name = col_name.lower()
    if any(k in name for k in ["name", "email", "phone", "ssn", "address"]):
        return True
    sample = series.dropna().astype(str).head(20)
    for val in sample:
        if PII_PATTERNS["email"].match(val) or PII_PATTERNS["phone"].match(val):
            return True
    return False


def detect_identifier(series: pd.Series, col_name: str) -> bool:
    if IDENTIFIER_NAME_PATTERNS.search(col_name):
        return True
    # very high cardinality relative to row count also signals an ID column
    if series.nunique() > 0.5 * len(series):
        return True
    return False


def profile_dataset(df: pd.DataFrame) -> dict:
    profile = {
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": []
    }

    for col in df.columns:
        series = df[col]
        is_id = detect_identifier(series, col)
        col_type = "identifier" if is_id else detect_column_type(series)

        col_profile = {
            "name": col,
            "type": col_type,
            "missing_pct": round(series.isna().mean() * 100, 2),
            "unique_count": int(series.nunique()),
            "is_pii": detect_pii(series, col)
        }

        if col_type == "numeric":
            col_profile["mean"] = float(series.mean())
            col_profile["std"] = float(series.std())
            col_profile["min"] = float(series.min())
            col_profile["max"] = float(series.max())

        if col_type == "categorical":
            col_profile["top_values"] = series.value_counts().head(5).to_dict()

        profile["columns"].append(col_profile)

    return profile