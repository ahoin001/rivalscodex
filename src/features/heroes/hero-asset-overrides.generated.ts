import { StaticImageData } from "next/image";
import black_widow_portrait from "../../../rivals-assets/heros/black-widow/black-widow.png";
import black_widow_frame from "../../../rivals-assets/heros/black-widow/black-widow-frame.png";
import luna_portrait from "../../../rivals-assets/heros/luna/luna.png";
import luna_frame from "../../../rivals-assets/heros/luna/luna-frame.png";
import luna_stackLogo from "../../../rivals-assets/heros/luna/luna-stack-logo.png";

export type HeroAssetOverride = {
  portrait?: StaticImageData;
  frame?: StaticImageData;
  logo?: StaticImageData;
  stackLogo?: StaticImageData;
};

export const generatedHeroAssetOverrides: Record<string, HeroAssetOverride> = {
  "black-widow": { portrait: black_widow_portrait, frame: black_widow_frame },
  "luna": { portrait: luna_portrait, frame: luna_frame, stackLogo: luna_stackLogo },
};
