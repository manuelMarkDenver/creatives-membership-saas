# Creatives SaaS API - Postman Testing

This directory contains comprehensive Postman collections and environments for testing the Creatives SaaS multi-tenant API.

## 📁 Files

- `Creatives-SaaS-API.postman_collection.json` - Main collection with all API endpoints
- `Creatives-SaaS-Environment.postman_environment.json` - Environment variables for testing

## 🚀 Quick Start

### Option 1: Using Postman GUI

1. **Import Collection**:

   - Open Postman
   - Click "Import"
   - Select `Creatives-SaaS-API.postman_collection.json`
2. **Import Environment**:

   - Click "Import"
   - Select `Creatives-SaaS-Environment.postman_environment.json`
   - Make sure to select this environment in the top-right dropdown
3. **Start Your Server**:

   ```bash
   npm run start:dev
   ```
4. **Run Collection**:

   - Right-click on the collection
   - Select "Run collection"
   - Choose the environment
   - Click "Run Creatives SaaS API"

### Option 2: Using Newman (CLI)

1. **Install Newman**:

   ```bash
   npm run test:api:install
   ```
2. **Run Tests**:

   ```bash
   npm run test:api
   ```

## 📊 Test Structure

### 1. Health Check

- API connectivity test
- Basic server health verification

### 2. Tenants Management

- ✅ Create Gym Tenant
- ✅ Create Coffee Shop Tenant
- ✅ Get All Tenants
- ✅ Filter by Business Category
- ✅ Get Tenant by ID
- ✅ Update Tenant
- ✅ Delete Tenant

### 3. Users Management (Gym-focused)

- ✅ Create Gym Member with businessData
- ✅ Create Multiple Users
- ✅ Get All Users (Admin route)
- ✅ Get Users by Tenant
- ✅ Get User by ID
- ✅ Update User with businessData
- ✅ Delete User

### 4. Error Testing

- ❌ Business Type Restrictions (Coffee Shop users should fail)
- ❌ Invalid Tenant ID format
- ❌ Missing Tenant ID header
- ❌ Invalid Email format

### 5. Cleanup

- 🗑️ Delete test data

## 🧪 Test Scripts

Each request includes comprehensive test scripts that verify:

- **Status Codes**: Correct HTTP response codes
- **Response Structure**: Required fields and data types
- **Business Logic**: Multi-tenant isolation, business type restrictions
- **Error Handling**: Proper error messages and status codes
- **Data Persistence**: Variables stored for subsequent requests

## 🔧 Environment Variables

The environment automatically manages these variables:

```json
{
  "baseUrl": "http://localhost:5000",
  "gymTenantId": "", // Auto-populated
  "coffeeShopTenantId": "", // Auto-populated
  "gymUserId": "", // Auto-populated
  "gymUserId2": "", // Auto-populated
  "apiVersion": "v1"
}
```

## 📋 Test Data Examples

### Gym Tenant

```json
{
  "name": "Fitness Elite Gym",
  "category": "GYM",
  "address": "123 Fitness Street, Makati City",
  "phoneNumber": "+63 2 8555 1234",
  "email": "info@fitnesselite.com",
  "primaryColor": "#FF6B35",
  "secondaryColor": "#2E3440"
}
```

### Gym Member

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "09171234567",
  "role": "MEMBER",
  "businessData": {
    "membershipType": "Gold",
    "startDate": "2025-08-03T00:00:00.000Z",
    "endDate": "2026-08-03T00:00:00.000Z",
    "planFeatures": ["Pool access", "Personal trainer", "Locker"]
  }
}
```

## 🏃‍♂️ Running Tests

### Full Test Suite

```bash
# Run all tests with HTML report
npm run test:api

# Simple collection run
npm run postman:collection

# Validate and exit on first failure
npm run postman:validate
```

### Individual Requests

You can run individual requests or folders in Postman by:

1. Right-clicking on a folder/request
2. Selecting "Send" (for single request) or "Run" (for folder)

## 📈 Test Reports

Newman generates detailed reports in the `test-results/` directory:

- `results.json` - JSON test results
- `report.html` - Beautiful HTML report with charts and logs

## 🔍 Troubleshooting

### Common Issues

1. **Server Not Running**

   ```bash
   npm run start:dev
   ```
2. **Newman Not Installed**

   ```bash
   npm run test:api:install
   ```
3. **Environment Not Selected**

   - Make sure "Creatives SaaS Environment" is selected in Postman
4. **Test Failures**

   - Check server logs
   - Verify database connection
   - Ensure previous test cleanup completed

### Debugging

- Enable Postman Console (View → Show Postman Console)
- Check Newman verbose output: `newman run collection.json -e environment.json --verbose`
- Review test scripts in each request

## 🚀 Extending Tests

To add new tests:

1. **Add Request**: Create new request in appropriate folder
2. **Add Tests**: Include test scripts for validation
3. **Update Environment**: Add any new variables needed
4. **Update Variables**: Store important response data for later use

### Test Script Template

```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has required fields", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id');
    pm.expect(jsonData).to.have.property('name');
});

// Store data for later use
pm.environment.set('variableName', jsonData.id);
```

## 📝 Notes

- Tests are designed to run in sequence (collection runner)
- Each test cleans up after itself where possible
- Business type restrictions are thoroughly tested
- Multi-tenant isolation is verified
- Error handling is comprehensively covered
- [ ] 🆘 Support

If you encounter issues:

1. Check this README
2. Review the test scripts
3. Check server logs
4. Verify database state
5. Run individual requests to isolate issues
