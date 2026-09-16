FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
RUN apt-get update && apt-get install -y curl jq sed && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY get_pypi_url.sh /app/

# Convertimos saltos de línea CRLF a LF y damos permisos
RUN sed -i 's/\r$//' /app/get_pypi_url.sh && chmod +x /app/get_pypi_url.sh

ARG MODEL_SECURITY_CLIENT_ID
ARG MODEL_SECURITY_CLIENT_SECRET
ARG TSG_ID

# Generamos la URL en una variable intermedia para verificar que no falle el script
RUN PYPI_URL=$(/app/get_pypi_url.sh) && \
    uv pip install --system --no-cache fastapi uvicorn \
    "model-security-client==1.1.0" --extra-index-url "$PYPI_URL"

COPY main.py /app/main.py

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]