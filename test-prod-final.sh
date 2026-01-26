#!/bin/bash
echo "=== FINAL PRODUCTION TEST ==="
echo "1. Testing health endpoint..."
curl -s https://happy-respect-production.up.railway.app/api/v1/health
echo -e "\n\n2. Testing SUPER_ADMIN card (0000000001)..."

TERMINAL_ID="test-terminal-1"
TERMINAL_SECRET="test-secret-123"
ENCODED_ID=$(echo -n "$TERMINAL_ID" | base64)
ENCODED_SECRET=$(echo -n "$TERMINAL_SECRET" | base64)

curl -X POST https://happy-respect-production.up.railway.app/api/v1/access/check \
  -H "Content-Type: application/json" \
  -H "X-Terminal-Id-Encoded: $ENCODED_ID" \
  -H "X-Terminal-Secret-Encoded: $ENCODED_SECRET" \
  -d '{"cardUid": "0000000001"}' \
  -w "\nStatus: %{http_code}\n"

echo -e "\n3. Testing DAILY card (0004453082)..."
curl -X POST https://happy-respect-production.up.railway.app/api/v1/access/check \
  -H "Content-Type: application/json" \
  -H "X-Terminal-Id-Encoded: $ENCODED_ID" \
  -H "X-Terminal-Secret-Encoded: $ENCODED_SECRET" \
  -d '{"cardUid": "0004453082"}' \
  -w "\nStatus: %{http_code}\n"
