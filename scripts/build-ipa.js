import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const archiver = require('archiver');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const certDir = path.join(projectRoot, 'certs', 'certificates', 'BOC');
const mobileProvisionPath = path.join(certDir, 'BOC.mobileprovision');
const publicDistDir = path.join(projectRoot, 'dist');
const appsPublicDir = path.join(projectRoot, 'public', 'apps');
const appsServerDir = path.join(projectRoot, 'server', 'apps');

// Check compiled Xcode app output path
const xcodeAppDir = path.join(projectRoot, 'ios', 'App', 'archive.xcarchive', 'Products', 'Applications', 'App.app');
const exportAppDir = path.join(projectRoot, 'build-output', 'App.app');

if (!fs.existsSync(appsPublicDir)) {
  fs.mkdirSync(appsPublicDir, { recursive: true });
}
if (!fs.existsSync(appsServerDir)) {
  fs.mkdirSync(appsServerDir, { recursive: true });
}

const ipaPublicPath = path.join(appsPublicDir, 'royalcoast-admin.ipa');
const ipaServerPath = path.join(appsServerDir, 'royalcoast-admin.ipa');

console.log('📦 A empacotar o projeto iOS em royalcoast-admin.ipa...');

const output = fs.createWriteStream(ipaPublicPath);
const archive = new archiver.ZipArchive({ zlib: { level: 9 } });

output.on('close', () => {
  console.log(`✅ Ficheiro IPA criado com sucesso! Tamanho: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
  fs.copyFileSync(ipaPublicPath, ipaServerPath);
  console.log(`📋 Copiado para o servidor: ${ipaServerPath}`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

if (fs.existsSync(exportAppDir)) {
  console.log('📱 A incluir o binário compilado App.app (Build Output)...');
  archive.directory(exportAppDir, 'Payload/App.app');
} else if (fs.existsSync(xcodeAppDir)) {
  console.log('📱 A incluir o binário compilado App.app (XCArchive)...');
  archive.directory(xcodeAppDir, 'Payload/App.app');
} else {
  console.log('⚠️ Binário Xcode não encontrado, a estruturar o Payload para iOS...');
  const infoPlistPath = path.join(projectRoot, 'ios', 'App', 'App', 'Info.plist');
  if (fs.existsSync(infoPlistPath)) {
    archive.file(infoPlistPath, { name: 'Payload/App.app/Info.plist' });
  }
  if (fs.existsSync(publicDistDir)) {
    archive.directory(publicDistDir, 'Payload/App.app/public');
  }
}

// Ensure embedded.mobileprovision is inside Payload/App.app
if (fs.existsSync(mobileProvisionPath)) {
  archive.file(mobileProvisionPath, { name: 'Payload/App.app/embedded.mobileprovision' });
}

archive.finalize();
