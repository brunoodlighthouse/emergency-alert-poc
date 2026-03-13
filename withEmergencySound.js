const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/** Copia o som de emergência para android/app/src/main/res/raw */
function withEmergencySound(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const rawDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
        'raw'
      );
      const sourceFile = path.join(
        projectRoot,
        'assets',
        'sounds',
        'emergency_alert.wav'
      );

      if (!fs.existsSync(sourceFile)) {
        console.warn('Arquivo de som não encontrado:', sourceFile);
        return config;
      }

      if (!fs.existsSync(rawDir)) {
        fs.mkdirSync(rawDir, { recursive: true });
      }

      const destFile = path.join(rawDir, 'emergency_alert.wav');
      fs.copyFileSync(sourceFile, destFile);
      console.log('Som de emergência copiado para:', destFile);

      return config;
    },
  ]);
}

module.exports = withEmergencySound;
