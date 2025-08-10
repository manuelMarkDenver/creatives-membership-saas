const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== Debug Token Extractor ===');
console.log('1. Open http://localhost:3000 in your browser');
console.log('2. Login with your credentials');
console.log('3. Open Developer Tools (F12)');
console.log('4. Go to Console tab');
console.log('5. Type: localStorage.getItem("auth_token")');
console.log('6. Copy the token (without quotes) and paste it here:');
console.log('');

rl.question('Paste your token here: ', (token) => {
  if (token && token.trim()) {
    console.log('\nTesting with your token...\n');
    
    const { spawn } = require('child_process');
    const curl = spawn('curl', [
      '-H', `Authorization: Bearer ${token.trim()}`,
      'http://localhost:5000/api/v1/users/expiring-overview?page=1&limit=10',
      '-v'
    ]);

    curl.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    curl.stderr.on('data', (data) => {
      console.log(data.toString());
    });

    curl.on('close', (code) => {
      console.log(`\nRequest completed with code: ${code}`);
      rl.close();
    });
  } else {
    console.log('No token provided. Exiting...');
    rl.close();
  }
});
