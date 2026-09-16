#!/bin/bash
set -e

# Validación de variables de entorno
if [ -z "$MODEL_SECURITY_CLIENT_ID" ] || [ -z "$MODEL_SECURITY_CLIENT_SECRET" ] || [ -z "$TSG_ID" ]; then
  echo "[ERROR] Faltan variables requeridas para autenticar con Palo Alto SASE." >&2
  echo "[DEBUG] CLIENT_ID presente: $([ -n "$MODEL_SECURITY_CLIENT_ID" ] && echo "SI" || echo "NO")" >&2
  echo "[DEBUG] CLIENT_SECRET presente: $([ -n "$MODEL_SECURITY_CLIENT_SECRET" ] && echo "SI" || echo "NO")" >&2
  echo "[DEBUG] TSG_ID presente: $([ -n "$TSG_ID" ] && echo "SI" || echo "NO")" >&2
  exit 1
fi

# Petición OAuth2 con flag -L para seguir redirecciones
RESPONSE=$(curl -s -S -L -X POST "https://auth.sase.paloaltonetworks.com/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=${MODEL_SECURITY_CLIENT_ID}" \
  -d "client_secret=${MODEL_SECURITY_CLIENT_SECRET}" \
  -d "scope=tsg_id:${TSG_ID}")

TOKEN=$(echo "$RESPONSE" | jq -r .access_token)

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "[ERROR] Fallo en la respuesta de autenticación PANW: $RESPONSE" >&2
  exit 1
fi

echo "https://__token__:${TOKEN}@pypi.panw.ai/simple"