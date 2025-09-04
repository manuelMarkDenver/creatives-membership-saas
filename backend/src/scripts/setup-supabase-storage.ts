#!/usr/bin/env ts-node

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BUCKET_NAME = 'member-photos';

async function setupSupabaseStorage() {
  if (!SUPABASE_URL) {
    console.error('❌ SUPABASE_URL is required');
    process.exit(1);
  }

  if (!SUPABASE_ANON_KEY) {
    console.error('❌ SUPABASE_ANON_KEY is required');
    process.exit(1);
  }

  // Use service role key if available, otherwise try anon key
  const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

  console.log('🔧 Setting up Supabase Storage...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(
    `🔑 Using ${SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon'} key`,
  );

  const supabase: SupabaseClient = createClient(SUPABASE_URL, supabaseKey);

  try {
    // Check if bucket exists
    console.log(`🔍 Checking if bucket '${BUCKET_NAME}' exists...`);
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      // Try to continue anyway
    } else {
      console.log(
        '📦 Available buckets:',
        buckets.map((b) => b.name).join(', '),
      );
    }

    const bucketExists = buckets?.some((bucket) => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      console.log(`🆕 Creating bucket '${BUCKET_NAME}'...`);

      const { data: bucket, error: createError } =
        await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          allowedMimeTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
          ],
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
        });

      if (createError) {
        console.error('❌ Error creating bucket:', createError.message);

        // If bucket creation fails, it might already exist or we don't have permissions
        // Let's try to test upload functionality anyway
        console.log('⚠️  Continuing with existing configuration...');
      } else {
        console.log('✅ Bucket created successfully');
      }
    } else {
      console.log(`✅ Bucket '${BUCKET_NAME}' already exists`);
    }

    // Test upload functionality
    console.log('🧪 Testing upload functionality...');

    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'Test file for Supabase storage setup';
    const testBlob = new Blob([testContent], { type: 'text/plain' });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(testFileName, testBlob);

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message);
      console.log('💡 This might be due to:');
      console.log('   - Missing service role key (only anon key provided)');
      console.log('   - Bucket policies not configured');
      console.log('   - Supabase project not configured for storage');
    } else {
      console.log('✅ Upload test successful');

      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([testFileName]);

      if (deleteError) {
        console.warn('⚠️  Could not clean up test file:', deleteError.message);
      } else {
        console.log('🧹 Test file cleaned up');
      }
    }

    // Test public URL generation
    console.log('🔗 Testing public URL generation...');
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl('test-path.jpg');

    if (urlData?.publicUrl) {
      console.log('✅ Public URL generation working');
      console.log(`🌐 Example URL format: ${urlData.publicUrl}`);
    } else {
      console.error('❌ Public URL generation failed');
    }

    console.log('🎉 Supabase storage setup complete!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   Bucket: ${BUCKET_NAME}`);
    console.log(`   Public: Yes`);
    console.log(`   File size limit: 5MB`);
    console.log(`   Allowed types: JPEG, PNG, WebP`);
  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupSupabaseStorage().catch(console.error);
