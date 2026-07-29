import { AppShell } from "@/components/layout/AppShell";

/**
 * Segment layout for every authenticated route (dashboard, studio, editor,
 * builder, workspace, schema, chat, saved, history, templates, settings,
 * help). Next.js keeps a segment layout mounted across navigations within
 * the group — that's the whole point of moving AppShell here instead of
 * having each page render it: TopNavBar/NavDrawer/CommandPalette no longer
 * unmount and remount on every route change.
 *
 * `/login` and `/signup` intentionally live outside this group — they
 * render their own chrome-less, centered layout.
 */
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
