FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

ARG PYPI_URL

RUN uv pip install --system --no-cache fastapi uvicorn \
    "model-security-client==1.1.0" --extra-index-url "$PYPI_URL"

COPY main.py /app/main.py

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]