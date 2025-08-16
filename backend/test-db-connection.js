const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

console.log('Testing database connection...');
console.log('Connection string host:', connectionString?.split('@')[1]?.split('/')[0] || 'Not found');

const client = new Client({
  connectionString: connectionString
});

async function testConnection() {
  try {
    console.log('Attempting to connect...');
    await client.connect();
    console.log('✅ Successfully connected to database');
    
    const result = await client.query('SELECT version()');
    console.log('✅ Database version:', result.rows[0].version);
    
    await client.end();
    console.log('✅ Connection closed successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
