import torch
from torch.utils.data import DataLoader, TensorDataset
from app.vae import VAE, vae_loss
from opacus import PrivacyEngine

def train_vae(data, numeric_dim, categorical_slices, latent_dim=8, epochs=300, batch_size=64, lr=1e-3,
              use_dp=False, target_epsilon=5.0, target_delta=1e-5, beta=0.5):
    input_dim = data.shape[1]
    tensor_data = torch.tensor(data, dtype=torch.float32)
    dataset = TensorDataset(tensor_data)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    model = VAE(input_dim=input_dim, latent_dim=latent_dim, hidden_dim=128)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=100, gamma=0.5)

    privacy_engine = None
    if use_dp:
        privacy_engine = PrivacyEngine()
        model, optimizer, loader = privacy_engine.make_private_with_epsilon(
            module=model,
            optimizer=optimizer,
            data_loader=loader,
            epochs=epochs,
            target_epsilon=target_epsilon,
            target_delta=target_delta,
            max_grad_norm=1.0,
        )

    for epoch in range(epochs):
        total_loss = 0
        for (batch,) in loader:
            optimizer.zero_grad()
            recon, mu, logvar = model(batch)
            loss = vae_loss(recon, batch, mu, logvar, numeric_dim, categorical_slices, beta=beta)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        if not use_dp:
            scheduler.step()  # opacus manages its own internals; skip scheduler under DP

        if epoch % 50 == 0:
            msg = f"Epoch {epoch}, Loss: {total_loss:.2f}"
            if use_dp:
                msg += f", Epsilon: {privacy_engine.get_epsilon(target_delta):.2f}"
            print(msg)

    final_epsilon = privacy_engine.get_epsilon(target_delta) if use_dp else None
    return model, final_epsilon