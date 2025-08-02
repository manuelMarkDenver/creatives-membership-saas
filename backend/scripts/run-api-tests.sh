#!/bin/bash

# Creatives SaaS API Test Runner
# This script runs the Postman collection using Newman

set -e # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:5000"
COLLECTION_FILE="postman/Creatives-SaaS-API.postman_collection.json"
ENVIRONMENT_FILE="postman/Creatives-SaaS-Environment.postman_environment.json"
RESULTS_DIR="test-results"

echo -e "${BLUE}🚀 Creatives SaaS API Test Runner${NC}"
echo "=================================="

# Check if Newman is installed
if ! command -v newman &> /dev/null; then
    echo -e "${RED}❌ Newman is not installed. Installing...${NC}"
    npm install -g newman
fi

# Check if server is running
echo -e "${YELLOW}🔍 Checking if API server is running...${NC}"
if ! curl -s "$API_URL" > /dev/null; then
    echo -e "${RED}❌ API server is not running at $API_URL${NC}"
    echo -e "${YELLOW}💡 Please start your server with: npm run start:dev${NC}"
    exit 1
fi
echo -e "${GREEN}✅ API server is running${NC}"

# Create results directory
mkdir -p "$RESULTS_DIR"

# Run the collection
echo -e "${BLUE}🧪 Running API tests...${NC}"
newman run "$COLLECTION_FILE" \
    -e "$ENVIRONMENT_FILE" \
    --reporters cli,json,htmlextra \
    --reporter-json-export "$RESULTS_DIR/results.json" \
    --reporter-htmlextra-export "$RESULTS_DIR/report.html" \
    --reporter-htmlextra-title "Creatives SaaS API Test Results" \
    --reporter-htmlextra-logs \
    --color on \
    --delay-request 100 \
    --timeout-request 30000

# Check if tests passed
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo -e "${BLUE}📊 Test report available at: $RESULTS_DIR/report.html${NC}"
else
    echo -e "${RED}❌ Some tests failed. Check the report for details.${NC}"
    exit 1
fi
