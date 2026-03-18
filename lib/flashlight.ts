import { NativeModules, Platform } from "react-native";

const BLINK_ON_MS = 300;
const BLINK_OFF_MS = 300;
const BLINK_TIMES = 8;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function blinkFlashlight(): Promise<void> {
  if (Platform.OS !== "android") return;
  const { TorchModule } = NativeModules;
  if (!TorchModule) return;
  try {
    for (let i = 0; i < BLINK_TIMES; i++) {
      TorchModule.switchState(true);
      await sleep(BLINK_ON_MS);
      TorchModule.switchState(false);
      await sleep(BLINK_OFF_MS);
    }
  } catch {
    // dispositivo sem flash — ignora
  }
}
