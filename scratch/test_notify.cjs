const http = require('http');

const data = JSON.stringify({
  clientPhone: '351930663083',
  clientName: 'Guilherme',
  firstName: 'Guilherme',
  clientEmail: 'guilherme@example.com',
  packName: 'Sea-Doo GTI 130 Teste',
  bookingDate: '15/08/2026',
  bookingTime: '15:00',
  location: 'Setúbal',
  numPeople: '2',
  totalPriceStr: '140€',
  adminPhone: '351930663083'
});

const options = {
  hostname: '127.0.0.1',
  port: 5173,
  path: '/api/notify/whatsapp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('RESPONSE:', body);
  });
});

req.on('error', (e) => {
  console.error(`PROBLEM: ${e.message}`);
});

req.write(data);
req.end();
