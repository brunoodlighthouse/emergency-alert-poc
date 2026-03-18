import { NativeModules, Platform } from "react-native";

const { AlarmSoundModule } = NativeModules;

export function playAlarmSound(): void {
  if (Platform.OS !== "android" || !AlarmSoundModule) return;
  try {
    AlarmSoundModule.play();
  } catch {
    // module unavailable — silently ignore
  }
}

export function stopAlarmSound(): void {
  if (Platform.OS !== "android" || !AlarmSoundModule) return;
  try {
    AlarmSoundModule.stop();
  } catch {
    // module unavailable — silently ignore
  }
}

export async function isDndAccessGranted(): Promise<boolean> {
  if (Platform.OS !== "android" || !AlarmSoundModule) return true;
  try {
    return await AlarmSoundModule.isDndAccessGranted();
  } catch {
    return false;
  }
}
