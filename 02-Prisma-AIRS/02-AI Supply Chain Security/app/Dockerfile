FROM python:3.11-slim

# Install system dependencies (Git is required to clone model repositories)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install FastAPI, Uvicorn, and Palo Alto Networks Model Security Client SDK
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    "model-security-client[all]" --extra-index-url https://pypi.panw.ai/simple

# Copy application source code from repository root
COPY main.py /app/main.py

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]