import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { getGroups } from '@/lib/firebase';
import { AlertForm } from '@/components/AlertForm';

export default function SendAlertScreen() {
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getGroups().then(setGroups);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AlertForm groups={groups} onSuccess={() => Alert.alert('Sucesso', 'Alerta enviado!')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
});
