import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder

class Preprocessor:
    def __init__(self, profile: dict):
        self.profile = profile
        self.numeric_cols = [c["name"] for c in profile["columns"] if c["type"] == "numeric"]
        self.categorical_cols = [c["name"] for c in profile["columns"] if c["type"] == "categorical" and not c["is_pii"]]
        self.pii_cols = [c["name"] for c in profile["columns"] if c["is_pii"] or c["type"] == "identifier"]

        self.scaler = StandardScaler()
        self.encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")

    def fit_transform(self, df: pd.DataFrame) -> np.ndarray:
        df = df.drop(columns=self.pii_cols, errors="ignore")

        numeric_data = self.scaler.fit_transform(df[self.numeric_cols]) if self.numeric_cols else np.empty((len(df), 0))
        categorical_data = self.encoder.fit_transform(df[self.categorical_cols]) if self.categorical_cols else np.empty((len(df), 0))

        self.numeric_dim = numeric_data.shape[1]
        self.categorical_dim = categorical_data.shape[1]

        # Track where each individual categorical column's one-hot block starts/ends
        self.categorical_slices = []
        start = 0
        if self.categorical_cols:
            for cats in self.encoder.categories_:
                end = start + len(cats)
                self.categorical_slices.append((start, end))
                start = end

        return np.hstack([numeric_data, categorical_data]).astype(np.float32)

    def to_valid_onehot(self, raw: np.ndarray) -> np.ndarray:
        """Force VAE output into clean one-hot per categorical column (argmax -> 1, rest 0)."""
        result = raw.copy()
        for (start, end) in self.categorical_slices:
            abs_start = self.numeric_dim + start
            abs_end = self.numeric_dim + end
            block = raw[:, abs_start:abs_end]
            idx = np.argmax(block, axis=1)
            onehot = np.zeros_like(block)
            onehot[np.arange(block.shape[0]), idx] = 1
            result[:, abs_start:abs_end] = onehot
        return result

    def inverse_transform(self, data: np.ndarray) -> pd.DataFrame:
        numeric_part = data[:, :self.numeric_dim]
        categorical_part = data[:, self.numeric_dim:]

        result = pd.DataFrame()

        if self.numeric_cols:
            numeric_original = self.scaler.inverse_transform(numeric_part)
            result[self.numeric_cols] = numeric_original

        if self.categorical_cols:
            categorical_original = self.encoder.inverse_transform(categorical_part)
            result[self.categorical_cols] = categorical_original

        return result