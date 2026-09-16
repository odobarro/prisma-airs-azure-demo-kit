FROM python:3.12-slim

# Instalamos uv y dependencias del SO (curl y jq requeridos por el script)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
RUN apt-get update && apt-get install -y curl jq && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiamos el script de autenticación de PANW
COPY get_pypi_url.sh /app/
RUN chmod +x get_pypi_url.sh

# Declaramos los argumentos requeridos por el script get_pypi_url.sh en GitHub Actions
ARG MODEL_SECURITY_CLIENT_ID
ARG MODEL_SECURITY_CLIENT_SECRET
ARG TSG_ID

# uv ejecuta el script para obtener la URL autenticada e instala la versión exacta del SDK
RUN uv pip install --system --no-cache fastapi uvicorn \
    "model-security-client==1.1.0" --extra-index-url $(./get_pypi_url.sh)

COPY main.py /app/main.py

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]