import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const outputPath = path.resolve('apps/landing/public/placeholder-agent.jpg');

async function createPlaceholderAgent() {
  console.log('🖼️  Creating placeholder-agent.jpg...\n');

  if (!fs.existsSync(path.dirname(path.resolve('apps/landing/public/placeholder-agent.jpg')))) {
    fs.mkdirSync(path.dirname(path.resolve('apps/landing/public/placeholder-agent.jpg')), { recursive: true });
  }

  // Create a placeholder image with initials
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#e8e8e8"/>
      <circle cx="200" cy="150" r="60" fill="#b8b8b8"/>
      <ellipse cx="200" cy="320" rx="100" ry="80" fill="#b8b8b8"/>
      <text x="200" y="380" text-anchor="middle" font-family="Inter, sans-serif" font-size="24" fill="#666" font-weight="500">Agente</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(path.resolve('apps/landing/public/placeholder-agent.jpg'));

  const stats = fs.statSync(path.resolve('apps/landing/public/placeholder-agent.jpg'));
  console.log(`✅ placeholder-agent.jpg creado: ${(stats.size / 1024).toFixed(1)} KB`);
  console.log(`📁 Guardado en: apps/landing/public/placeholder-agent.jpg`);
}

createPlaceholderAgent().catch(console.error);