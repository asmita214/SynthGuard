import torch
import torch.nn as nn
import torch.nn.functional as F

class VAE(nn.Module):
    def __init__(self, input_dim: int, latent_dim: int = 8, hidden_dim: int = 64):
        super().__init__()

        self.enc_fc1 = nn.Linear(input_dim, hidden_dim)
        self.enc_mu = nn.Linear(hidden_dim, latent_dim)
        self.enc_logvar = nn.Linear(hidden_dim, latent_dim)

        self.dec_fc1 = nn.Linear(latent_dim, hidden_dim)
        self.dec_out = nn.Linear(hidden_dim, input_dim)

    def encode(self, x):
        h = F.relu(self.enc_fc1(x))
        return self.enc_mu(h), self.enc_logvar(h)

    def reparameterize(self, mu, logvar):
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        return mu + eps * std

    def decode(self, z):
        h = F.relu(self.dec_fc1(z))
        return self.dec_out(h)

    def forward(self, x):
        mu, logvar = self.encode(x)
        z = self.reparameterize(mu, logvar)
        recon = self.decode(z)
        return recon, mu, logvar

    def sample(self, n: int, latent_dim: int):
        z = torch.randn(n, latent_dim)
        with torch.no_grad():
            return self.decode(z)


def vae_loss(recon_x, x, mu, logvar, numeric_dim, categorical_slices, beta=0.5):
    recon_loss = 0.0

    if numeric_dim > 0:
        recon_loss = F.mse_loss(recon_x[:, :numeric_dim], x[:, :numeric_dim], reduction="sum")

    for (start, end) in categorical_slices:
        abs_start = numeric_dim + start
        abs_end = numeric_dim + end
        logits = recon_x[:, abs_start:abs_end]
        target = x[:, abs_start:abs_end].argmax(dim=1)
        recon_loss = recon_loss + F.cross_entropy(logits, target, reduction="sum")

    kl_div = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp())
    return recon_loss + beta * kl_div