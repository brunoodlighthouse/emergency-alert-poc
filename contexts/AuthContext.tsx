import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, getUserData, saveUserData, UserData } from '@/lib/firebase';
import { registerForPushNotifications } from '@/lib/notifications';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = async () => {
    if (!auth.currentUser) {
      setUserData(null);
      return;
    }
    const data = await getUserData(auth.currentUser.uid);
    setUserData(data);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const data = await getUserData(u.uid);
        setUserData(data);

        // Registrar FCM token
        const token = await registerForPushNotifications();
        if (token) {
          await saveUserData(u.uid, {
            fcmToken: token,
            name: data?.name || u.email || 'Usuário',
            groups: data?.groups || [],
          });
          setUserData((prev) => ({ ...prev!, fcmToken: token }));
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
