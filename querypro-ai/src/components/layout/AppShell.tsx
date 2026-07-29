"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { TopNavBar } from "./TopNavBar";

// These overlays are never needed for first paint (drawer/palette start
// closed; onboarding only shows once ever) — code-splitting them out of the
// main route bundle keeps the initial JS payload smaller.
const NavDrawer = dynamic(() => import("./NavDrawer").then((m) => m.NavDrawer), { ssr: false });
const CommandPalette = dynamic(() => import("./CommandPalette").then((m) => m.CommandPalette), {
  ssr: false,
});
const OnboardingModal = dynamic(
  () => import("@/components/ui/OnboardingModal").then((m) => m.OnboardingModal),
  { ssr: false }
);

interface AppShellProps {
  children: ReactNode;
}

/**
 * Shared chrome for every authenticated route: sticky TopNavBar, an
 * on-demand NavDrawer, and a global CommandPalette (Cmd+K).
 *
 * This is rendered exactly once, from `src/app/(app)/layout.tsx` — a real
 * Next.js segment layout, not a per-page wrapper. That distinction matters:
 * a segment layout persists across client-side navigation between routes
 * in the group, so TopNavBar/NavDrawer/CommandPalette stay mounted (their
 * own state — open menus, drawer visibility — survives a page change)
 * instead of unmounting and remounting on every single navigation the way
 * a per-page `<AppShell>` wrapper would.
 *
 * The `<main>` here is a fixed, non-scrolling frame — each page's own root
 * element decides whether it scrolls (`flex-1 overflow-y-auto` for normal
 * content pages) or manages fixed-height internal panes itself (workspace-
 * style split views). That used to be a `scrollableMain` prop on this
 * component; it moved down to individual pages because a segment layout
 * can't receive per-page props from the pages it wraps.
 */
export function AppShell({ children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenCommandPalette={() => setPaletteOpen(true)}
      />
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <OnboardingModal />

      <main className="pt-16 h-screen overflow-hidden flex flex-col bg-background">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="px-lg md:px-2xl py-lg flex flex-col md:flex-row md:items-center md:justify-between gap-md">
      <div className="min-w-0">
        <h1 className="font-heading text-headline-xl-mobile md:text-headline-xl text-on-surface">
          {title}
        </h1>
        {description && (
          <p className="font-sans text-body-md text-on-surface-variant mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-md shrink-0">{actions}</div>}
    </div>
  );
}
