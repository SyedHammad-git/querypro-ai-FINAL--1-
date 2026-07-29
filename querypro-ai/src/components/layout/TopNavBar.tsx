"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ConnectionBadge } from "@/components/ui/Chip";
import { useToast } from "@/components/ui/Toast";
import { useAuthStore } from "@/lib/useAuthStore";
import { cn } from "@/lib/utils";

const FALLBACK_AVATAR = "https://i.pravatar.cc/72?img=13";

const INITIAL_NOTIFICATIONS = [
  {
    id: "n1",
    title: "Long-running query flagged",
    detail: "\"UPDATE orders...\" exceeded the 1s threshold.",
    time: "2m ago",
  },
  {
    id: "n2",
    title: "Schema change detected",
    detail: "Column `team_id` added to `users`.",
    time: "1h ago",
  },
  {
    id: "n3",
    title: "Weekly digest ready",
    detail: "312 queries run across 2 databases this week.",
    time: "1d ago",
  },
];

interface TopNavBarProps {
  onOpenDrawer: () => void;
  onOpenCommandPalette: () => void;
}

export function TopNavBar({ onOpenDrawer, onOpenCommandPalette }: TopNavBarProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef<HTMLButtonElement>(null);

  function handleSignOut() {
    setProfileOpen(false);
    logout();
    router.push("/login");
  }

  // Close dropdowns on outside click
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (notifOpen && notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileOpen && profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [notifOpen, profileOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenCommandPalette();
      }
      if (event.key === "Escape") {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenCommandPalette]);

  const avatarSrc = user?.avatarUrl ?? FALLBACK_AVATAR;
  const displayName = user?.name || "QueryPro User";
  const displayEmail = user?.email || "user@querypro.ai";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-lg bg-surface-container-lowest/95 backdrop-blur-md border-b border-border-subtle">
      <div className="flex items-center gap-md min-w-0">
        <IconButton aria-label="Open navigation menu" onClick={onOpenDrawer}>
          <Menu className="h-5 w-5" aria-hidden="true" />
        </IconButton>

        <span className="font-heading text-headline-sm font-bold text-primary shrink-0 hidden sm:inline">
          QueryPro AI
        </span>

        <button
          type="button"
          onClick={() => showToast("Workspace switching isn't available in this demo yet")}
          className="hidden lg:flex items-center gap-xs px-sm py-1.5 rounded-lg hover:bg-surface-container-low transition-colors text-label-md text-on-surface-variant shrink-0"
        >
          <span className="font-semibold text-on-surface">Main Workspace</span>
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          ref={searchRef}
          type="button"
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-sm bg-surface-container-low border border-outline-variant rounded-lg px-md py-1.5 w-64 lg:w-80 hover:border-outline transition-colors text-left"
        >
          <Search className="h-[13.5px] w-[13.5px] text-on-surface-variant shrink-0" aria-hidden="true" />
          <span className="flex-1 text-body-md text-on-surface-variant truncate">
            Search tables, queries, or AI…
          </span>
          <kbd className="shrink-0 font-mono text-[7.5px] text-on-surface-variant border border-outline-variant rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-sm md:gap-md shrink-0">
        <div className="hidden xl:block">
          <ConnectionBadge />
        </div>

        <IconButton aria-label="Search" className="md:hidden" onClick={onOpenCommandPalette}>
          <Search className="h-5 w-5" aria-hidden="true" />
        </IconButton>

        <ThemeToggle />

        <div className="relative" ref={notifRef}>
          <IconButton
            aria-label={`Notifications (${notifications.length} unread)`}
            active={notifOpen}
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
          >
            <span className="relative">
              <Bell className="h-5 w-5" aria-hidden="true" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-error text-[6.75px] font-bold text-on-error border-2 border-surface-container-lowest">
                  {notifications.length}
                </span>
              )}
            </span>
          </IconButton>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-elevation-3 overflow-hidden animate-scale-in">
              <div className="px-md py-sm border-b border-border-subtle flex items-center justify-between">
                <span className="font-label-md font-semibold text-on-surface">Notifications</span>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setNotifications([])}
                    className="text-label-sm text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="px-md py-lg text-center text-body-md text-on-surface-variant">
                  You&apos;re all caught up.
                </p>
              ) : (
                <ul className="max-h-80 overflow-y-auto scrollbar-thin">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className="px-md py-sm border-b border-border-subtle last:border-0 hover:bg-surface-container-low transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-md">
                        <span className="font-label-md font-semibold text-on-surface">{n.title}</span>
                        <span className="font-mono text-label-sm text-on-surface-variant shrink-0">{n.time}</span>
                      </div>
                      <p className="text-body-md text-on-surface-variant mt-0.5">{n.detail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            aria-label="Open account menu"
            aria-expanded={profileOpen}
            className={cn(
              "h-9 w-9 rounded-full overflow-hidden border-2 transition-colors",
              profileOpen ? "border-primary" : "border-transparent hover:border-outline-variant"
            )}
          >
            <Image
              src={avatarSrc}
              alt="Your profile photo"
              width={36}
              height={36}
              className="h-full w-full object-cover"
              unoptimized={avatarSrc.startsWith("blob:")}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-elevation-3 overflow-hidden animate-scale-in">
              <div className="px-md py-sm border-b border-border-subtle">
                <div className="font-label-md font-semibold text-on-surface">{displayName}</div>
                <div className="text-label-sm text-on-surface-variant truncate">{displayEmail}</div>
              </div>
              <ul className="py-1">
                {["Account settings", "Team members", "API keys"].map((label) => (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        if (label === "Team members") {
                          showToast("Team members isn't available in this demo yet");
                        } else {
                          router.push("/settings");
                        }
                      }}
                      className="w-full text-left px-md py-2 text-body-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-border-subtle py-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full text-left px-md py-2 text-body-md text-error hover:bg-error/5 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
