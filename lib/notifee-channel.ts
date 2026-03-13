/**
 * Canal de notificação de emergência para Android
 * Usa alta prioridade, categoria ALARM, bypass DND quando permitido
 */
import notifee, {
  AndroidImportance,
  AndroidVisibility,
} from "@notifee/react-native";

export const EMERGENCY_CHANNEL_ID = "emergency_alerts";

export async function createEmergencyChannel(): Promise<void> {
  await notifee.createChannel({
    id: EMERGENCY_CHANNEL_ID,
    name: "Alertas de Emergência",
    importance: AndroidImportance.HIGH,
    description: "Canal para alertas críticos e emergenciais",
    sound: "emergency_alert",
    vibration: true,
    vibrationPattern: [500, 200, 500, 200, 500, 200], // vibrar-pausa-vibrar-pausa-vibrar-pausa (todos valores positivos)
    bypassDnd: true,
    lights: true,
    lightColor: "#ff0000",
    visibility: AndroidVisibility.PUBLIC,
  });
}
