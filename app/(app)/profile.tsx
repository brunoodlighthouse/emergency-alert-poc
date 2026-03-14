import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/firebase';
import { hasDndAccess, openDndAccessSettings, openNotificationSettings } from '@/lib/notifications';

const appVersion = Constants.expoConfig?.version ?? '0.0.0';
const versionCode = Constants.expoConfig?.extra?.versionCode ?? 0;

export default function ProfileScreen() {
  const { user, userData } = useAuth();
  const [dndGranted, setDndGranted] = useState<boolean | null>(null);
  // Android 14+ exige permissão explícita para USE_FULL_SCREEN_INTENT
  const needsFullScreenPermission = Platform.OS === 'android' && Platform.Version >= 34;

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    hasDndAccess().then(setDndGranted);
  }, []);

  const handleFullScreenPermission = () => {
    Alert.alert(
      'Permissão: Tela cheia',
      'Para o alerta aparecer sobre o lockscreen e acender a tela, o app precisa de permissão de "exibição em tela cheia".\n\nNa próxima tela, encontre "Emergency Alert" e ative.',
      [
        {
          text: 'Abrir configurações',
          onPress: () =>
            Linking.sendIntent(
              'android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT',
              [{ key: 'android.provider.extra.APP_PACKAGE', value: 'com.emergencyalert.poc' }]
            ).catch(() => Linking.openSettings()),
        },
        { text: 'Cancelar', style: 'cancel' },
      ],
    );
  };

  const handleDndPermission = async () => {
    Alert.alert(
      'Permissão: Não Perturbe',
      'Para o alerta sonoro funcionar mesmo com o celular no modo "Não Perturbe" ou silencioso, este app precisa de acesso especial.\n\nNa próxima tela, encontre "Emergency Alert" e ative.',
      [
        {
          text: 'Abrir configurações',
          onPress: async () => {
            await openDndAccessSettings();
            // Re-verifica após voltar das configurações
            hasDndAccess().then(setDndGranted);
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ],
    );
  };

  const handleConfigureAlerts = () => {
    const msg =
      Platform.OS === 'android'
        ? 'Para alertas chegarem com app FECHADO:\n\n1. Desative otimização de bateria para este app\n   (Configurações > Apps > Emergency Alert > Bateria > Sem restrições)\n\n2. Para silencioso: Notificações > Alertas de Emergência > Ative "Sobrescrever Não perturbe"'
        : 'Abra as configurações e garanta que notificações estão permitidas.';
    Alert.alert('Configurar alertas', msg, [
      { text: 'Abrir configurações', onPress: openNotificationSettings },
      { text: 'OK' },
    ]);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch {
      Alert.alert('Erro', 'Falha ao sair');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Email / UID</Text>
        <Text style={styles.value}>{user?.email || user?.uid || '-'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Nome</Text>
        <Text style={styles.value}>{userData?.name || '-'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>FCM Token</Text>
        <Text style={styles.tokenValue} numberOfLines={2}>
          {userData?.fcmToken ? `${userData.fcmToken.slice(0, 50)}...` : 'Não registrado'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Grupos inscritos</Text>
        <Text style={styles.value}>
          {userData?.groups?.length ? userData.groups.join(', ') : 'Nenhum'}
        </Text>
      </View>

      {Platform.OS === 'android' && (
        <>
          {needsFullScreenPermission && (
            <TouchableOpacity style={styles.fullScreenButton} onPress={handleFullScreenPermission}>
              <Text style={styles.dndButtonText}>Permitir alerta em tela cheia (Android 14+)</Text>
              <Text style={styles.dndSubtext}>Necessário para acender a tela no lockscreen</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.dndButton, dndGranted === true && styles.dndGranted]}
            onPress={handleDndPermission}
          >
            <Text style={styles.dndButtonText}>
              {dndGranted === true
                ? '✓ Alerta sonoro no Não Perturbe: ativo'
                : 'Habilitar alerta no modo Não Perturbe'}
            </Text>
            {dndGranted === false && (
              <Text style={styles.dndSubtext}>
                Sem isso, o som pode ser bloqueado pelo sistema
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.configButton}
            onPress={handleConfigureAlerts}
          >
            <Text style={styles.configButtonText}>
              Configurar canal de notificações
            </Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>
        Versão {appVersion} ({versionCode})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  label: { fontSize: 12, color: '#666', marginBottom: 4 },
  value: { fontSize: 16 },
  tokenValue: { fontSize: 12, fontFamily: 'monospace' },
  fullScreenButton: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#6A1B9A',
    borderRadius: 8,
    alignItems: 'center',
  },
  dndButton: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#FF6F00',
    borderRadius: 8,
    alignItems: 'center',
  },
  dndGranted: {
    backgroundColor: '#388E3C',
  },
  dndButtonText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
  dndSubtext: { color: '#ffe0b2', fontSize: 12, marginTop: 4, textAlign: 'center' },
  configButton: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  configButtonText: { color: '#fff', fontWeight: '600' },
  logoutButton: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#e63946',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontWeight: '600' },
  versionText: {
    marginTop: 24,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
