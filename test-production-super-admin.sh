#!/bin/bash
echo "Testing SUPER_ADMIN card on PRODUCTION..."
echo "Card UID: 0000000001"
echo "Terminal ID: test-terminal-1"
echo "Terminal Secret: test-secret-123"

# Encode terminal credentials
TERMINAL_ID="test-terminal-1"
TERMINAL_SECRET="test-secret-123"
ENCODED_ID=$(echo -n "$TERMINAL_ID" | base64)
ENCODED_SECRET=$(echo -n "$TERMINAL_SECRET" | base64)

echo -e "\nMaking API call to check SUPER_ADMIN card on PRODUCTION..."
curl -X POST https://happy-respect-production.up.railway.app/api/v1/access/check \
  -H "Content-Type: application/json" \
  -H "X-Terminal-Id-Encoded: $ENCODED_ID" \
  -H "X-Terminal-Secret-Encoded: $ENCODED_SECRET" \
  -d '{"cardUid": "0000000001"}' \
  -w "\n\nResponse Code: %{http_code}\n"
