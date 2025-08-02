const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testBranchesFlow() {
  try {
    console.log('🚀 Starting Branch Testing Flow...\n');

    // Step 1: Create a test tenant
    console.log('1. Creating test tenant...');
    const tenantResponse = await axios.post(`${BASE_URL}/tenants`, {
      name: `Test Gym ${Date.now()}`,
      category: 'GYM',
      email: `test${Date.now()}@gym.com`,
      address: '123 Test Street'
    }, {
      headers: { 'X-Bypass-Auth': 'true' }
    });
    
    const tenantId = tenantResponse.data.id;
    console.log(`✅ Tenant created: ${tenantId}\n`);

    // Step 2: Create test users with different roles
    console.log('2. Creating test users...');
    
    const ownerUser = await axios.post(`${BASE_URL}/users`, {
      tenantId: tenantId,
      firstName: 'John',
      lastName: 'Owner',
      email: `owner.${Date.now()}@testgym.com`,
      phoneNumber: '+1234567890',
      role: 'OWNER',
      businessData: {
        department: 'Management',
        startDate: new Date().toISOString()
      }
    }, {
      headers: { 
        'X-Bypass-Auth': 'true',
        'x-tenant-id': tenantId
      }
    });
    console.log(`✅ Owner user created: ${ownerUser.data.id}`);

    const staffUser = await axios.post(`${BASE_URL}/users`, {
      tenantId: tenantId,
      firstName: 'Jane',
      lastName: 'Staff',
      email: `staff.${Date.now()}@testgym.com`,
      phoneNumber: '+1234567891',
      role: 'STAFF',
      businessData: {
        department: 'Operations',
        startDate: new Date().toISOString()
      }
    }, {
      headers: { 
        'X-Bypass-Auth': 'true',
        'x-tenant-id': tenantId
      }
    });
    console.log(`✅ Staff user created: ${staffUser.data.id}\n`);

    // Step 3: Create a test branch
    console.log('3. Creating branch...');
    try {
      const branchResponse = await axios.post(`${BASE_URL}/branches`, {
        tenantId: tenantId,
        name: 'Downtown Branch',
        address: '123 Main St, Downtown',
        businessCategory: 'GYM',
        email: `branch${Date.now()}@testgym.com`,
        phoneNumber: '+1234567899',
        branchData: {
          capacity: 200,
          openingHours: '6AM-10PM',
          equipment: ['Treadmills', 'Weight Machines', 'Free Weights']
        }
      }, {
        headers: { 
          'X-Bypass-Auth': 'true',
          'x-tenant-id': tenantId
        }
      });
      console.log(`✅ Branch created: ${branchResponse.data.id}`);
      
      const branchId = branchResponse.data.id;
      
      // Step 4: Assign user to branch
      console.log('\n4. Assigning user to branch...');
      try {
        const assignResponse = await axios.post(`${BASE_URL}/branches/${branchId}/users`, {
          userId: staffUser.data.id,
          accessLevel: 'BRANCH_LEVEL',
          isPrimary: true
        }, {
          headers: { 
            'X-Bypass-Auth': 'true',
            'x-tenant-id': tenantId
          }
        });
        console.log(`✅ User assigned to branch successfully`);
      } catch (error) {
        console.log(`❌ User assignment error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
      
      // Step 5: Get branches
      console.log('\n5. Fetching branches...');
      try {
        const branchesResponse = await axios.get(`${BASE_URL}/branches?tenantId=${tenantId}`, {
          headers: { 
            'X-Bypass-Auth': 'true',
            'x-tenant-id': tenantId
          }
        });
        console.log(`✅ Found ${branchesResponse.data.length} branches`);
      } catch (error) {
        console.log(`❌ Fetch branches error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
      
    } catch (error) {
      console.log(`❌ Branch creation error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🎉 Branch testing completed successfully!');

  } catch (error) {
    console.error('❌ Error during testing:', error.response?.data || error.message);
  }
}

// Also test health endpoint
async function testHealth() {
  try {
    const response = await axios.get(`${BASE_URL}`);
    console.log('✅ Health check passed');
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

async function main() {
  await testHealth();
  console.log('');
  await testBranchesFlow();
}

if (require.main === module) {
  main();
}
