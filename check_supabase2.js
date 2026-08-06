const https = require('https');
https.get('https://facuherrera23.github.io/Bienenhaus-Full/admin/assets/vendor-supabase-9sjdAsS8.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/https?:\/\/[^"'\s]+\.supabase\.co/);
    console.log('Supabase URL:', match ? match[0] : 'NO ENCONTRADA');
    // Also check for anon key pattern
    const keyMatch = data.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    console.log('JWT-like token:', keyMatch ? keyMatch[0].substring(0, 50) + '...' : 'NO ENCONTRADA');
  });
});