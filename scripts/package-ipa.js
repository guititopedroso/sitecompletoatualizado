import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const archiver = require('archiver');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const appSourceDir = process.argv[2];
const outputIpaPath = process.argv[3] || path.join(projectRoot, 'public', 'apps', 'royalcoast-admin.ipa');

if (!appSourceDir || !fs.existsSync(appSourceDir)) {
  console.error(`❌ Directorio de origem App.app inválido ou não especificado: ${appSourceDir}`);
  process.exit(1);
}

const appsPublicDir = path.dirname(outputIpaPath);
if (!fs.existsSync(appsPublicDir)) {
  fs.mkdirSync(appsPublicDir, { recursive: true });
}

console.log(`📦 Criando estrutura oficial iOS IPA com Payload/App.app de: ${appSourceDir}...`);

const output = fs.createWriteStream(outputIpaPath);
const archive = new archiver.ZipArchive({ zlib: { level: 9 } });

output.on('close', () => {
  const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`✅ Ficheiro IPA criado com sucesso! Tamanho: ${sizeMB} MB`);

  const serverAppsDir = path.join(projectRoot, 'server', 'apps');
  if (!fs.existsSync(serverAppsDir)) {
    fs.mkdirSync(serverAppsDir, { recursive: true });
  }
  const serverIpaPath = path.join(serverAppsDir, 'royalcoast-admin.ipa');
  fs.copyFileSync(outputIpaPath, serverIpaPath);
  console.log(`📋 Copiado para o servidor: ${serverIpaPath}`);
});

archive.on('error', (err) => {
  console.error('❌ Erro a criar o arquivo IPA:', err);
  process.exit(1);
});

archive.pipe(output);

// Explicitly place App.app inside top-level Payload/ directory
archive.directory(appSourceDir, 'Payload/App.app');

archive.finalize();
