import { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { createAlert } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface AlertFormProps {
  groups: { id: string; name: string }[];
  onSuccess: () => void;
}

export function AlertForm({ groups, onSuccess }: AlertFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('todos');

  const handleSend = async () => {
    if (!title.trim() || !message.trim() || !user) return;

    try {
      await createAlert(title.trim(), message.trim(), target, user.uid);
      setTitle('');
      setMessage('');
      setTarget('todos');
      onSuccess();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Título</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Alerta de inundação"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Mensagem</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Descreva o alerta..."
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Destino</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.targetScroll}>
        <TouchableOpacity
          style={[styles.targetChip, target === 'todos' && styles.targetChipSelected]}
          onPress={() => setTarget('todos')}
        >
          <Text style={[styles.targetChipText, target === 'todos' && styles.targetChipTextSelected]}>
            Todos
          </Text>
        </TouchableOpacity>
        {groups.map((g) => (
          <TouchableOpacity
            key={g.id}
            style={[styles.targetChip, target === g.id && styles.targetChipSelected]}
            onPress={() => setTarget(g.id)}
          >
            <Text style={[styles.targetChipText, target === g.id && styles.targetChipTextSelected]}>
              {g.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={handleSend}>
        <Text style={styles.buttonText}>Enviar Alerta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 24 },
  label: { fontSize: 14, marginBottom: 6, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  targetScroll: { marginBottom: 16, maxHeight: 48 },
  targetChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
  },
  targetChipSelected: { backgroundColor: '#e63946' },
  targetChipText: { fontSize: 14 },
  targetChipTextSelected: { color: '#fff', fontWeight: '600' },
  button: {
    backgroundColor: '#e63946',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
