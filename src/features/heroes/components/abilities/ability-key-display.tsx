import Image from "next/image";
import { RIVALS_ICONS } from "@/lib/rivals-assets-paths";

function getKeyIconSource(keyDisplay: string) {
  if (keyDisplay === "LMB") return RIVALS_ICONS.lmb;
  if (keyDisplay === "RMB") return RIVALS_ICONS.rmb;
  return null;
}

export function AbilityKeyDisplay({ keyDisplay }: { keyDisplay: string }) {
  const keyIconSource = getKeyIconSource(keyDisplay);
  if (!keyIconSource) return keyDisplay;

  return (
    <Image
      src={keyIconSource}
      alt={keyDisplay}
      width={18}
      height={18}
      className="h-[18px] w-auto object-contain"
    />
  );
}
