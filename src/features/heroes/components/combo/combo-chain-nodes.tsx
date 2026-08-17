import Image from "next/image";
import type { ComboChainTheme } from "@/features/heroes/components/combo-chain-theme";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { formatKeybindLabel } from "@/features/heroes/keybind-display";
import { AbilityTooltip } from "@/features/heroes/components/ability-tooltip";
import { RepeatBadge, StepTipBadge, OrStepConnector } from "./combo-chain-connectors";
import { StepOnlyTip } from "./combo-chain-hover";
import type { CancelTargetPreview, ResolvedStep } from "./combo-chain-types";

function AbilityNode({
  resolved,
  resourceDelta,
  repeat,
  stepTip,
  theme,
}: {
  resolved: ResolvedAbilityRef;
  resourceDelta?: number;
  repeat?: number;
  stepTip?: string;
  theme: ComboChainTheme;
}) {
  const repeatCount = repeat && repeat > 1 ? repeat : 1;
  const keybindLabel = formatKeybindLabel(resolved.keybind);

  return (
    <div className="flex shrink-0 flex-col items-center gap-1 px-0.5" style={{ minWidth: "5.25rem" }}>
      <AbilityTooltip ability={resolved} stepTip={stepTip}>
        <div className="relative">
          <RepeatBadge count={repeatCount} theme={theme} />
          {stepTip ? <StepTipBadge theme={theme} /> : null}
          <div
            className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border transition-[transform,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-out-soft)] hover:-translate-y-0.5 sm:h-[3.75rem] sm:w-[3.75rem] ${theme.abilityIcon}`}
          >
            {resolved.iconUrl ? (
              <Image
                src={resolved.iconUrl}
                alt=""
                width={44}
                height={44}
                className="h-10 w-10 object-contain sm:h-11 sm:w-11"
              />
            ) : (
              <span className={`text-[10px] font-bold uppercase ${theme.abilityIconFallback}`}>
                {resolved.name.slice(0, 3)}
              </span>
            )}
            <span
              className={`absolute inset-x-0 bottom-0 border-t px-1 py-0.5 text-center text-[9px] font-bold uppercase leading-none tracking-wide sm:text-[10px] ${theme.keybind}`}
            >
              {keybindLabel}
              {repeatCount > 1 ? (
                <span className={`ml-0.5 ${theme.keybindRepeat}`}>×{repeatCount}</span>
              ) : null}
            </span>
          </div>
        </div>
      </AbilityTooltip>

      <span
        className={`line-clamp-2 max-w-[5.5rem] text-center font-display text-[10px] uppercase leading-tight tracking-wide sm:text-[11px] ${theme.abilityName}`}
      >
        {resolved.name}
      </span>

      {resourceDelta !== undefined && resourceDelta !== 0 ? (
        <span
          className={`text-[9px] font-bold tabular-nums leading-none ${
            resourceDelta > 0 ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {resourceDelta > 0 ? "+" : ""}
          {resourceDelta}
        </span>
      ) : null}
    </div>
  );
}

function ActionNode({
  label,
  resourceDelta,
  repeat,
  stepTip,
  theme,
}: {
  label: string;
  resourceDelta?: number;
  repeat?: number;
  stepTip?: string;
  theme: ComboChainTheme;
}) {
  const repeatCount = repeat && repeat > 1 ? repeat : 1;

  const node = (
    <div className="flex shrink-0 flex-col items-center gap-1 px-0.5" style={{ minWidth: "5.25rem" }}>
      <div className="relative">
        <RepeatBadge count={repeatCount} theme={theme} />
        {stepTip ? <StepTipBadge theme={theme} /> : null}
        <div
          className={`relative flex h-14 w-14 items-center justify-center rounded-lg border transition-[transform,background-color] duration-[var(--motion-fast)] ease-[var(--ease-out-soft)] sm:h-[3.75rem] sm:w-[3.75rem] ${theme.actionIcon}`}
        >
          <span className={`px-1 text-center text-[9px] font-semibold uppercase leading-tight sm:text-[10px] ${theme.actionLabel}`}>
            {label}
          </span>
          {repeatCount > 1 ? (
            <span
              className={`absolute inset-x-0 bottom-0 border-t px-1 py-0.5 text-center text-[9px] font-bold leading-none sm:text-[10px] ${theme.keybind}`}
            >
              ×{repeatCount}
            </span>
          ) : null}
        </div>
      </div>

      <span className={`line-clamp-2 max-w-[5.5rem] text-center text-[10px] leading-tight sm:text-[11px] ${theme.actionLabel}`}>
        {label}
      </span>

      {resourceDelta !== undefined && resourceDelta !== 0 ? (
        <span
          className={`text-[9px] font-bold tabular-nums leading-none ${
            resourceDelta > 0 ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {resourceDelta > 0 ? "+" : ""}
          {resourceDelta}
        </span>
      ) : null}
    </div>
  );

  if (!stepTip) return node;

  return <StepOnlyTip tip={stepTip}>{node}</StepOnlyTip>;
}

export function getCancelTargetPreview(resolved: ResolvedStep): CancelTargetPreview {
  if (resolved.step.kind === "ability" && resolved.resolved) {
    return {
      name: resolved.resolved.name,
      iconUrl: resolved.resolved.iconUrl,
    };
  }
  if (resolved.step.kind === "action") {
    return { name: resolved.step.label };
  }
  if (resolved.step.kind === "ability") {
    return { name: resolved.step.abilityRef };
  }
  return { name: "move" };
}

export function renderStepNode(
  { step, resolved, resourceDelta }: ResolvedStep,
  index: number,
  theme: ComboChainTheme,
  playbackIndex: number | null = null,
) {
  const stepTip = "tip" in step && typeof step.tip === "string" ? step.tip : undefined;
  const playback =
    playbackIndex === null
      ? "idle"
      : index === playbackIndex
        ? "active"
        : index < playbackIndex
          ? "past"
          : "idle";

  const node =
    step.kind === "ability" && resolved ? (
      <AbilityNode
        resolved={resolved}
        resourceDelta={resourceDelta}
        repeat={step.repeat}
        stepTip={stepTip}
        theme={theme}
      />
    ) : step.kind === "ability" ? (
      <ActionNode
        label={step.abilityRef}
        resourceDelta={resourceDelta}
        repeat={step.repeat}
        stepTip={stepTip}
        theme={theme}
      />
    ) : (
      <ActionNode
        label={step.label}
        resourceDelta={resourceDelta}
        repeat={step.repeat}
        stepTip={stepTip}
        theme={theme}
      />
    );

  return (
    <div className="hud-combo-step" data-playback={playback}>
      {node}
    </div>
  );
}

export function ForkBranchGroup({
  branchIndices,
  resolvedSteps,
  theme,
  playbackIndex,
}: {
  branchIndices: number[];
  resolvedSteps: ResolvedStep[];
  theme: ComboChainTheme;
  playbackIndex: number | null;
}) {
  return (
    <div
      className={`combo-fork-group relative shrink-0 rounded-lg border px-2 py-2 sm:px-3 ${theme.forkGroup}`}
      style={{ scrollSnapAlign: "center" }}
    >
      <p className={`mb-1.5 text-center font-display text-[9px] font-bold uppercase tracking-[0.2em] ${theme.forkLabel}`}>
        Either route
      </p>
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center sm:gap-0">
        {branchIndices.map((stepIndex, branchIndex) => (
          <div key={stepIndex} className="flex items-center justify-center sm:justify-start">
            {branchIndex > 0 ? <OrStepConnector theme={theme} /> : null}
            {renderStepNode(resolvedSteps[stepIndex], stepIndex, theme, playbackIndex)}
          </div>
        ))}
      </div>
    </div>
  );
}
