import { Platform } from "react-native";
import Torch from "react-native-torch";

const BLINK_ON_MS = 300;
const BLINK_OFF_MS = 300;
const BLINK_TIMES = 8;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function blinkFlashlight(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    for (let i = 0; i < BLINK_TIMES; i++) {
      await Torch.switchState(true);
      await sleep(BLINK_ON_MS);
      await Torch.switchState(false);
      await sleep(BLINK_OFF_MS);
    }
  } catch {
    // dispositivo sem flash ou permissão negada — ignora silenciosamente
  }
}
