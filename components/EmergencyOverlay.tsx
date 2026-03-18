import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { playAlarmSound, stopAlarmSound } from '@/lib/alarm-sound';

interface EmergencyOverlayProps {
  title: string;
  message: string;
  onClose: () => void;
  flashEffect?: boolean;
}

const { width, height } = Dimensions.get('window');

export function EmergencyOverlay({ title, message, onClose, flashEffect = false }: EmergencyOverlayProps) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!flashEffect) return;
    const id = setInterval(() => {
      setFlash((f) => !f);
    }, 500);
    return () => clearInterval(id);
  }, [flashEffect]);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    playAlarmSound();
    return () => stopAlarmSound();
  }, []);

  return (
    <Modal
      visible
      animationType="fade"
      transparent={false}
      onRequestClose={() => { stopAlarmSound(); onClose(); }}
    >
      <View
        style={[
          styles.container,
          flashEffect && { backgroundColor: flash ? '#ff0000' : '#ffffff' },
        ]}
      >
        <View style={styles.content}>
          <Text style={styles.emoji}>🚨</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => { stopAlarmSound(); onClose(); }}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    alignItems: 'center',
    maxWidth: width * 0.9,
  },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#ffcccc',
    textAlign: 'center',
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: '#e63946',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
