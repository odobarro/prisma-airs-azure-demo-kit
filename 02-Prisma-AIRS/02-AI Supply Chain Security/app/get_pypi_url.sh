#!/bin/bash
set -e

if [ -z "$MODEL_SECURITY_CLIENT_ID" ] || [ -z "$MODEL_SECURITY_CLIENT_SECRET" ] || [ -z "$TSG_ID" ]; then
  echo "[ERROR] Faltan variables de entorno para autenticación PANW." >&2
  exit 1
fi

# Peticion de token a Palo Alto SASE
RESPONSE=$(curl -s -S -X POST "https://auth.sase.paloaltonetworks.com/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=${MODEL_SECURITY_CLIENT_ID}" \
  -d "client_secret=${MODEL_SECURITY_CLIENT_SECRET}" \
  -d "scope=tsg_id:${TSG_ID}")

TOKEN=$(echo "$RESPONSE" | jq -r .access_token)

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "[ERROR] Respuesta de autenticación invalida: $RESPONSE" >&2
  exit 1
fi

echo "https://__token__:${TOKEN}@pypi.panw.ai/simple"