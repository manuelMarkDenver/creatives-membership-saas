const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'member-photos';

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Service Role Key:', serviceRoleKey ? 'CONFIGURED' : 'NOT CONFIGURED');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

async function testSupabase() {
  try {
    console.log('\n1. Testing bucket listing...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError);
      return false;
    }
    
    console.log('✅ Successfully listed buckets:', buckets.map(b => b.name));
    
    // Check if our bucket exists
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    console.log(`\n2. Bucket '${bucketName}' exists:`, bucketExists);
    
    if (!bucketExists) {
      console.log(`\n3. Creating bucket '${bucketName}'...`);
      const { data: createData, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        console.error('❌ Failed to create bucket:', createError);
        return false;
      }
      
      console.log('✅ Successfully created bucket');
    }
    
    console.log(`\n4. Testing file upload to bucket '${bucketName}'...`);
    const testFileName = 'test-upload.txt';
    const testContent = 'This is a test file';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, Buffer.from(testContent), {
        contentType: 'text/plain',
        upsert: true
      });
      
    if (uploadError) {
      console.error('❌ Failed to upload test file:', uploadError);
      return false;
    }
    
    console.log('✅ Successfully uploaded test file:', uploadData);
    
    console.log('\n5. Testing public URL generation...');
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(testFileName);
      
    console.log('✅ Public URL:', urlData.publicUrl);
    
    console.log('\n6. Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([testFileName]);
      
    if (deleteError) {
      console.warn('⚠️ Failed to delete test file:', deleteError);
    } else {
      console.log('✅ Test file deleted');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

testSupabase().then(success => {
  if (success) {
    console.log('\n🎉 Supabase storage is working correctly!');
  } else {
    console.log('\n💥 Supabase storage test failed');
  }
  process.exit(success ? 0 : 1);
});
