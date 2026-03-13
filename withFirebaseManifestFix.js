const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');

/**
 * Resolve conflito de merge entre expo-notifications e react-native-firebase
 * no AndroidManifest (default_notification_color).
 */
function withFirebaseManifestFix(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const manifestPath = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'AndroidManifest.xml'
      );

      const fs = require('fs');
      let manifest = fs.readFileSync(manifestPath, 'utf8');

      manifest = manifest.replace(
        /<meta-data android:name="com\.google\.firebase\.messaging\.default_notification_color" android:resource="@color\/notification_icon_color"\/>/,
        '<meta-data android:name="com.google.firebase.messaging.default_notification_color" android:resource="@color/notification_icon_color" tools:replace="android:resource"/>'
      );

      fs.writeFileSync(manifestPath, manifest);
      console.log('Firebase manifest fix aplicado (tools:replace)');

      return config;
    },
  ]);
}

module.exports = withFirebaseManifestFix;
