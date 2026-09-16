#!/bin/bash
set -e

# Validacion explicita de variables de entorno
if [ -z "$MODEL_SECURITY_CLIENT_ID" ] || [ -z "$MODEL_SECURITY_CLIENT_SECRET" ] || [ -z "$TSG_ID" ]; then
  echo "[ERROR] Faltan variables de entorno requeridas para la autenticacion con SASE." >&2
  echo "[DEBUG] CLIENT_ID presente: $([ -n "$MODEL_SECURITY_CLIENT_ID" ] && echo "SI" || echo "NO")" >&2
  echo "[DEBUG] CLIENT_SECRET presente: $([ -n "$MODEL_SECURITY_CLIENT_SECRET" ] && echo "SI" || echo "NO")" >&2
  echo "[DEBUG] TSG_ID presente: $([ -n "$TSG_ID" ] && echo "SI" || echo "NO")" >&2
  exit 1
fi

# Peticion OAuth2 con reintentos de red y seguimiento de redirecciones
RESPONSE=$(curl -s -S -L --retry 3 --retry-connrefused -X POST "https://auth.sase.paloaltonetworks.com/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=${MODEL_SECURITY_CLIENT_ID}" \
  -d "client_secret=${MODEL_SECURITY_CLIENT_SECRET}" \
  -d "scope=tsg_id:${TSG_ID}")

TOKEN=$(echo "$RESPONSE" | jq -r .access_token)

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "[ERROR] Respuesta de token invalida desde Palo Alto SASE: $RESPONSE" >&2
  exit 1
fi

echo "https://__token__:${TOKEN}@pypi.panw.ai/simple"