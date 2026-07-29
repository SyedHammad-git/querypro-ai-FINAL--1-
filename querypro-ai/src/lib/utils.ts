import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * sessionStorage key used to hand a starting query off between pages
 * (Saved Queries / Templates -> Workspace). Shared as one constant so the
 * three pages that read or write it can't silently drift out of sync.
 */
export const DRAFT_SQL_STORAGE_KEY = "querypro-draft-sql";

/**
 * Merge Tailwind class names safely, resolving conflicting utility
 * classes (e.g. "p-2 p-4" -> "p-4") in the order they're passed.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a millisecond duration for compact display, e.g. 1240 -> "1.24s". */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/** Formats a row/record count with locale-aware thousand separators. */
export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Formats bytes into a compact, human-readable size string. */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / Math.pow(1024, exponent);
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
}

/** Renders a relative "time ago" label from an ISO timestamp. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const diffSeconds = Math.max(0, Math.round((now.getTime() - then) / 1000));

  const ranges: [number, string][] = [
    [60, "sec"],
    [60, "min"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];

  let unitValue = diffSeconds;
  let unitLabel = "sec";
  for (const [range, label] of ranges) {
    if (unitValue < range) {
      unitLabel = label;
      break;
    }
    unitValue = Math.floor(unitValue / range);
  }

  if (unitLabel === "sec" && unitValue < 10) return "just now";
  const rounded = Math.max(1, Math.round(unitValue));
  return `${rounded} ${unitLabel}${rounded === 1 ? "" : "s"} ago`;
}
