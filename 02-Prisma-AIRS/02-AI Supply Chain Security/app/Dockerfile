FROM python:3.12-slim

# Instalamos herramientas de compilación necesarias para paquetes complejos
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalamos el SDK de Prisma AIRS con verbose para trazabilidad
RUN pip install --no-cache-dir -v \
    fastapi \
    uvicorn \
    "model-security-client==1.1.0" --extra-index-url https://pypi.panw.ai/simple

COPY main.py /app/main.py

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]