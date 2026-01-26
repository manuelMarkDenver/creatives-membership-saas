#!/bin/bash
echo "Testing DAILY card functionality..."
echo "Card UID: 0004453082"
echo "Terminal ID: test-terminal-1"
echo "Terminal Secret: test-secret-123"

# Encode terminal credentials
TERMINAL_ID="test-terminal-1"
TERMINAL_SECRET="test-secret-123"
ENCODED_ID=$(echo -n "$TERMINAL_ID" | base64)
ENCODED_SECRET=$(echo -n "$TERMINAL_SECRET" | base64)

echo -e "\nMaking API call to check DAILY card..."
curl -X POST http://localhost:5000/api/v1/access/check \
  -H "Content-Type: application/json" \
  -H "X-Terminal-Id-Encoded: $ENCODED_ID" \
  -H "X-Terminal-Secret-Encoded: $ENCODED_SECRET" \
  -d '{"cardUid": "0004453082"}' \
  -w "\n\nResponse Code: %{http_code}\n"
