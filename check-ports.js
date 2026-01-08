// Quick script to check if ports are in use
const net = require('net');

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

async function main() {
  const ports = [3000, 3001];
  console.log('Checking ports...\n');
  
  for (const port of ports) {
    const available = await checkPort(port);
    if (available) {
      console.log(`✓ Port ${port} is available`);
    } else {
      console.log(`✗ Port ${port} is in use`);
    }
  }
}

main();

