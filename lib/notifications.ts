/**
 * Configuração de notificações: FCM + Notifee
 * - Token FCM via @react-native-firebase/messaging (data-only messages)
 * - Exibe notificações de emergência via Notifee (canal com bypass DND)
 */
import notifee, {
  AndroidCategory,
  AndroidImportance,
  EventType,
} from "@notifee/react-native";
import messaging from "@react-native-firebase/messaging";
import * as Device from "expo-device";
import { PermissionsAndroid, Platform } from "react-native";
import {
  EMERGENCY_CHANNEL_ID,
  createEmergencyChannel,
} from "./notifee-channel";

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("Push notifications requerem dispositivo físico");
    return null;
  }

  if (Platform.OS === "web") {
    return null;
  }

  if (Platform.OS === "android") {
    if (Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn("Permissão de notificação negada");
        return null;
      }
    }
  } else {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (!enabled) {
      console.warn("Permissão de notificação negada");
      return null;
    }
  }

  const token = await messaging().getToken();
  return token;
}

export async function setupNotificationListeners(
  onEmergencyAlert: (title: string, message: string) => void,
): Promise<() => void> {
  await createEmergencyChannel();

  // Mensagens FCM em foreground (data-only) - callback exibe via Notifee e mostra overlay
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
    const data = remoteMessage.data;
    if (data?.isEmergency === "true" && data?.title && data?.message) {
      const title = String(data.title);
      const message = String(data.message);
      onEmergencyAlert(title, message); // layout chama displayEmergencyNotification no callback
    }
  });

  // Clique na notificação (Notifee)
  const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      const notification = detail.notification;
      if (notification) {
        const title = notification.title?.replace(/^🚨\s/, "") || "Alerta";
        const body = notification.body || "";
        onEmergencyAlert(title, body);
      }
    }
  });

  return () => {
    unsubscribeForeground();
    unsubscribeNotifee();
  };
}

/**
 * Exibe notificação de emergência com Notifee
 * - Canal com bypassDnd, categoria ALARM
 * - fullScreenAction para tela cheia quando bloqueado
 * - Som de alarme, vibração forte
 */
export async function displayEmergencyNotification(
  title: string,
  message: string,
  fullScreenAction?: boolean,
): Promise<void> {
  await createEmergencyChannel();

  await notifee.displayNotification({
    title: `🚨 ${title}`,
    body: message,
    android: {
      channelId: EMERGENCY_CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      category: AndroidCategory.ALARM,
      smallIcon: "ic_launcher",
      color: "#ff0000",
      lightUpScreen: true,
      loopSound: true,
      pressAction: { id: "default" },
      ...(fullScreenAction && {
        fullScreenAction: {
          id: "emergency",
          launchActivity: "default",
        },
      }),
    },
  });
}

/**
 * Abre as configurações do app para o usuário habilitar
 * "Sobrescrever Não perturbe" no canal de emergência.
 */
export async function openNotificationSettings(): Promise<void> {
  const { Linking } = await import("react-native");
  await Linking.openSettings();
}

/**
 * Verifica se o app tem acesso ao Não Perturbe (ACCESS_NOTIFICATION_POLICY).
 * Necessário para bypassDnd funcionar no Android.
 */
export async function hasDndAccess(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  try {
    const settings = await notifee.getNotificationSettings();
    // android.alarm indica se o app pode agendar alarmes exatos;
    // android.notification indica o estado geral de notificações.
    // Notifee não expõe isNotificationPolicyAccessGranted diretamente,
    // mas podemos detectar via NativeModules.
    const { NativeModules } = await import("react-native");
    const granted =
      NativeModules?.NotifeeApiModule?.isNotificationPolicyAccessGranted?.() ??
      null;
    if (granted !== null) return granted;
    // fallback: assume não concedido para solicitar ao usuário
    return false;
  } catch {
    return false;
  }
}

/**
 * Abre a tela de sistema "Acesso ao Não Perturbe" para o usuário
 * conceder permissão ao app. Necessário para alertas sonoros em modo DND.
 */
export async function openDndAccessSettings(): Promise<void> {
  if (Platform.OS !== "android") return;
  const { Linking } = await import("react-native");
  try {
    await Linking.sendIntent(
      "android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS",
    );
  } catch {
    // fallback para configurações gerais se a intent não for suportada
    await Linking.openSettings();
  }
}
