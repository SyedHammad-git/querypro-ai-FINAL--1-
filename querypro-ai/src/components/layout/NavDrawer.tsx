"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock3, Database, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CONNECTED_DATABASES,
  NAV_ITEMS,
  RECENT_PROJECTS,
  SECONDARY_NAV_ITEMS,
} from "@/lib/mock-data";
import { NavIcon } from "@/components/ui/icon-map";
import { IconButton } from "@/components/ui/IconButton";

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
}

const STATUS_DOT: Record<string, string> = {
  stable: "bg-success",
  vacuuming: "bg-tertiary",
  syncing: "bg-primary",
};

/**
 * On-demand navigation drawer. Replaces the permanent sidebar per the
 * redesign brief: hidden by default, opened from the header hamburger,
 * closes automatically on route selection, backdrop click, or Escape.
 *
 * Deliberately a fixed dark surface (theme-invariant `inverse-surface`)
 * regardless of light/dark mode — consistent with the rule that
 * utility/navigation chrome stays dark while the main canvas adapts.
 */
export function NavDrawer({ open, onClose }: NavDrawerProps) {
  const pathname = usePathname();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Navigation">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="relative h-full w-[85vw] max-w-drawer-width bg-surface-container-lowest dark:bg-black border-r border-border-subtle dark:border-drawer-border shadow-drawer flex flex-col animate-drawer-in">
        <div className="h-16 shrink-0 flex items-center justify-between px-lg border-b border-border-subtle dark:border-white/5">
          <span className="font-heading text-headline-sm font-bold text-brand-dark dark:text-white">QueryPro AI</span>
          <IconButton aria-label="Close navigation" onClick={onClose}>
            <X className="h-5 w-5" aria-hidden="true" />
          </IconButton>
        </div>

        <div className="px-lg pt-lg shrink-0">
          <Link
            href="/workspace"
            onClick={onClose}
            className="w-full py-md px-lg bg-primary text-on-primary rounded-lg flex items-center justify-center gap-sm font-label-md font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-200"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            New Query
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin-dark px-md pt-lg pb-lg flex flex-col gap-lg">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-md py-sm px-lg rounded-lg font-label-md transition-all duration-200",
                    isActive
                      ? "text-primary bg-primary/10 dark:text-primary-fixed-dim dark:bg-white/10"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-brand-dark dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                  )}
                >
                  <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {RECENT_PROJECTS.length > 0 && (
            <div>
              <h3 className="px-lg mb-1 font-mono text-label-sm text-outline dark:text-white/40 uppercase tracking-wider">
                Recent Projects
              </h3>
              <div className="flex flex-col gap-1">
                {RECENT_PROJECTS.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={onClose}
                    className="flex items-center gap-md py-sm px-lg rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-brand-dark dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white transition-all duration-200 text-left"
                  >
                    <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1 truncate font-label-md">{project.name}</span>
                    <span className="text-label-sm text-outline dark:text-white/30 shrink-0">{project.updatedLabel}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {CONNECTED_DATABASES.length > 0 && (
            <div>
              <h3 className="px-lg mb-1 font-mono text-label-sm text-outline dark:text-white/40 uppercase tracking-wider">
                Pinned Databases
              </h3>
              <div className="flex flex-col gap-1">
                {CONNECTED_DATABASES.map((db) => (
                  <button
                    key={db.id}
                    type="button"
                    onClick={onClose}
                    className="flex items-center gap-md py-sm px-lg rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-brand-dark dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white transition-all duration-200 text-left"
                  >
                    <Database className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1 truncate font-label-md">{db.name}</span>
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", STATUS_DOT[db.status])} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="border-t border-border-subtle dark:border-white/5 p-md flex flex-col gap-1 shrink-0">
          {SECONDARY_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-md py-sm px-lg rounded-lg font-label-md transition-all duration-200",
                  isActive ? "text-primary bg-primary/10 dark:text-primary-fixed-dim dark:bg-white/10" : "text-on-surface-variant hover:bg-surface-container hover:text-brand-dark dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                )}
              >
                <NavIcon name={item.icon} className="h-[13.5px] w-[13.5px] shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
