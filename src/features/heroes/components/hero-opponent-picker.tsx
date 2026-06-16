"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { HeroPortraitEntry } from "@/features/heroes/components/hero-guide-body";
import { filterHeroRoster, resolveHeroRosterEntry } from "@/features/heroes/hero-portrait-map";

type HeroOpponentPickerProps = {
  value: string;
  heroes: HeroPortraitEntry[];
  onChange: (next: string) => void;
  placeholder?: string;
};

export function HeroOpponentPicker({
  value,
  heroes,
  onChange,
  placeholder = "Search heroes…",
}: HeroOpponentPickerProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  useEffect(() => {
    queueMicrotask(() => setQuery(value));
  }, [value]);

  const suggestions = useMemo(
    () => filterHeroRoster(query, heroes, { limit: 16 }),
    [query, heroes],
  );

  const matched = useMemo(
    () => resolveHeroRosterEntry(value, heroes),
    [value, heroes],
  );

  const updateMenuRect = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    setMenuRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 280),
    });
  }, []);

  const openMenu = useCallback(() => {
    updateMenuRect();
    setOpen(true);
    setActiveIndex(0);
  }, [updateMenuRect]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    updateMenuRect();
    const onScrollOrResize = () => updateMenuRect();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updateMenuRect]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      const menu = document.getElementById(listId);
      if (menu?.contains(target)) return;
      close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close, listId]);

  const pick = useCallback(
    (hero: HeroPortraitEntry) => {
      onChange(hero.name);
      setQuery(hero.name);
      close();
    },
    [onChange, close],
  );

  const onInputChange = (next: string) => {
    setQuery(next);
    onChange(next);
    openMenu();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      openMenu();
      return;
    }
    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      pick(suggestions[activeIndex]!);
    } else if (event.key === "Escape") {
      close();
    }
  };

  const rosterEmpty = heroes.length === 0;
  const showMenu = open && !rosterEmpty && suggestions.length > 0;

  return (
    <>
      <div ref={rootRef} className="grid gap-1">
        <span className="text-[11px] text-rivals-ink-muted">Opponent hero</span>
        <div className="flex items-center gap-2">
          {matched ? (
            <div className="relative h-9 w-14 shrink-0 overflow-hidden rounded border border-rivals-ink/15 bg-[#121726]">
              <Image
                src={matched.stackLogoUrl}
                alt=""
                fill
                sizes="56px"
                className="object-contain p-0.5"
              />
            </div>
          ) : null}
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            value={query}
            onChange={(e) => onInputChange(e.target.value)}
            onFocus={openMenu}
            onClick={openMenu}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="min-w-0 flex-1 rounded border border-rivals-light-300 px-2 py-1.5 text-sm"
          />
        </div>
        {rosterEmpty ? (
          <p className="text-[10px] text-amber-800">
            No heroes loaded from the codex — check Supabase sync before adding matchups.
          </p>
        ) : null}
        {!rosterEmpty && open && suggestions.length === 0 && query.trim().length > 0 ? (
          <p className="text-[10px] text-rivals-ink-muted">No heroes match that search.</p>
        ) : null}
        {!matched && value.trim().length > 0 ? (
          <p className="text-[10px] text-rivals-ink-muted">
            Free text — pick a hero from the list to link their guide and stack logo.
          </p>
        ) : null}
      </div>

      {showMenu && menuRect && typeof document !== "undefined"
        ? createPortal(
            <ul
              id={listId}
              role="listbox"
              className="fixed z-[9999] max-h-64 overflow-y-auto rounded-lg border border-rivals-light-300 bg-white py-1 shadow-lg"
              style={{
                top: menuRect.top,
                left: menuRect.left,
                width: menuRect.width,
              }}
            >
              {suggestions.map((hero, index) => (
                <li key={hero.slug} role="option" aria-selected={index === activeIndex}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors ${
                      index === activeIndex ? "bg-brand-gold/15" : "hover:bg-rivals-light-100"
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(hero)}
                  >
                    <div className="relative h-8 w-12 shrink-0 overflow-hidden rounded border border-rivals-ink/10 bg-[#121726]">
                      <Image
                        src={hero.stackLogoUrl}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-contain p-0.5"
                      />
                    </div>
                    <span className="min-w-0 flex-1 truncate font-medium text-rivals-ink">
                      {hero.name}
                    </span>
                    {hero.role ? (
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-rivals-ink-muted">
                        {hero.role}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </>
  );
}
