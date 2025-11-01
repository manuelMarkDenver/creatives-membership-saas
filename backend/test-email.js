const axios = require('axios');

// Test email functionality
const API_BASE = 'http://localhost:5000/api/v1';

async function testEmailSettings() {
  console.log('🧪 Testing Email Settings API...');

  try {
    // Test getting email settings
    console.log('📧 Testing GET /admin/email-settings...');
    const getResponse = await axios.get(`${API_BASE}/admin/email-settings`, {
      headers: {
        'x-bypass-auth': 'true',
        'x-bypass-user': 'admin@creatives-saas.com'
      }
    });
    console.log('✅ GET email settings successful:', getResponse.data);

    // Test updating email settings
    console.log('📧 Testing PUT /admin/email-settings...');
    const updateData = {
      smtpHost: 'localhost',
      smtpPort: 1025,
      smtpUser: null,
      smtpPassword: null,
      fromEmail: 'test@gymbosslab.com',
      fromName: 'GymBossLab Test',
      brevoApiKey: null,
      mailpitEnabled: true
    };

    const putResponse = await axios.put(`${API_BASE}/admin/email-settings`, updateData, {
      headers: {
        'x-bypass-auth': 'true',
        'x-bypass-user': 'admin@creatives-saas.com'
      }
    });
    console.log('✅ PUT email settings successful:', putResponse.data);

  } catch (error) {
    console.error('❌ Email settings test failed:', error.response?.data || error.message);
  }
}

async function testEmailTemplates() {
  console.log('📝 Testing Email Templates API...');

  try {
    // Test getting email templates
    console.log('📧 Testing GET /email/templates...');
    const getResponse = await axios.get(`${API_BASE}/email/templates`, {
      headers: {
        'x-bypass-auth': 'true',
        'x-bypass-user': 'admin@creatives-saas.com'
      }
    });
    console.log('✅ GET email templates successful:', getResponse.data);

    // Test creating email template
    console.log('📧 Testing POST /email/templates...');
    const templateData = {
      tenantId: null,
      templateType: 'welcome',
      name: 'Test Welcome Template',
      subject: 'Welcome to {{tenantName}}!',
      htmlContent: '<h1>Welcome {{memberName}}!</h1><p>Thank you for joining {{tenantName}}.</p>',
      textContent: 'Welcome {{memberName}}! Thank you for joining {{tenantName}}.',
      variables: null,
      isActive: true
    };

    const postResponse = await axios.post(`${API_BASE}/email/templates`, templateData, {
      headers: {
        'x-bypass-auth': 'true',
        'x-bypass-user': 'admin@creatives-saas.com'
      }
    });
    console.log('✅ POST email template successful:', postResponse.data);

    const templateId = postResponse.data.id;

    // Test updating email template
    console.log('📧 Testing PUT /email/templates/:id...');
    const updateData = {
      ...templateData,
      name: 'Updated Test Welcome Template'
    };

    const putResponse = await axios.put(`${API_BASE}/email/templates/${templateId}`, updateData, {
      headers: {
        'x-bypass-auth': 'true',
        'x-bypass-user': 'admin@creatives-saas.com'
      }
    });
    console.log('✅ PUT email template successful:', putResponse.data);

    // Test deleting email template
    console.log('📧 Testing DELETE /email/templates/:id...');
    await axios.delete(`${API_BASE}/email/templates/${templateId}`, {
      headers: {
        'x-bypass-auth': 'true',
        'x-bypass-user': 'admin@creatives-saas.com'
      }
    });
    console.log('✅ DELETE email template successful');

  } catch (error) {
    console.error('❌ Email templates test failed:', error.response?.data || error.message);
  }
}

async function testEmailSending() {
  console.log('📤 Testing Email Sending API...');

  try {
    // Test sending welcome email
    console.log('📧 Testing POST /email/send-welcome...');
    const welcomeData = {
      email: 'test@example.com',
      name: 'Test User',
      tenantId: 'test-tenant-id',
      membershipPlanName: 'Gold Plan'
    };

    const welcomeResponse = await axios.post(`${API_BASE}/email/send-welcome`, welcomeData, {
      headers: {
        'x-bypass-auth': 'true',
        'x-bypass-user': 'admin@creatives-saas.com'
      }
    });
    console.log('✅ Send welcome email successful:', welcomeResponse.data);

    // Test sending admin alert
    console.log('📧 Testing POST /email/send-admin-alert...');
    const adminData = {
      tenantName: 'Test Gym',
      ownerEmail: 'owner@testgym.com',
      tenantId: 'test-tenant-id'
    };

    const adminResponse = await axios.post(`${API_BASE}/email/send-admin-alert`, adminData, {
      headers: {
        'x-bypass-auth': 'true',
        'x-bypass-user': 'admin@creatives-saas.com'
      }
    });
    console.log('✅ Send admin alert successful:', adminResponse.data);

    // Test sending tenant notification
    console.log('📧 Testing POST /email/send-tenant-notification...');
    const notificationData = {
      tenantId: 'test-tenant-id',
      memberName: 'Test Member',
      memberEmail: 'member@test.com',
      membershipPlanName: 'Silver Plan'
    };

    const notificationResponse = await axios.post(`${API_BASE}/email/send-tenant-notification`, notificationData, {
      headers: {
        'x-bypass-auth': 'true',
        'x-bypass-user': 'admin@creatives-saas.com'
      }
    });
    console.log('✅ Send tenant notification successful:', notificationResponse.data);

  } catch (error) {
    console.error('❌ Email sending test failed:', error.response?.data || error.message);
  }
}

async function testEmailLogs() {
  console.log('📋 Testing Email Logs API...');

  try {
    // Test getting email logs
    console.log('📧 Testing GET /email/logs...');
    const logsResponse = await axios.get(`${API_BASE}/email/logs`, {
      headers: {
        'x-bypass-auth': 'true',
        'x-bypass-user': 'admin@creatives-saas.com'
      }
    });
    console.log('✅ GET email logs successful:', logsResponse.data);

  } catch (error) {
    console.error('❌ Email logs test failed:', error.response?.data || error.message);
  }
}

async function runEmailTests() {
  console.log('🚀 Starting Email API Tests...\n');

  // Check if server is running
  try {
    await axios.get(`${API_BASE.replace('/api/v1', '')}`);
    console.log('✅ API server is running\n');
  } catch (error) {
    console.error('❌ API server is not running. Please start with: npm run start:dev');
    process.exit(1);
  }

  await testEmailSettings();
  console.log('');

  await testEmailTemplates();
  console.log('');

  await testEmailSending();
  console.log('');

  await testEmailLogs();
  console.log('');

  console.log('🎉 Email API tests completed!');
}

// Run tests if called directly
if (require.main === module) {
  runEmailTests().catch(console.error);
}

module.exports = { runEmailTests, testEmailSettings, testEmailTemplates, testEmailSending, testEmailLogs };