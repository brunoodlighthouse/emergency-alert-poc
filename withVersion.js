const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Injeta versionCode e versionName do version.json no build.gradle durante prebuild.
 */
function withVersion(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const versionPath = path.join(projectRoot, 'version.json');
      const buildGradlePath = path.join(
        projectRoot,
        'android',
        'app',
        'build.gradle'
      );

      if (!fs.existsSync(versionPath) || !fs.existsSync(buildGradlePath)) {
        return config;
      }

      const { version, versionCode } = JSON.parse(
        fs.readFileSync(versionPath, 'utf8')
      );

      let gradle = fs.readFileSync(buildGradlePath, 'utf8');
      gradle = gradle.replace(/versionCode \d+/, `versionCode ${versionCode}`);
      gradle = gradle.replace(/versionName "[^"]+"/, `versionName "${version}"`);
      fs.writeFileSync(buildGradlePath, gradle);

      console.log(`Versão aplicada no prebuild: ${version} (${versionCode})`);
      return config;
    },
  ]);
}

module.exports = withVersion;
