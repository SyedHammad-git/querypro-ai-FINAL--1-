"use client";

import { useEffect, useState } from "react";

/**
 * Gates a page's skeleton -> content transition.
 *
 * This used to add a fixed ~450ms artificial delay on every navigation, to
 * keep the skeleton UI exercised even though the mock data underneath is
 * instant. Multiplied across every page in the app, that was the dominant
 * source of the "everything feels slow to navigate" complaint — a page
 * that could render immediately was made to wait ~450ms + a ~200ms fade
 * every single time, on every click.
 *
 * It now resolves on the next tick instead of a fixed timer, so the
 * skeleton -> content transition still exists as real, working UI (for
 * when a real backend call replaces the mock data and genuinely needs a
 * loading state) without artificially blocking navigation today. Pass an
 * explicit `delayMs` only where you're intentionally simulating network
 * latency for a demo.
 */
export function useSimulatedLoad(delayMs = 0): boolean {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return loading;
}
