const axios = require('axios');

async function debugExpiringMembers() {
  try {
    // Test the expiring members API endpoint
    const response = await axios.get('http://localhost:5000/api/v1/users/expiring-members-count?days=7', {
      headers: {
        'x-bypass-auth': 'true',
        'x-tenant-id': 'your-tenant-id' // This will need to be replaced with actual tenant ID
      }
    });
    
    console.log('Backend API Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    
    // Try to get all members to see what's available
    console.log('\nTrying to get all members to debug...');
    try {
      const membersResponse = await axios.get('http://localhost:5000/api/v1/users/tenant/your-tenant-id?role=GYM_MEMBER', {
        headers: {
          'x-bypass-auth': 'true'
        }
      });
      
      console.log(`Found ${membersResponse.data.length} total members`);
      
      // Check each member's subscription status
      membersResponse.data.forEach((member, idx) => {
        const subscription = member.customerSubscriptions?.[0];
        if (subscription) {
          const endDate = new Date(subscription.endDate);
          const now = new Date();
          const inSevenDays = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
          
          const isExpiring = endDate > now && endDate <= inSevenDays;
          const isExpired = endDate < now;
          
          console.log(`${idx + 1}. ${member.email}:`);
          console.log(`   Status: ${subscription.status}`);
          console.log(`   End Date: ${subscription.endDate}`);
          console.log(`   Cancelled At: ${subscription.cancelledAt}`);
          console.log(`   User Active: ${member.isActive}`);
          console.log(`   User Deleted: ${member.deletedAt}`);
          console.log(`   Is Expiring: ${isExpiring}`);
          console.log(`   Is Expired: ${isExpired}`);
          console.log('');
        }
      });
    } catch (innerError) {
      console.error('Members API Error:', innerError.response?.data || innerError.message);
    }
  }
}

debugExpiringMembers();
