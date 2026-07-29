import type { Metadata } from "next";
import Link from "next/link";

import {
  ArrowUpRight,
  Blocks,
  Bot,
  Clock3,
  Code2,
  Database,
  Gauge,
  Sparkles,
  Star,
  UploadCloud,
  Workflow,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ConnectionBadge } from "@/components/ui/Chip";
import { LoadingReveal } from "@/components/ui/LoadingReveal";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { HistoryTable } from "@/components/history/HistoryTable";
import {
  CONNECTED_DATABASES,
  LEARNING_RESOURCES,
  QUERY_HISTORY,
  QUERY_TEMPLATES,
  SCHEMA_GROUPS,
} from "@/lib/mock-data";
import { DashboardWelcome } from "@/components/dashboard/DashboardWelcome";

export const metadata: Metadata = { title: "Dashboard" };

const STATS = [
  { label: "Queries run today", value: "312", delta: "+18% vs. yesterday", icon: Gauge },
  { label: "Avg. execution time", value: "82ms", delta: "-6ms this week", icon: Clock3 },
  { label: "Tables indexed", value: "24", delta: "across 3 schemas", icon: Database },
  { label: "AI-generated queries", value: "146", delta: "47% of total volume", icon: Sparkles },
];

const QUICK_ACTIONS = [
  {
    href: "/chat",
    label: "Generate SQL with AI",
    description: "Describe what you need in plain language.",
    icon: Bot,
    tint: "accent-ai",
  },
  {
    href: "/builder",
    label: "Open Manual Builder",
    description: "Click-and-drag query construction.",
    icon: Blocks,
    tint: "secondary",
  },
  {
    href: "/schema",
    label: "Explore Schema",
    description: "Browse tables, columns, and relationships.",
    icon: Workflow,
    tint: "primary",
  },
  {
    href: "/settings",
    label: "Import Database",
    description: "Connect a new PostgreSQL, MySQL, or SQLite source.",
    icon: UploadCloud,
    tint: "tertiary",
  },
  {
    href: "/editor",
    label: "Open SQL Editor",
    description: "Multi-tab script editor with a schema navigator and instant execution.",
    icon: Code2,
    tint: "success",
  },
] as const;

const TINT_CLASSES: Record<string, string> = {
  "accent-ai": "bg-accent-ai/10 text-accent-ai",
  secondary: "bg-secondary/10 text-secondary",
  primary: "bg-primary/10 text-primary",
  tertiary: "bg-tertiary/10 text-tertiary",
  success: "bg-success/10 text-success",
};

export default function DashboardPage() {
  const recentQueries = QUERY_HISTORY.slice(0, 3);
  const favoriteTemplates = QUERY_TEMPLATES.filter((t) => t.isFavorite).slice(0, 3);
  const pinnedTables = SCHEMA_GROUPS.flatMap((g) => g.tables).filter((t) => t.isPrimary || t.kind === "table").slice(0, 4);

  return (
    <div className="flex-1 overflow-y-auto">
      <LoadingReveal skeleton={<PageSkeleton />}>
      <div className="w-full max-w-7xl 2xl:max-w-[1200px] mx-auto">
      {/* Welcome hero */}
      <div className="px-md md:px-lg pt-xl pb-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-md">
          <div className="min-w-0">
            <DashboardWelcome />
            <p className="font-sans text-body-lg text-on-surface-variant mt-2">
              Here&apos;s what&apos;s happening across your connected databases.
            </p>
          </div>
          <ConnectionBadge />
        </div>
      </div>

      <div className="px-md md:px-lg pb-2xl flex flex-col gap-2xl">
        {/* Quick actions */}
        <div>
          <h2 className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider mb-md">
            Quick actions
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-lg">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.href} href={action.href}>
                <Card className="p-lg h-full hover:shadow-elevation-2 hover:-translate-y-0.5 transition-all duration-200 group">
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center mb-md ${TINT_CLASSES[action.tint]}`}
                  >
                    <action.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="flex items-center gap-1">
                    <h3 className="font-heading text-headline-sm text-on-surface">{action.label}</h3>
                    <ArrowUpRight
                      className="h-4 w-4 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-body-md text-on-surface-variant mt-1">{action.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div>
          <h2 className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider mb-md">
            Statistics
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-lg">
            {STATS.map((stat) => (
              <Card key={stat.label} className="p-md">
                <div className="flex items-center justify-between mb-sm">
                  <span className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <stat.icon className="h-[13.5px] w-[13.5px] text-primary" aria-hidden="true" />
                </div>
                <div className="font-heading text-headline-lg text-on-surface">{stat.value}</div>
                <div className="text-label-sm text-success mt-1">{stat.delta}</div>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start">
          {/* Recent activity */}
          <Card className="lg:col-span-2 overflow-hidden">
            <div className="px-md py-md border-b border-border-subtle flex items-center justify-between">
              <h3 className="font-heading text-headline-sm text-on-surface">Recent queries</h3>
              <Link
                href="/history"
                className="flex items-center gap-1 text-label-md text-primary hover:underline"
              >
                View all history
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <HistoryTable entries={recentQueries} />
          </Card>

          <div className="flex flex-col gap-lg">
            {/* Favorite templates */}
            <Card className="p-lg">
              <div className="flex items-center justify-between mb-md">
                <h3 className="font-heading text-headline-sm text-on-surface">Favorite templates</h3>
                <Link href="/templates" className="text-label-md text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className="flex flex-col gap-sm">
                {favoriteTemplates.map((template) => (
                  <div key={template.id} className="flex items-center gap-sm">
                    <Star className="h-4 w-4 text-tertiary fill-tertiary shrink-0" aria-hidden="true" />
                    <span className="text-body-md text-on-surface-variant truncate">{template.title}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Pinned tables */}
            <Card className="p-lg">
              <div className="flex items-center justify-between mb-md">
                <h3 className="font-heading text-headline-sm text-on-surface">Pinned tables</h3>
                <Link href="/schema" className="text-label-md text-primary hover:underline">
                  Explore
                </Link>
              </div>
              <div className="flex flex-col gap-sm">
                {pinnedTables.map((table) => (
                  <div key={table.id} className="flex items-center justify-between gap-sm">
                    <span className="font-mono text-label-md text-on-surface truncate">{table.name}</span>
                    <span className="text-label-sm text-on-surface-variant shrink-0">
                      {table.rowCount.toLocaleString()} rows
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg items-start">
          {/* Recent connections */}
          <Card className="p-lg">
            <h3 className="font-heading text-headline-sm text-on-surface mb-md">Recent connections</h3>
            <div className="flex flex-col gap-sm">
              {CONNECTED_DATABASES.map((db) => (
                <div key={db.id} className="flex items-center gap-md">
                  <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Database className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-label-md truncate">{db.name}</div>
                    <div className="text-label-sm text-on-surface-variant capitalize">{db.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Learning center */}
          <Card className="p-lg">
            <h3 className="font-heading text-headline-sm text-on-surface mb-md">Learning center</h3>
            <div className="flex flex-col gap-sm">
              {LEARNING_RESOURCES.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-sm">
                  <span className="text-body-md text-on-surface-variant truncate">{r.title}</span>
                  <span className="text-label-sm text-outline shrink-0">{r.duration}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      </div>
      </LoadingReveal>
    </div>
  );
}
