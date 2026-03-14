/**
 * Configuração Firebase
 * Substitua os valores pelas credenciais do seu projeto Firebase
 */
import {
  Auth,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  getAuth,
  initializeAuth,
  Persistence,
  signInAnonymously,
  signInWithEmailAndPassword,
  UserCredential,
} from "@firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { Platform } from "react-native";

// getReactNativePersistence existe apenas no build RN do @firebase/auth (não está nos types principais)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getReactNativePersistence } = require("@firebase/auth") as {
  getReactNativePersistence: (storage: {
    getItem: (k: string) => Promise<string | null>;
    setItem: (k: string, v: string) => Promise<void>;
    removeItem: (k: string) => Promise<void>;
  }) => Persistence;
};

const firebaseConfig = {
  apiKey: "",
  authDomain: "", 
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (Platform.OS === "web") {
    auth = getAuth(app);
  } else {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
  db = getFirestore(app);
} else {
  app = getApps()[0] as FirebaseApp;
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };

// Auth helpers
export const signIn = (
  email: string,
  password: string,
): Promise<UserCredential> => signInWithEmailAndPassword(auth, email, password);

export const signUp = (
  email: string,
  password: string,
): Promise<UserCredential> =>
  createUserWithEmailAndPassword(auth, email, password);

export const signInAnon = (): Promise<UserCredential> =>
  signInAnonymously(auth);

export const signOut = (): Promise<void> => firebaseSignOut(auth);

// Firestore types
export interface UserData {
  name: string;
  groups: string[];
  fcmToken: string;
}

export interface GroupData {
  name: string;
}

export interface AlertData {
  title: string;
  message: string;
  target: string; // 'todos' ou groupId
  createdAt: Timestamp;
  createdBy: string;
}

// Firestore helpers
export const saveUserData = async (
  userId: string,
  data: Partial<UserData>,
): Promise<void> => {
  await setDoc(doc(db, "users", userId), data, { merge: true });
};

export const getUserData = async (userId: string): Promise<UserData | null> => {
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? (snap.data() as UserData) : null;
};

export const getGroups = async (): Promise<{ id: string; name: string }[]> => {
  const snap = await getDocs(collection(db, "groups"));
  return snap.docs.map((d) => ({
    id: d.id,
    name: (d.data() as GroupData).name,
  }));
};

export const getUsersByGroup = async (groupId: string): Promise<string[]> => {
  const snap = await getDocs(
    query(collection(db, "users"), where("groups", "array-contains", groupId)),
  );
  return snap.docs.map((d) => d.id);
};

export const getAllUserTokens = async (): Promise<
  { userId: string; fcmToken: string }[]
> => {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs
    .map((d) => ({
      userId: d.id,
      fcmToken: (d.data() as UserData).fcmToken,
    }))
    .filter((u) => u.fcmToken);
};

export const createAlert = async (
  title: string,
  message: string,
  target: string,
  createdBy: string,
): Promise<string> => {
  const ref = await addDoc(collection(db, "alerts"), {
    title,
    message,
    target,
    createdBy,
    createdAt: Timestamp.now(),
  });
  return ref.id;
};
