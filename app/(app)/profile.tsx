import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/firebase';
import { openNotificationSettings } from '@/lib/notifications';

const appVersion = Constants.expoConfig?.version ?? '0.0.0';
const versionCode = Constants.expoConfig?.extra?.versionCode ?? 0;

export default function ProfileScreen() {
  const { user, userData } = useAuth();

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
        <TouchableOpacity
          style={styles.configButton}
          onPress={handleConfigureAlerts}
        >
          <Text style={styles.configButtonText}>
            Configurar alertas (silencioso / Não perturbe)
          </Text>
        </TouchableOpacity>
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
