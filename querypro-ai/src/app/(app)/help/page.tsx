import type { Metadata } from "next";
import { BookOpen, LifeBuoy, MessageCircleQuestion } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingReveal } from "@/components/ui/LoadingReveal";
import { PageSkeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Help" };

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "⌘ / Ctrl + K", label: "Open command palette" },
  { keys: "⌘ / Ctrl + Enter", label: "Run the current query" },
  { keys: "Esc", label: "Close drawer, palette, or modal" },
  { keys: "⌘ / Ctrl + S", label: "Save the current query" },
  { keys: "G then D", label: "Go to Dashboard" },
];

const FAQS = [
  {
    q: "Which SQL dialects does the AI generator support?",
    a: "PostgreSQL is the default dialect. The AI SQL Generator's output panel includes a dialect-conversion action for MySQL, SQLite, and BigQuery.",
  },
  {
    q: "Can I edit AI-generated SQL before running it?",
    a: "Yes — every generated query opens directly in the SQL Workspace's editor, which is fully editable with live syntax highlighting.",
  },
  {
    q: "How do I connect a new database?",
    a: "Go to Settings → Connections → Add connection, and provide your connection string or credentials.",
  },
];

export default function HelpPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <LoadingReveal skeleton={<PageSkeleton />}>
      <PageHeader title="Help & resources" description="Shortcuts, answers, and ways to reach us." />

      <div className="px-lg md:px-2xl pb-2xl grid grid-cols-1 lg:grid-cols-3 gap-lg items-start">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Keyboard shortcuts</CardTitle>
          </CardHeader>
          <CardBody className="divide-y divide-border-subtle p-0">
            {SHORTCUTS.map((s) => (
              <div key={s.label} className="flex items-center justify-between px-md py-sm">
                <span className="text-body-md text-on-surface-variant">{s.label}</span>
                <kbd className="font-mono text-label-sm text-on-surface bg-surface-container-high border border-outline-variant rounded px-2 py-1">
                  {s.keys}
                </kbd>
              </div>
            ))}
          </CardBody>
        </Card>

        <div className="flex flex-col gap-lg">
          <a
            href="https://docs.querypro.ai"
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            <Card className="p-md hover:bg-surface-container-low transition-colors">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-label-md font-semibold text-on-surface">Documentation</div>
                  <div className="text-label-sm text-on-surface-variant">Guides, API reference</div>
                </div>
              </div>
            </Card>
          </a>
          <a
            href="https://support.querypro.ai"
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            <Card className="p-md hover:bg-surface-container-low transition-colors">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-full bg-accent-ai/10 flex items-center justify-center shrink-0">
                  <LifeBuoy className="h-5 w-5 text-accent-ai" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-label-md font-semibold text-on-surface">Contact support</div>
                  <div className="text-label-sm text-on-surface-variant">Usually replies within a day</div>
                </div>
              </div>
            </Card>
          </a>
        </div>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Frequently asked</CardTitle>
          </CardHeader>
          <CardBody className="divide-y divide-border-subtle p-0">
            {FAQS.map((faq) => (
              <div key={faq.q} className="px-md py-md">
                <div className="flex items-start gap-sm">
                  <MessageCircleQuestion className="h-[13.5px] w-[13.5px] text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="font-label-md font-semibold text-on-surface">{faq.q}</div>
                    <p className="text-body-md text-on-surface-variant mt-1">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
      </LoadingReveal>
    </div>
  );
}
