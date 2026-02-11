const http = require('http');

const data = JSON.stringify({
  schoolName: "Test Academy",
  schoolShortCode: "TAC",
  firstName: "Admin",
  lastName: "Test",
  email: "admin@testacademy.edu",
  password: "SecurePassword123!",
  confirmPassword: "SecurePassword123!"
});

const options = {
  hostname: 'localhost',
  port: 44777,
  path: '/api/registration',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('BODY:', body);
    try {
      const parsed = JSON.parse(body);
      console.log('PARSED RESPONSE:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Response is not JSON');
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
