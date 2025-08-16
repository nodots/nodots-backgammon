const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v3.6/users',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'x-test-auth': 'test-token'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Users found:');
      if (parsed.data && Array.isArray(parsed.data)) {
        parsed.data.forEach(user => {
          console.log(`  - ${user.nickname || user.email}: ${user.id} (${user.userType})`);
        });
      } else {
        console.log(JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();