"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { resolveAbilityRef } from "@/features/heroes/ability-lookup";
import { getDifficultyTier, isCancelModifier } from "@/features/heroes/combo-display";
import { buildComboChainSegments } from "@/features/heroes/combo-chain-layout";
import { getComboChainTheme } from "@/features/heroes/components/combo-chain-theme";
import { resolveMotionDurationMs } from "@/components/ui/motion";
import { prefersHudAssembleMotion } from "@/features/heroes/transition";
import { ForkStemConnector, StepConnector } from "./combo-chain-connectors";
import { ForkBranchGroup, getCancelTargetPreview, renderStepNode } from "./combo-chain-nodes";
import type { ComboChainProps } from "./combo-chain-types";

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
  flush = false,
  variant = "light",
}: ComboChainProps) {
  const theme = getComboChainTheme(variant);
  const resolvedSteps = useMemo(
    () =>
      structuredSteps.map((step, index) => ({
        step,
        resolved: step.kind === "ability" ? resolveAbilityRef(step.abilityRef, abilityLookup) : null,
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
  const [playbackIndex, setPlaybackIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const stepCount = structuredSteps.length;

  const stopPlayback = useCallback(() => {
    setPlaying(false);
    setPlaybackIndex(null);
  }, []);

  const startPlayback = useCallback(() => {
    if (!prefersHudAssembleMotion() || stepCount < 1) return;
    setPlaying(true);
    setPlaybackIndex(0);
  }, [stepCount]);

  useEffect(() => {
    if (!playing || playbackIndex === null) return;
    const duration = resolveMotionDurationMs("medium");
    const handle = window.setTimeout(() => {
      if (playbackIndex >= stepCount - 1) {
        stopPlayback();
        return;
      }
      setPlaybackIndex(playbackIndex + 1);
    }, duration);
    return () => window.clearTimeout(handle);
  }, [playing, playbackIndex, stepCount, stopPlayback]);

  useEffect(() => {
    const node = revealRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) stopPlayback();
      },
      { threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [stopPlayback, revealRef]);

  return (
    <div
      ref={revealRef}
      data-combo-chain-variant={variant}
      className={`scroll-reveal overflow-hidden transition-[box-shadow,opacity] duration-[var(--motion-medium)] ease-[var(--ease-out-soft)] ${
        flush
          ? "rounded-none border-0 bg-transparent shadow-none"
          : `rounded-lg ${theme.shell}`
      } ${className}`.trim()}
    >
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

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {resourceCost ? (
              <span className={`rounded border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] tabular-nums ${theme.resourcePill}`}>
                Requires {resourceCost.startingAmount} {resourceCost.resourceName}
              </span>
            ) : null}

            {stepCount > 1 ? (
              <button
                type="button"
                onClick={playing ? stopPlayback : startPlayback}
                className="rivals-clip-tab border border-brand-gold/45 bg-brand-gold/15 px-2.5 py-1 font-display text-[10px] font-bold uppercase italic tracking-[0.14em] text-rivals-ink transition-[transform,background-color] duration-[var(--motion-fast)] ease-[var(--ease-out-soft)] active:scale-[0.97] motion-reduce:hidden"
              >
                {playing ? "Stop" : "Play"}
              </button>
            ) : null}
          </div>
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

      <div className="relative">
        <div className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r sm:hidden ${theme.scrollFadeFrom} to-transparent`} />
        <div className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l sm:hidden ${theme.scrollFadeFrom} to-transparent`} />

        <div
          className={`stagger-children flex items-center gap-0 overflow-x-auto sm:flex-wrap sm:justify-start sm:gap-y-3 sm:overflow-x-visible ${
            flush ? "px-3 py-3 sm:px-4 sm:py-3" : "px-3 py-4 sm:justify-center sm:px-4 sm:py-5"
          }`}
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
                  className="flex shrink-0 items-center"
                >
                  {segment.indices.map((stepIndex, positionInSegment) => (
                    <div
                      key={stepIndex}
                      className="flex shrink-0 items-center"
                      style={{ scrollSnapAlign: "center" }}
                    >
                      {positionInSegment > 0 ? (
                        <StepConnector
                          modifier={structuredSteps[stepIndex].modifier}
                          theme={theme}
                          cancelTarget={
                            isCancelModifier(structuredSteps[stepIndex].modifier)
                              ? getCancelTargetPreview(resolvedSteps[stepIndex])
                              : undefined
                          }
                        />
                      ) : null}
                      {renderStepNode(resolvedSteps[stepIndex], stepIndex, theme, playbackIndex)}
                    </div>
                  ))}
                </div>
              );
            }

            const nextSegment = segments[segmentIndex + 1];
            const showStem =
              segmentIndex === 0 || segments[segmentIndex - 1]?.type === "linear";

            return (
              <div
                key={`fork-${segment.branchIndices.join("-")}`}
                className="flex shrink-0 items-center"
              >
                {showStem ? <ForkStemConnector theme={theme} /> : null}
                <ForkBranchGroup
                  branchIndices={segment.branchIndices}
                  resolvedSteps={resolvedSteps}
                  theme={theme}
                  playbackIndex={playbackIndex}
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
