// Quick script to test if signaling server is accessible
const http = require('http');

const testConnection = (host, port) => {
  return new Promise((resolve) => {
    const options = {
      hostname: host,
      port: port,
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      console.log(`✓ Server is accessible at http://${host}:${port}`);
      console.log(`  Status: ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (error) => {
      console.log(`✗ Cannot connect to http://${host}:${port}`);
      console.log(`  Error: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`✗ Connection timeout to http://${host}:${port}`);
      console.log(`  Server may not be running or firewall is blocking`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

// Get IP from command line or use default
const args = process.argv.slice(2);
const ip = args[0] || 'localhost';
const port = args[1] || '3001';

console.log(`Testing connection to signaling server...\n`);
testConnection(ip, port).then((success) => {
  if (!success) {
    console.log('\nTroubleshooting:');
    console.log('1. Make sure the server is running: npm run server');
    console.log('2. Check if port 3001 is open: netstat -ano | findstr :3001');
    console.log('3. Verify the IP address is correct');
    console.log('4. Check Windows Firewall settings');
    process.exit(1);
  } else {
    console.log('\n✓ Connection test passed!');
    process.exit(0);
  }
});

