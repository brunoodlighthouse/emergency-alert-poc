import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { getGroups } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { saveUserData } from '@/lib/firebase';

export default function GroupsScreen() {
  const { user, userData, refreshUserData } = useAuth();
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    getGroups().then(setGroups);
  }, []);

  const toggleGroup = async (groupId: string) => {
    if (!user) return;
    const current = userData?.groups || [];
    const newGroups = current.includes(groupId)
      ? current.filter((g) => g !== groupId)
      : [...current, groupId];
    await saveUserData(user.uid, { groups: newGroups });
    refreshUserData();
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await addDoc(collection(db, 'groups'), { name: newGroupName.trim() });
      setNewGroupName('');
      setGroups(await getGroups());
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível criar o grupo');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Nome do grupo"
          value={newGroupName}
          onChangeText={setNewGroupName}
        />
        <TouchableOpacity style={styles.createButton} onPress={createGroup}>
          <Text style={styles.createButtonText}>Criar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Seus grupos:</Text>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isInGroup = userData?.groups?.includes(item.id);
          return (
            <TouchableOpacity
              style={[styles.groupItem, isInGroup && styles.groupItemSelected]}
              onPress={() => toggleGroup(item.id)}
            >
              <Text style={styles.groupName}>{item.name}</Text>
              <Text style={styles.groupStatus}>{isInGroup ? '✓ Inscrito' : 'Clique para inscrever'}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  inputRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  createButton: {
    backgroundColor: '#e63946',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 8,
  },
  createButtonText: { color: '#fff', fontWeight: '600' },
  subtitle: { fontSize: 16, marginBottom: 8 },
  groupItem: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  groupItemSelected: { borderColor: '#e63946', backgroundColor: '#fff5f5' },
  groupName: { fontSize: 16, fontWeight: '600' },
  groupStatus: { fontSize: 12, color: '#666', marginTop: 4 },
});
