import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputPath = path.resolve('assets/images/hero/hero-baner.png');
const outputPath = path.resolve('apps/landing/public/assets/images/og-banner.png');

async function createOgImage() {
  console.log('🖼️  Creando og-banner.png (1200x630)...\n');

  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }

  await sharp(inputPath)
    .resize(1200, 630, { fit: 'cover', position: 'center' })
    .png({ quality: 85, compressionLevel: 9 })
    .toFile(outputPath);

  const stats = fs.statSync(outputPath);
  console.log(`✅ og-banner.png creado: ${(stats.size / 1024).toFixed(1)} KB`);
  console.log(`📁 Guardado en: ${outputPath}`);
}

createOgImage().catch(console.error);