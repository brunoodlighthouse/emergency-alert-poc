import { EmergencyOverlay } from "@/components/EmergencyOverlay";
import {
  displayEmergencyNotification,
  setupNotificationListeners,
} from "@/lib/notifications";
import { stopAlarmSound } from "@/lib/alarm-sound";
import { Tabs } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import messaging from "@react-native-firebase/messaging";
import notifee from "@notifee/react-native";

export default function AppLayout() {
  const [emergencyAlert, setEmergencyAlert] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const setup = async () => {
      const cleanup = await setupNotificationListeners((title, message) => {
        setEmergencyAlert({ title, message });
        displayEmergencyNotification(title, message, Platform.OS === "android");
      });
      cleanupRef.current = cleanup;

      // App aberto ao tocar em notificação (Notifee)
      const initialNotification = await notifee.getInitialNotification();
      if (initialNotification?.notification) {
        const n = initialNotification.notification;
        const title = n.title?.replace(/^🚨\s/, "") || "Alerta";
        const body = n.body || "";
        stopAlarmSound(); // stop background alarm; overlay will restart it
        setEmergencyAlert({ title, message: body });
      }

      // App aberto ao tocar em notificação (FCM)
      const initialFcm = await messaging().getInitialNotification();
      if (initialFcm?.data?.title && initialFcm?.data?.message) {
        stopAlarmSound(); // stop background alarm; overlay will restart it
        setEmergencyAlert({
          title: String(initialFcm.data.title),
          message: String(initialFcm.data.message),
        });
      }
    };
    setup();
    return () => cleanupRef.current?.();
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#e63946",
          headerStyle: { backgroundColor: "#e63946" },
          headerTintColor: "#fff",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Enviar Alerta",
            tabBarLabel: "Alerta",
          }}
        />
        <Tabs.Screen
          name="groups"
          options={{
            title: "Grupos",
            tabBarLabel: "Grupos",
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            tabBarLabel: "Perfil",
          }}
        />
      </Tabs>

      {emergencyAlert && (
        <EmergencyOverlay
          title={emergencyAlert.title}
          message={emergencyAlert.message}
          onClose={() => setEmergencyAlert(null)}
        />
      )}
    </>
  );
}
