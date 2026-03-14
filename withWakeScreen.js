const { withMainActivity } = require('@expo/config-plugins');

/**
 * Adiciona flags de janela na MainActivity para que o app consiga
 * acender a tela e aparecer sobre o lockscreen ao receber um alerta
 * (full-screen intent do Notifee).
 */
function withWakeScreen(config) {
  return withMainActivity(config, (config) => {
    const { modResults } = config;
    const isKotlin = modResults.language === 'kt';

    if (modResults.contents.includes('setShowWhenLocked')) {
      // Já aplicado
      return config;
    }

    const wakeCode = isKotlin
      ? [
          '    // Acende tela e exibe sobre lockscreen para alertas de emergência',
          '    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {',
          '      setShowWhenLocked(true)',
          '      setTurnScreenOn(true)',
          '    }',
          '    window.addFlags(',
          '      android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or',
          '      android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or',
          '      android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON',
          '    )',
        ].join('\n')
      : [
          '    // Acende tela e exibe sobre lockscreen para alertas de emergência',
          '    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {',
          '      setShowWhenLocked(true);',
          '      setTurnScreenOn(true);',
          '    }',
          '    getWindow().addFlags(',
          '      android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |',
          '      android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |',
          '      android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON',
          '    );',
        ].join('\n');

    // Insere logo após super.onCreate(...) — aceita qualquer argumento
    modResults.contents = modResults.contents.replace(
      /(super\.onCreate\([^)]*\))/,
      `$1\n${wakeCode}`
    );

    console.log('[withWakeScreen] Flags de wake screen adicionadas à MainActivity');
    return config;
  });
}

module.exports = withWakeScreen;
