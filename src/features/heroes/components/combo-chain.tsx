"use client";

import {
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import type { ComboStep, ComboModifier, ComboDifficulty, ComboResourceCost } from "@/data/schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { resolveAbilityRef } from "@/features/heroes/ability-lookup";
import { formatKeybindLabel } from "@/features/heroes/keybind-display";
import {
  getDifficultyTier,
  getModifierDescriptor,
} from "@/features/heroes/combo-display";
import { buildComboChainSegments } from "@/features/heroes/combo-chain-layout";
import { AbilityTooltip } from "@/features/heroes/components/ability-tooltip";
import {
  type ComboChainTheme,
  type ComboChainVariant,
  getComboChainTheme,
} from "@/features/heroes/components/combo-chain-theme";

type ResolvedStep = {
  step: ComboStep;
  resolved: ResolvedAbilityRef | null;
  resourceDelta?: number;
};

type ComboChainProps = {
  name: string;
  structuredSteps: ComboStep[];
  abilityLookup: Map<string, ResolvedAbilityRef>;
  difficulty?: ComboDifficulty;
  resourceCost?: ComboResourceCost;
  condition?: string;
  notes?: string;
  className?: string;
  hideHeader?: boolean;
  hideContext?: boolean;
  /** Light matches hero guide kit surfaces; dark for legacy/editor contrast. */
  variant?: ComboChainVariant;
};

function OrStepConnector({ theme }: { theme: ComboChainTheme }) {
  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center gap-0.5 px-1.5 sm:px-2.5"
      aria-hidden
    >
      <span className="h-2 w-px bg-gradient-to-b from-transparent to-violet-400/50" />
      <span
        className={`rounded-full border px-2.5 py-0.5 font-display text-[10px] font-bold uppercase italic tracking-[0.22em] sm:text-[11px] ${theme.orConnector}`}
      >
        Or
      </span>
      <span className="h-2 w-px bg-gradient-to-b from-violet-400/50 to-transparent" />
      <span className={`text-[9px] uppercase tracking-[0.16em] sm:text-[10px] ${theme.orSub}`}>
        alt route
      </span>
    </div>
  );
}

function ForkStemConnector({ theme }: { theme: ComboChainTheme }) {
  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center px-2 sm:px-3"
      aria-hidden
    >
      <span className={`font-display text-xl font-bold leading-none sm:text-2xl ${theme.forkStem}`}>
        ⤵
      </span>
      <span className={`mt-0.5 text-[9px] uppercase tracking-[0.16em] ${theme.forkStemSub}`}>
        branch
      </span>
    </div>
  );
}

function StepConnector({
  modifier,
  theme,
}: {
  modifier?: ComboModifier;
  theme: ComboChainTheme;
}) {
  if (modifier === "or") {
    return <OrStepConnector theme={theme} />;
  }

  const descriptor = getModifierDescriptor(modifier);
  return (
    <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 px-1 sm:px-2">
      <span
        className={`font-display text-lg font-bold leading-none sm:text-xl ${descriptor.arrowClass}`}
        aria-hidden
      >
        {descriptor.symbol}
      </span>
      {descriptor.microLabel ? (
        <span className={`text-[9px] uppercase tracking-[0.14em] sm:text-[10px] ${theme.connectorMicro}`}>
          {descriptor.microLabel}
        </span>
      ) : null}
    </div>
  );
}

function RepeatBadge({ count, theme }: { count: number; theme: ComboChainTheme }) {
  if (count <= 1) return null;
  return (
    <span
      className={`pointer-events-none absolute -right-2 -top-2 z-20 flex h-5 min-w-5 items-center justify-center rounded-full border px-1 text-[9px] font-bold tabular-nums ${theme.repeatBadge}`}
    >
      ×{count}
    </span>
  );
}

function StepTipBadge({ theme }: { theme: ComboChainTheme }) {
  return (
    <span
      className={`pointer-events-none absolute -left-2 -top-2 z-20 flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold ${theme.stepTipBadge}`}
      aria-hidden
    >
      i
    </span>
  );
}

function StepOnlyTip({ tip, children }: { tip: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  }, []);

  const open = useCallback(() => {
    updatePosition();
    setVisible(true);
  }, [updatePosition]);

  const close = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  const onMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(open, 180);
  }, [open]);

  const onClick = useCallback(
    (event: MouseEvent<HTMLSpanElement>) => {
      event.stopPropagation();
      setVisible((v) => {
        if (v) return false;
        updatePosition();
        return true;
      });
    },
    [updatePosition],
  );

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={onMouseEnter}
        onMouseLeave={close}
        onFocus={onMouseEnter}
        onBlur={close}
        onClick={onClick}
        className="relative inline-flex"
      >
        {children}
      </span>
      {visible && typeof document !== "undefined"
        ? createPortal(
            <div
              role="tooltip"
              className="pointer-events-none fixed z-[9999] w-64 -translate-x-1/2 -translate-y-full rounded-lg border border-cyan-400/30 bg-[#161b28]/98 px-3 py-2 text-[11px] leading-4 text-cyan-100 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
              style={{ left: position.x, top: position.y }}
            >
              <span className="font-bold uppercase tracking-wide">Step tip · </span>
              {tip}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

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
    <div className="flex shrink-0 flex-col items-center gap-1.5 px-0.5 pt-1" style={{ minWidth: "4.75rem" }}>
      <AbilityTooltip ability={resolved} stepTip={stepTip}>
        <div className="relative">
          <RepeatBadge count={repeatCount} theme={theme} />
          {stepTip ? <StepTipBadge theme={theme} /> : null}
          <div
            className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border transition-all duration-200 hover:-translate-y-0.5 ${theme.abilityIcon}`}
          >
            {resolved.iconUrl ? (
              <Image
                src={resolved.iconUrl}
                alt=""
                width={40}
                height={40}
                className="h-9 w-9 object-contain"
              />
            ) : (
              <span className={`text-[10px] font-bold uppercase ${theme.abilityIconFallback}`}>
                {resolved.name.slice(0, 3)}
              </span>
            )}
          </div>
        </div>
      </AbilityTooltip>

      <span
        className={`line-clamp-2 max-w-[5.25rem] text-center font-display text-[9px] uppercase leading-tight tracking-wide sm:text-[10px] ${theme.abilityName}`}
      >
        {resolved.name}
      </span>

      <span
        className={`inline-flex h-5 items-center justify-center rounded border px-1.5 text-[9px] font-bold uppercase tracking-wide sm:text-[10px] ${theme.keybind}`}
      >
        {keybindLabel}
        {repeatCount > 1 ? (
          <span className={`ml-1 ${theme.keybindRepeat}`}>×{repeatCount}</span>
        ) : null}
      </span>

      {resourceDelta !== undefined && resourceDelta !== 0 ? (
        <span
          className={`text-[10px] font-bold tabular-nums ${
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
    <div className="flex shrink-0 flex-col items-center gap-1.5 px-0.5 pt-1" style={{ minWidth: "4.75rem" }}>
      <div className="relative">
        <RepeatBadge count={repeatCount} theme={theme} />
        {stepTip ? <StepTipBadge theme={theme} /> : null}
        <div
          className={`relative flex h-14 w-14 items-center justify-center rounded-lg border transition-all duration-200 ${theme.actionIcon}`}
        >
          <span className={`px-1 text-center text-[9px] font-semibold uppercase leading-tight ${theme.actionLabel}`}>
            {label}
          </span>
        </div>
      </div>

      <span className={`max-w-[5.25rem] truncate text-center text-[10px] leading-tight sm:text-[11px] ${theme.actionLabel}`}>
        {label}
        {repeatCount > 1 ? (
          <span className={theme.keybindRepeat}> ×{repeatCount}</span>
        ) : null}
      </span>

      <span className="h-5" />

      {resourceDelta !== undefined && resourceDelta !== 0 ? (
        <span
          className={`text-[10px] font-bold tabular-nums ${
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

function renderStepNode(
  { step, resolved, resourceDelta }: ResolvedStep,
  index: number,
  theme: ComboChainTheme,
) {
  const stepTip = "tip" in step && typeof step.tip === "string" ? step.tip : undefined;

  if (step.kind === "ability" && resolved) {
    return (
      <AbilityNode
        key={`step-${index}`}
        resolved={resolved}
        resourceDelta={resourceDelta}
        repeat={step.repeat}
        stepTip={stepTip}
        theme={theme}
      />
    );
  }

  if (step.kind === "ability") {
    return (
      <ActionNode
        key={`step-${index}`}
        label={step.abilityRef}
        resourceDelta={resourceDelta}
        repeat={step.repeat}
        stepTip={stepTip}
        theme={theme}
      />
    );
  }

  return (
    <ActionNode
      key={`step-${index}`}
      label={step.label}
      resourceDelta={resourceDelta}
      repeat={step.repeat}
      stepTip={stepTip}
      theme={theme}
    />
  );
}

function ForkBranchGroup({
  branchIndices,
  resolvedSteps,
  theme,
}: {
  branchIndices: number[];
  resolvedSteps: ResolvedStep[];
  theme: ComboChainTheme;
}) {
  return (
    <div
      className={`combo-fork-group relative shrink-0 rounded-xl border px-3 py-3 sm:px-4 sm:py-4 ${theme.forkGroup}`}
      style={{ scrollSnapAlign: "center" }}
    >
      <p className={`mb-2 text-center font-display text-[10px] font-bold uppercase tracking-[0.24em] sm:mb-3 ${theme.forkLabel}`}>
        Either route
      </p>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-center sm:gap-0">
        {branchIndices.map((stepIndex, branchIndex) => (
          <div
            key={stepIndex}
            className="flex items-start justify-center sm:justify-start"
          >
            {branchIndex > 0 ? <OrStepConnector theme={theme} /> : null}
            {renderStepNode(resolvedSteps[stepIndex], stepIndex, theme)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ComboChain({
  name,
  structuredSteps,
  abilityLookup,
  difficulty,
  resourceCost,
  condition,
  notes,
  className = "",
  hideHeader = false,
  hideContext = false,
  variant = "light",
}: ComboChainProps) {
  const theme = getComboChainTheme(variant);
  const resolvedSteps = useMemo(
    () =>
      structuredSteps.map((step, index) => ({
        step,
        resolved:
          step.kind === "ability"
            ? resolveAbilityRef(step.abilityRef, abilityLookup)
            : null,
        resourceDelta: resourceCost?.perStepDelta?.[index],
      })),
    [structuredSteps, abilityLookup, resourceCost],
  );

  const diffTier = getDifficultyTier(difficulty);
  const revealRef = useScrollReveal<HTMLDivElement>();
  const segments = useMemo(
    () => buildComboChainSegments(structuredSteps),
    [structuredSteps],
  );

  return (
    <div
      ref={revealRef}
      data-combo-chain-variant={variant}
      className={`scroll-reveal overflow-hidden rounded-lg transition-all duration-300 ${theme.shell} ${className}`}
    >
      {/* Header band */}
      {!hideHeader ? (
        <div className={`flex flex-wrap items-center gap-2 px-4 py-2.5 sm:px-5 ${theme.header}`}>
          <h4 className={`font-display text-sm font-extrabold uppercase italic tracking-wide sm:text-base ${theme.headerTitle}`}>
            {name}
          </h4>

          {diffTier ? (
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                variant === "light" ? diffTier.lightClass : diffTier.darkClass
              }`}
            >
              {diffTier.label}
            </span>
          ) : null}

          {resourceCost ? (
            <span className={`ml-auto rounded border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${theme.resourcePill}`}>
              Requires {resourceCost.startingAmount} {resourceCost.resourceName}
            </span>
          ) : null}
        </div>
      ) : resourceCost ? (
        <div className={`border-b px-4 py-2 sm:px-5 ${theme.header}`}>
          <span className={`rounded border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${theme.resourcePill}`}>
            Requires {resourceCost.startingAmount} {resourceCost.resourceName}
          </span>
        </div>
      ) : null}

      {!hideContext && (condition || notes) ? (
        <div className={`space-y-1 border-b px-4 py-2 sm:px-5 ${variant === "light" ? "border-rivals-light-300/80 bg-white/50" : "border-white/6"}`}>
          {condition ? (
            <p className={`text-xs leading-5 ${theme.contextText}`}>{condition}</p>
          ) : null}
          {notes ? (
            <p className={`text-xs leading-5 ${theme.contextText}`}>{notes}</p>
          ) : null}
        </div>
      ) : null}

      {/* Chain body with horizontal scroll on mobile */}
      <div className="relative">
        <div className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r sm:hidden ${theme.scrollFadeFrom} to-transparent`} />
        <div className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l sm:hidden ${theme.scrollFadeFrom} to-transparent`} />

        <div
          className="stagger-children flex items-start gap-0 overflow-x-auto px-3 py-5 sm:flex-wrap sm:items-center sm:justify-center sm:gap-y-4 sm:overflow-x-visible sm:px-4 sm:py-6"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {segments.map((segment, segmentIndex) => {
            if (segment.type === "linear") {
              return (
                <div
                  key={`linear-${segment.indices.join("-")}`}
                  className="flex shrink-0 items-start"
                >
                  {segment.indices.map((stepIndex, positionInSegment) => (
                    <div
                      key={stepIndex}
                      className="flex shrink-0 items-start"
                      style={{ scrollSnapAlign: "center" }}
                    >
                      {positionInSegment > 0 ? (
                        <StepConnector
                          modifier={structuredSteps[stepIndex].modifier}
                          theme={theme}
                        />
                      ) : null}
                      {renderStepNode(resolvedSteps[stepIndex], stepIndex, theme)}
                    </div>
                  ))}
                </div>
              );
            }

            const nextSegment = segments[segmentIndex + 1];
            const showStem =
              segmentIndex === 0 ||
              segments[segmentIndex - 1]?.type === "linear";

            return (
              <div
                key={`fork-${segment.branchIndices.join("-")}`}
                className="flex shrink-0 items-start"
              >
                {showStem ? <ForkStemConnector theme={theme} /> : null}
                <ForkBranchGroup
                  branchIndices={segment.branchIndices}
                  resolvedSteps={resolvedSteps}
                  theme={theme}
                />
                {nextSegment?.type === "linear" ? (
                  <StepConnector modifier={undefined} theme={theme} />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
