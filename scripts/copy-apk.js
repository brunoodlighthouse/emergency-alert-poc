const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const src = path.join(ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const apksDir = path.join(ROOT, 'apks');

// Carrega versão atual do version.json
function getVersion() {
  const versionPath = path.join(ROOT, 'version.json');
  if (!fs.existsSync(versionPath)) return null;
  return JSON.parse(fs.readFileSync(versionPath, 'utf8'));
}

if (!fs.existsSync(src)) {
  console.error('APK não encontrado em:', src);
  console.error('Execute: npm run build:apk:local');
  process.exit(1);
}

const v = getVersion();
const versionTag = v ? `v${v.version}-${v.versionCode}` : Date.now();
const dest = path.join(apksDir, `emergency-alert-${versionTag}.apk`);

fs.mkdirSync(apksDir, { recursive: true });
fs.copyFileSync(src, dest);

console.log('APK copiado para:', dest);

// Registra no histórico (apks/nome-do-arquivo.apk)
if (v) {
  try {
    const relPath = path.relative(ROOT, dest).replace(/\\/g, '/');
    execSync(`node scripts/version.js log "${relPath}"`, { cwd: ROOT, stdio: 'inherit' });
  } catch (e) {
    // ignora se falhar
  }
}
