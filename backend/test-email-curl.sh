#!/bin/bash

# Email API Testing Script
# Run this after starting the backend server with: npm run start:dev

API_BASE="http://localhost:5000/api/v1"
AUTH_HEADERS="-H 'x-bypass-auth: true' -H 'x-bypass-user: admin@creatives-saas.com'"

echo "🧪 Testing Email API Endpoints"
echo "=============================="

# Test 1: Get Email Settings
echo ""
echo "1. Testing GET /admin/email-settings"
curl -s -X GET "${API_BASE}/admin/email-settings" \
  ${AUTH_HEADERS} \
  -H "Content-Type: application/json" | jq '.' || echo "Failed to parse JSON"

# Test 2: Update Email Settings
echo ""
echo "2. Testing PUT /admin/email-settings"
curl -s -X PUT "${API_BASE}/admin/email-settings" \
  ${AUTH_HEADERS} \
  -H "Content-Type: application/json" \
  -d '{
    "smtpHost": "localhost",
    "smtpPort": 1025,
    "smtpUser": null,
    "smtpPassword": null,
    "fromEmail": "test@gymbosslab.com",
    "fromName": "GymBossLab Test",
    "brevoApiKey": null,
    "mailpitEnabled": true
  }' | jq '.' || echo "Failed to parse JSON"

# Test 3: Get Email Templates
echo ""
echo "3. Testing GET /email/templates"
curl -s -X GET "${API_BASE}/email/templates" \
  ${AUTH_HEADERS} \
  -H "Content-Type: application/json" | jq '.' || echo "Failed to parse JSON"

# Test 4: Create Email Template
echo ""
echo "4. Testing POST /email/templates"
TEMPLATE_RESPONSE=$(curl -s -X POST "${API_BASE}/email/templates" \
  ${AUTH_HEADERS} \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": null,
    "templateType": "welcome",
    "name": "Test Welcome Template",
    "subject": "Welcome to {{tenantName}}!",
    "htmlContent": "<h1>Welcome {{memberName}}!</h1><p>Thank you for joining {{tenantName}}.</p>",
    "textContent": "Welcome {{memberName}}! Thank you for joining {{tenantName}}.",
    "variables": null,
    "isActive": true
  }')

echo "$TEMPLATE_RESPONSE" | jq '.' || echo "Failed to parse JSON"
TEMPLATE_ID=$(echo "$TEMPLATE_RESPONSE" | jq -r '.id')

# Test 5: Update Email Template
echo ""
echo "5. Testing PUT /email/templates/${TEMPLATE_ID}"
curl -s -X PUT "${API_BASE}/email/templates/${TEMPLATE_ID}" \
  ${AUTH_HEADERS} \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": null,
    "templateType": "welcome",
    "name": "Updated Test Welcome Template",
    "subject": "Welcome to {{tenantName}}!",
    "htmlContent": "<h1>Welcome {{memberName}}!</h1><p>Thank you for joining {{tenantName}}.</p>",
    "textContent": "Welcome {{memberName}}! Thank you for joining {{tenantName}}.",
    "variables": null,
    "isActive": true
  }' | jq '.' || echo "Failed to parse JSON"

# Test 6: Send Welcome Email
echo ""
echo "6. Testing POST /email/send-welcome"
curl -s -X POST "${API_BASE}/email/send-welcome" \
  ${AUTH_HEADERS} \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "tenantId": "test-tenant-id",
    "membershipPlanName": "Gold Plan"
  }' | jq '.' || echo "Failed to parse JSON"

# Test 7: Send Admin Alert
echo ""
echo "7. Testing POST /email/send-admin-alert"
curl -s -X POST "${API_BASE}/email/send-admin-alert" \
  ${AUTH_HEADERS} \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Test Gym",
    "ownerEmail": "owner@testgym.com",
    "tenantId": "test-tenant-id"
  }' | jq '.' || echo "Failed to parse JSON"

# Test 8: Send Tenant Notification
echo ""
echo "8. Testing POST /email/send-tenant-notification"
curl -s -X POST "${API_BASE}/email/send-tenant-notification" \
  ${AUTH_HEADERS} \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "test-tenant-id",
    "memberName": "Test Member",
    "memberEmail": "member@test.com",
    "membershipPlanName": "Silver Plan"
  }' | jq '.' || echo "Failed to parse JSON"

# Test 9: Get Email Logs
echo ""
echo "9. Testing GET /email/logs"
curl -s -X GET "${API_BASE}/email/logs" \
  ${AUTH_HEADERS} \
  -H "Content-Type: application/json" | jq '.' || echo "Failed to parse JSON"

# Test 10: Delete Email Template
echo ""
echo "10. Testing DELETE /email/templates/${TEMPLATE_ID}"
curl -s -X DELETE "${API_BASE}/email/templates/${TEMPLATE_ID}" \
  ${AUTH_HEADERS} \
  -H "Content-Type: application/json" | jq '.' || echo "Failed to parse JSON"

echo ""
echo "🎉 Email API testing completed!"
echo "💡 Check http://localhost:8025 for emails in Mailpit"