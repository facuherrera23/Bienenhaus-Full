const https = require('https');
https.get('https://facuherrera23.github.io/Bienenhaus-Full/admin/assets/index-Cah-r8ZB.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/https?:\/\/[^"'\s]+\.supabase\.co/);
    console.log('Supabase URL:', match ? match[0] : 'NO ENCONTRADA');
  });
});