import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputPath = path.resolve('assets/images/hero/hero-baner.png');
const outputDir = path.resolve('apps/landing/public/assets/images/hero');

const sizes = [
  { width: 320, suffix: 'xs' },
  { width: 640, suffix: 'sm' },
  { width: 1024, suffix: 'md' },
  { width: 1280, suffix: 'lg' },
  { width: 1920, suffix: 'xl' },
];

async function optimize() {
  console.log('🖼️  Optimizando hero-baner.png...\n');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const metadata = await sharp(inputPath).metadata();
  console.log(`Original: ${metadata.width}x${metadata.height}, ${(metadata.size / 1024 / 1024).toFixed(2)} MB, formato: ${metadata.format}\n`);

  // Convertir a WebP (buen soporte, buena compresión)
  console.log('📦 Generando WebP...');
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `hero-baner-${size.suffix}.webp`);
    await sharp(inputPath)
      .resize({ width: size.width, withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 })
      .toFile(outputPath);
    const stats = fs.statSync(outputPath);
    console.log(`  ✅ hero-baner-${size.suffix}.webp (${size.width}px) - ${(stats.size / 1024).toFixed(1)} KB`);
  }

  // Convertir a AVIF (mejor compresión, soporte moderno)
  console.log('\n📦 Generando AVIF...');
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `hero-baner-${size.suffix}.avif`);
    await sharp(inputPath)
      .resize({ width: size.width, withoutEnlargement: true })
      .avif({ quality: 50, effort: 9 })
      .toFile(outputPath);
    const stats = fs.statSync(outputPath);
    console.log(`  ✅ hero-baner-${size.suffix}.avif (${size.width}px) - ${(stats.size / 1024).toFixed(1)} KB`);
  }

  // Copiar original como fallback (opcional, para navegadores muy antiguos)
  const fallbackPath = path.join(outputDir, 'hero-baner.png');
  fs.copyFileSync(inputPath, fallbackPath);
  console.log('\n📋 Fallback PNG copiado');

  console.log('\n✅ Optimización completada!');
  console.log(`📁 Archivos en: ${outputDir}`);
}

optimize().catch(console.error);