const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Resolve conflito de merge entre expo-notifications e react-native-firebase
 * no AndroidManifest (default_notification_color).
 */
function withFirebaseManifestFix(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const manifestPath = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'AndroidManifest.xml'
      );

      let manifest = fs.readFileSync(manifestPath, 'utf8');

      // 1. Ensure xmlns:tools is declared on the root <manifest> element
      if (!manifest.includes('xmlns:tools=')) {
        manifest = manifest.replace(
          '<manifest ',
          '<manifest xmlns:tools="http://schemas.android.com/tools" '
        );
        console.log('[FirebaseManifestFix] Added xmlns:tools namespace');
      }

      // 2. Add tools:replace="android:resource" to the conflicting meta-data.
      //    Uses a flexible regex that matches any attribute order/spacing.
      const before = manifest;
      manifest = manifest.replace(
        /(<meta-data[^>]*android:name="com\.google\.firebase\.messaging\.default_notification_color"[^>]*?)(\s*\/>)/,
        (match, attrs, closing) => {
          if (attrs.includes('tools:replace')) {
            console.log('[FirebaseManifestFix] tools:replace already present, skipping');
            return match;
          }
          console.log('[FirebaseManifestFix] Applied tools:replace to default_notification_color');
          return `${attrs} tools:replace="android:resource"${closing}`;
        }
      );

      if (manifest === before) {
        console.warn('[FirebaseManifestFix] WARNING: default_notification_color meta-data not found in manifest. Fix was NOT applied.');
      }

      fs.writeFileSync(manifestPath, manifest);
      return config;
    },
  ]);
}

module.exports = withFirebaseManifestFix;
