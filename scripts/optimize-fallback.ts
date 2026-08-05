import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputPath = path.resolve('assets/images/hero/hero-baner.png');
const outputPath = path.resolve('apps/landing/public/assets/images/hero/hero-baner.png');

async function optimizeFallback() {
  console.log('🖼️  Optimizando fallback PNG...\n');

  const metadata = await sharp(inputPath).metadata();
  console.log(`Original: ${metadata.width}x${metadata.height}, ${(metadata.size / 1024 / 1024).toFixed(2)} MB, formato: ${metadata.format}\n`);

  // Crear versión optimizada mucho más pequeña (baja calidad, para fallback)
  await sharp(inputPath)
    .resize({ width: 1920, withoutEnlargement: true })
    .png({ quality: 40, compressionLevel: 9, effort: 10 })
    .toFile(outputPath);

  const stats = fs.statSync(outputPath);
  console.log(`✅ Fallback PNG optimizado: ${(stats.size / 1024 / 1024).toFixed(2)} MB (antes: ${(metadata.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`📁 Guardado en: ${outputPath}`);
}

optimizeFallback().catch(console.error);