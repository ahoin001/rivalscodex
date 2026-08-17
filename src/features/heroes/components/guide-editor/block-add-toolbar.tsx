import type { HeroGuideBlock, HeroGuideTabId } from "@/features/heroes/hero-guide-schema";
import type { HeroPortraitEntry } from "@/features/heroes/components/hero-guide-body";
import { canUseBlockOnTab } from "@/features/heroes/hero-guide-blocks/registry";

function MiniAdd({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded bg-rivals-light-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rivals-ink hover:bg-rivals-yellow-200"
    >
      {label}
    </button>
  );
}

export function BlockAction({
  label,
  onClick,
  disabled = false,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide disabled:opacity-35 ${
        danger
          ? "text-rose-800 hover:bg-rose-50"
          : "text-rivals-ink-soft hover:bg-rivals-light-100"
      }`}
    >
      {label}
    </button>
  );
}

export function BlockAddToolbar({
  tabId,
  heroRoster,
  onAppend,
}: {
  tabId: HeroGuideTabId;
  heroRoster?: HeroPortraitEntry[];
  onAppend: (block: HeroGuideBlock) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {canUseBlockOnTab(tabId, "callout") ? (
        <>
          <MiniAdd
            label="+ Callout"
            onClick={() => onAppend({ type: "callout", body: "Short callout text." })}
          />
          <MiniAdd
            label="+ Bullets"
            onClick={() => onAppend({ type: "bullets", items: ["First item"] })}
          />
          <MiniAdd
            label="+ Two columns"
            onClick={() =>
              onAppend({
                type: "twoColumn",
                leftTitle: "Left column",
                leftItems: ["Point A"],
                rightTitle: "Right column",
                rightItems: ["Point B"],
              })
            }
          />
        </>
      ) : null}
      {canUseBlockOnTab(tabId, "strengthsWeaknesses") ? (
        <MiniAdd
          label="+ Pros & cons"
          onClick={() =>
            onAppend({
              type: "strengthsWeaknesses",
              strengths: [
                {
                  title: "Core strength headline",
                  detail: "Explain why this matters in real fights and when it spikes.",
                },
              ],
              weaknesses: [
                {
                  title: "Main limitation",
                  detail: "Explain how opponents punish this and what to watch for.",
                },
              ],
            })
          }
        />
      ) : null}
      {canUseBlockOnTab(tabId, "abilityTip") ? (
        <MiniAdd
          label="+ Ability tip"
          onClick={() =>
            onAppend({
              type: "abilityTip",
              abilityRef: "ability-ref",
              title: "Mechanic title",
              body: "Explain the interaction, cancel window, and when to use it.",
            })
          }
        />
      ) : null}
      {canUseBlockOnTab(tabId, "combo") ? (
        <MiniAdd
          label="+ Combo"
          onClick={() =>
            onAppend({
              type: "combo",
              name: "Combo name",
              steps: ["Step 1"],
            })
          }
        />
      ) : null}
      {canUseBlockOnTab(tabId, "matchup") ? (
        <MiniAdd
          label="+ Matchup"
          onClick={() => {
            const defaultOpponent = heroRoster?.[0]?.name ?? "Hero name";
            onAppend({
              type: "matchup",
              disposition: "target",
              opponent: defaultOpponent,
              summary: "One or two sentences on how you exploit or survive this matchup.",
            });
          }}
        />
      ) : null}
      {canUseBlockOnTab(tabId, "loadout") ? (
        <MiniAdd
          label="+ Loadout"
          onClick={() =>
            onAppend({
              type: "loadout",
              name: "Team-Up loadout",
              baseEffect: "Describe the Base effect that works without a partner.",
              enhancedEffect: "Describe the Enhanced effect when the partner is present.",
              soloQueueDefault: false,
            })
          }
        />
      ) : null}
      {canUseBlockOnTab(tabId, "video") ? (
        <MiniAdd
          label="+ Video"
          onClick={() =>
            onAppend({
              type: "video",
              title: "Clip title",
              watchUrl: "https://www.youtube.com/watch?v=",
            })
          }
        />
      ) : null}
    </div>
  );
}
