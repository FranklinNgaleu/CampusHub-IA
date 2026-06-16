# ─── Build stage ──────────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copier et installer les dépendances Python
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Dépendances runtime uniquement
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copier les packages installés
COPY --from=builder /install /usr/local

# Copier le code source
COPY . .

# Créer le dossier static
RUN mkdir -p /app/static

# Utilisateur non-root pour la sécurité
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# CMD ["sh", "-c", "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2"]
CMD ["sh", "-c", "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
