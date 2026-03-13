const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const VERSION_FILE = path.join(ROOT, 'version.json');

function getVersion() {
  if (!fs.existsSync(VERSION_FILE)) {
    const initial = { version: '1.0.0', versionCode: 1 };
    fs.writeFileSync(VERSION_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
}

function saveVersion(data) {
  fs.writeFileSync(VERSION_FILE, JSON.stringify(data, null, 2));
}

function incrementVersion() {
  const v = getVersion();
  const [major, minor, patch] = v.version.split('.').map(Number);
  const newPatch = patch + 1;
  const newVersion = `${major}.${minor}.${newPatch}`;
  const newVersionCode = v.versionCode + 1;
  const updated = { version: newVersion, versionCode: newVersionCode };
  saveVersion(updated);
  return updated;
}

function applyVersion(version, versionCode) {
  const appJsonPath = path.join(ROOT, 'app.json');
  const packagePath = path.join(ROOT, 'package.json');
  const buildGradlePath = path.join(ROOT, 'android', 'app', 'build.gradle');

  if (fs.existsSync(appJsonPath)) {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    appJson.expo.version = version;
    appJson.expo.extra = appJson.expo.extra || {};
    appJson.expo.extra.versionCode = versionCode;
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  }

  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    pkg.version = version;
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
  }

  if (fs.existsSync(buildGradlePath)) {
    let gradle = fs.readFileSync(buildGradlePath, 'utf8');
    gradle = gradle.replace(/versionCode \d+/, `versionCode ${versionCode}`);
    gradle = gradle.replace(/versionName "[^"]+"/, `versionName "${version}"`);
    fs.writeFileSync(buildGradlePath, gradle);
  }
}

function logVersion(version, versionCode, apkPath) {
  const versionsPath = path.join(ROOT, 'VERSIONS.md');
  const line = `| ${version} | ${versionCode} | ${new Date().toISOString()} | \`${apkPath || '-'}\` |\n`;
  const header = `# Versões do Emergency Alert\n\n## Histórico de builds\n\n| Versão | versionCode | Data | APK |\n|--------|-------------|------|-----|\n`;
  let content = '';
  if (fs.existsSync(versionsPath)) {
    content = fs.readFileSync(versionsPath, 'utf8');
    const sepIndex = content.indexOf('| --- | --- | --- | --- |');
    if (sepIndex >= 0) {
      const insertAt = content.indexOf('\n', sepIndex) + 1;
      content = content.slice(0, insertAt) + line + content.slice(insertAt);
    } else {
      content = header + line;
    }
  } else {
    content = header + '| --- | --- | --- | --- |\n' + line;
  }
  fs.writeFileSync(versionsPath, content);
}

function decrementVersion() {
  const v = getVersion();
  const [major, minor, patch] = v.version.split('.').map(Number);
  if (patch <= 0 && v.versionCode <= 1) {
    console.error('Já está na versão mínima 1.0.0');
    return null;
  }
  const newPatch = Math.max(0, patch - 1);
  const newVersion = `${major}.${minor}.${newPatch}`;
  const newVersionCode = Math.max(1, v.versionCode - 1);
  const updated = { version: newVersion, versionCode: newVersionCode };
  saveVersion(updated);
  return updated;
}

// CLI
const cmd = process.argv[2];
if (cmd === 'increment') {
  const { version, versionCode } = incrementVersion();
  applyVersion(version, versionCode);
  console.log(`Versão incrementada: ${version} (versionCode: ${versionCode})`);
} else if (cmd === 'rollback') {
  const v = decrementVersion();
  if (v) {
    applyVersion(v.version, v.versionCode);
    console.log(`Versão revertida: ${v.version} (versionCode: ${v.versionCode})`);
  }
} else if (cmd === 'apply') {
  const v = getVersion();
  applyVersion(v.version, v.versionCode);
  console.log(`Versão aplicada: ${v.version} (versionCode: ${v.versionCode})`);
} else if (cmd === 'log' && process.argv[3]) {
  const v = getVersion();
  logVersion(v.version, v.versionCode, process.argv[3]);
} else if (cmd === 'current') {
  const v = getVersion();
  console.log(JSON.stringify(v, null, 2));
} else {
  console.log('Uso: node version.js <increment|apply|rollback|log|current> [apkPath]');
}
