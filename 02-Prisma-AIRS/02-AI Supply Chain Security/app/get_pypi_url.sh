#!/bin/bash
# Prisma AIRS - PyPI Auth Token Generator

# 1. Verificamos que las credenciales han sido pasadas por GitHub Actions
if [ -z "$MODEL_SECURITY_CLIENT_ID" ] || [ -z "$MODEL_SECURITY_CLIENT_SECRET" ] || [ -z "$TSG_ID" ]; then
  echo "Error: Faltan credenciales (MODEL_SECURITY_CLIENT_ID, MODEL_SECURITY_CLIENT_SECRET o TSG_ID)." >&2
  exit 1
fi

# 2. Solicitamos el token OAuth2 a la API SASE de Palo Alto Networks
RESPONSE=$(curl -s -X POST "https://auth.sase.paloaltonetworks.com/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=${MODEL_SECURITY_CLIENT_ID}" \
  -d "client_secret=${MODEL_SECURITY_CLIENT_SECRET}" \
  -d "scope=tsg_id:${TSG_ID}")

# 3. Extraemos el access_token usando jq
TOKEN=$(echo "$RESPONSE" | jq -r .access_token)

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Error al autenticar contra SASE: $RESPONSE" >&2
  exit 1
fi

# 4. Imprimimos la URL segura por salida estándar para el flag --extra-index-url de uv
echo "https://__token__:${TOKEN}@pypi.panw.ai/simple"