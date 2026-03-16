/**
 * Handler de mensagens FCM em background/killed.
 * DEVE ser importado no início do app (ex: app/_layout.tsx).
 * Processa data-only messages e exibe via Notifee (canal com bypass DND).
 */
import notifee, {
  AndroidCategory,
  AndroidImportance,
  NotificationPressAction,
} from "@notifee/react-native";
import messaging from "@react-native-firebase/messaging";
import {
  EMERGENCY_CHANNEL_ID,
  createEmergencyChannel,
} from "./notifee-channel";
import { blinkFlashlight } from "./flashlight";

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  const data = remoteMessage.data;
  if (data?.isEmergency === "true" && data?.title && data?.message) {
    await createEmergencyChannel();
    blinkFlashlight();
    await notifee.displayNotification({
      title: `🚨 ${data.title}`,
      body: String(data.message),
      android: {
        channelId: EMERGENCY_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.ALARM,
        lightUpScreen: true,
        loopSound: true,
        smallIcon: "ic_launcher",
        color: "#ff0000",
        pressAction: { id: "default" } as NotificationPressAction,
        fullScreenAction: {
          id: "emergency",
          launchActivity: "default",
        },
      },
    });
  }
});
