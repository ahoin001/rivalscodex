export type ComboChainVariant = "light" | "dark";

export type ComboChainTheme = {
  shell: string;
  header: string;
  headerTitle: string;
  contextText: string;
  resourcePill: string;
  scrollFadeFrom: string;
  abilityIcon: string;
  abilityIconFallback: string;
  abilityName: string;
  keybind: string;
  keybindRepeat: string;
  actionIcon: string;
  actionLabel: string;
  connectorMicro: string;
  forkGroup: string;
  forkLabel: string;
  orConnector: string;
  orLabel: string;
  orSub: string;
  forkStem: string;
  forkStemSub: string;
  repeatBadge: string;
  stepTipBadge: string;
};

export const COMBO_CHAIN_THEMES: Record<ComboChainVariant, ComboChainTheme> = {
  light: {
    shell:
      "border-rivals-light-300/90 bg-gradient-to-b from-white via-rivals-light-50/70 to-rivals-light-100/80 shadow-[0_2px_16px_rgba(0,0,0,0.06)]",
    header: "border-b border-rivals-light-300/90 bg-white/95",
    headerTitle: "text-rivals-ink",
    contextText: "text-rivals-ink-soft",
    resourcePill:
      "border-amber-500/35 bg-amber-50 text-amber-800",
    scrollFadeFrom: "from-rivals-light-100",
    abilityIcon:
      "border-brand-gold/35 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:border-brand-gold/55 hover:shadow-[0_4px_12px_rgba(201,162,93,0.18)]",
    abilityIconFallback: "text-rivals-ink-muted",
    abilityName: "text-rivals-ink",
    keybind:
      "border-rivals-light-300 bg-rivals-light-100 text-rivals-ink-muted",
    keybindRepeat: "text-brand-gold",
    actionIcon:
      "border-dashed border-rivals-light-400 bg-rivals-light-100/90 hover:border-rivals-ink/25",
    actionLabel: "text-rivals-ink-muted",
    connectorMicro: "text-rivals-ink-muted",
    forkGroup:
      "border-violet-300/45 bg-gradient-to-br from-violet-50/80 via-white to-rivals-light-50/90 shadow-[inset_0_1px_0_rgb(255_255_255/80%)]",
    forkLabel: "text-violet-700/90",
    orConnector: "border-violet-400/45 bg-violet-100/80 text-violet-700",
    orLabel: "text-violet-700",
    orSub: "text-violet-600/75",
    forkStem: "text-violet-600/85",
    forkStemSub: "text-violet-600/70",
    repeatBadge:
      "border-brand-gold/55 bg-white text-brand-gold shadow-[0_1px_4px_rgba(0,0,0,0.12)]",
    stepTipBadge:
      "border-cyan-500/40 bg-cyan-50 text-cyan-700",
  },
  dark: {
    shell:
      "border-white/12 bg-[#161b28]/95 shadow-[0_6px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
    header: "border-b border-white/10 bg-[#1e2436]/80",
    headerTitle: "text-white",
    contextText: "text-white/65",
    resourcePill:
      "border-amber-500/30 bg-amber-500/10 text-amber-300",
    scrollFadeFrom: "from-[#161b28]",
    abilityIcon:
      "border-brand-gold/45 bg-[#1a1f2e] shadow-[0_0_8px_rgba(201,162,93,0.12)] hover:border-brand-gold hover:shadow-[0_0_16px_rgba(201,162,93,0.25)]",
    abilityIconFallback: "text-white/60",
    abilityName: "text-white/80",
    keybind: "border-white/20 bg-white/8 text-white/70",
    keybindRepeat: "text-brand-gold",
    actionIcon:
      "border-dashed border-white/25 bg-[#1a1f2e]/60 hover:border-white/40",
    actionLabel: "text-white/50",
    connectorMicro: "text-white/50",
    forkGroup:
      "border-violet-400/30 bg-gradient-to-br from-violet-500/10 via-[#1a1f2e]/80 to-[#161b28]/90 shadow-[inset_0_1px_0_rgb(167_139_250/15%)]",
    forkLabel: "text-violet-300/90",
    orConnector:
      "border-violet-400/55 bg-violet-500/20 text-violet-200 shadow-[0_0_14px_rgb(167_139_250/30%)]",
    orLabel: "text-violet-200",
    orSub: "text-violet-300/75",
    forkStem: "text-violet-300/90",
    forkStemSub: "text-violet-300/70",
    repeatBadge:
      "border-brand-gold/60 bg-[#2a2038] text-brand-gold shadow-[0_0_10px_rgb(var(--brand-gold-rgb)/35%)]",
    stepTipBadge:
      "border-cyan-400/50 bg-cyan-500/25 text-cyan-100",
  },
};

export function getComboChainTheme(variant: ComboChainVariant): ComboChainTheme {
  return COMBO_CHAIN_THEMES[variant];
}
