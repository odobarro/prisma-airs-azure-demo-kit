FROM python:3.12-slim

# Importamos el binario de uv directamente (Best Practice)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Usamos uv para instalar directamente en el sistema de forma ultrarrápida
RUN uv pip install --system --no-cache \
    fastapi \
    uvicorn \
    "model-security-client==1.1.0" --extra-index-url https://pypi.panw.ai/simple

COPY main.py /app/main.py

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]