"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Plus, Search } from "lucide-react";
import { NAV_ITEMS, SECONDARY_NAV_ITEMS } from "@/lib/mock-data";
import { NavIcon } from "@/components/ui/icon-map";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface PaletteItem {
  id: string;
  label: string;
  group: "Quick action" | "Navigate";
  icon: string;
  href: string;
}

const QUICK_ACTIONS: PaletteItem[] = [
  { id: "new-query", label: "New Query", group: "Quick action", icon: "square-terminal", href: "/workspace" },
  { id: "ask-ai", label: "Ask the AI Assistant", group: "Quick action", icon: "bot", href: "/chat" },
];

const NAV_PALETTE_ITEMS: PaletteItem[] = [...NAV_ITEMS, ...SECONDARY_NAV_ITEMS].map((item) => ({
  id: item.href,
  label: item.label,
  group: "Navigate",
  icon: item.icon,
  href: item.href,
}));

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const all = [...QUICK_ACTIONS, ...NAV_PALETTE_ITEMS];
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter((item) => item.label.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Focus after the mount/animation frame so autofocus reliably lands.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function navigateTo(href: string) {
    router.push(href);
    onClose();
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selected = results[activeIndex];
      if (selected) navigateTo(selected.href);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-md"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-lg bg-surface-container-lowest border border-outline-variant rounded-xl shadow-elevation-3 overflow-hidden animate-scale-in"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-sm px-md border-b border-border-subtle">
          <Search className="h-[13.5px] w-[13.5px] text-on-surface-variant shrink-0" aria-hidden="true" />
          <label htmlFor="command-palette-input" className="sr-only">
            Search commands and pages
          </label>
          <input
            id="command-palette-input"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, run a command…"
            className="flex-1 bg-transparent border-none py-md text-body-lg text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-0"
          />
          <kbd className="shrink-0 font-mono text-[7.5px] text-on-surface-variant border border-outline-variant rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <ul className="max-h-80 overflow-y-auto scrollbar-thin py-2" role="listbox">
          {results.length === 0 ? (
            <li className="px-md py-lg text-center text-body-md text-on-surface-variant">
              No matches for &ldquo;{query}&rdquo;
            </li>
          ) : (
            results.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <li key={item.id} role="option" aria-selected={isActive}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => navigateTo(item.href)}
                    className={cn(
                      "w-full flex items-center gap-md px-md py-sm text-left transition-colors",
                      isActive ? "bg-primary/10 text-primary" : "text-on-surface hover:bg-surface-container-low"
                    )}
                  >
                    {item.id === "new-query" ? (
                      <Plus className="h-[13.5px] w-[13.5px] shrink-0" aria-hidden="true" />
                    ) : (
                      <NavIcon name={item.icon} className="h-[13.5px] w-[13.5px] shrink-0" />
                    )}
                    <span className="flex-1 truncate font-label-md">{item.label}</span>
                    <span className="text-label-sm text-on-surface-variant shrink-0">{item.group}</span>
                    {isActive && (
                      <CornerDownLeft className="h-[10.5px] w-[10.5px] shrink-0 text-on-surface-variant" aria-hidden="true" />
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
