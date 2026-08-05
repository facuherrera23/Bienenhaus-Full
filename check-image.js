const sharp = require('sharp');
const fs = require('fs');

const inputPath = 'apps/landing/public/placeholder-agent.jpg';

sharp(inputPath).metadata()
  .then(metadata => {
    console.log('Metadata:', JSON.stringify(metadata, null, 2));
  })
  .catch(err => {
    console.error('Error:', err.message);
  });