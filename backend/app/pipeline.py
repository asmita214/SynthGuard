import gc
import pandas as pd
import torch

from app.profiler import profile_dataset
from app.preprocessor import Preprocessor
from app.train_vae import train_vae
from app.validator import fidelity_score, utility_score, privacy_score, synthguard_score

torch.set_num_threads(2)

MAX_TRAIN_ROWS = 3000
TRAIN_EPOCHS = 150


def run_pipeline(df: pd.DataFrame, target_col: str, epsilon: float, n_rows: int = None):
    """Heavy part: profile -> train DP-VAE -> sample -> score.
    Returns (result_dict, synthetic_df)."""
    if len(df) > MAX_TRAIN_ROWS:
        df = df.sample(MAX_TRAIN_ROWS, random_state=42).reset_index(drop=True)

    profile = profile_dataset(df)
    prep = Preprocessor(profile)
    data = prep.fit_transform(df)

    usable_cols = prep.numeric_cols + prep.categorical_cols
    if not usable_cols:
        raise ValueError("No usable numeric/categorical columns found to synthesize.")

    model, achieved_epsilon = train_vae(
        data, prep.numeric_dim, prep.categorical_slices,
        latent_dim=8, epochs=TRAIN_EPOCHS, batch_size=128,
        use_dp=True, target_epsilon=epsilon, beta=0.5
    )

    rows = n_rows or len(df)
    synthetic_raw = model._module.sample(rows, latent_dim=8).numpy()
    del model
    gc.collect()

    synthetic_raw = prep.to_valid_onehot(synthetic_raw)
    synthetic_df = prep.inverse_transform(synthetic_raw)

    if target_col not in usable_cols:
        synthetic_df[target_col] = df[target_col].sample(rows, replace=True).values

    cols = usable_cols if target_col in usable_cols else usable_cols + [target_col]
    real_compare = df[cols]
    synth_compare = synthetic_df[cols]

    fid_cols = [c for c in usable_cols if c != target_col]
    fid = fidelity_score(real_compare[fid_cols], synth_compare[fid_cols])
    util = utility_score(real_compare, synth_compare, target_col=target_col)
    priv = privacy_score(real_compare[fid_cols], synth_compare[fid_cols])
    score = synthguard_score(fid, util, priv)

    result = {
        "fidelity": fid,
        "utility": util,
        "privacy": priv,
        "synthguard_score": score,
        "epsilon": achieved_epsilon,
        "dropped_columns": [c for c in df.columns if c not in usable_cols and c != target_col],
        "target_jointly_modeled": target_col in usable_cols,
        "target_col": target_col,
        "sample_rows": synthetic_df.head(5).to_dict(orient="records"),
    }
    return result, synthetic_df
