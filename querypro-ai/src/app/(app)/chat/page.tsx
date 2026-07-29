"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import dynamic from "next/dynamic";
import { History as HistoryIcon, Lightbulb, Plus, Sparkles } from "lucide-react";
import { ConnectionBadge } from "@/components/ui/Chip";
import { IconButton } from "@/components/ui/IconButton";
import { useToast } from "@/components/ui/Toast";
import { PromptHero } from "@/components/generator/PromptHero";
import { GeneratorToolbar } from "@/components/generator/GeneratorToolbar";
import { InfoPanel } from "@/components/generator/InfoPanel";
import type { GeneratorHistoryEntry } from "@/components/generator/GeneratorHistoryDrawer";
import { SqlCodeEditor } from "@/components/sql/SqlCodeEditor";
import { ResultsConsole } from "@/components/sql/ResultsConsole";
import { WorkspaceSkeleton } from "@/components/ui/Skeleton";
import { FadeIn } from "@/components/ui/FadeIn";
import { useSimulatedLoad } from "@/lib/use-simulated-load";
import { generateSqlForPrompt } from "@/lib/mock-data";
import { useSqlStore } from "@/lib/useSqlStore";
import { cn } from "@/lib/utils";
import type { GeneratedQuery, SqlDialect } from "@/lib/mock-data";

const GeneratorHistoryDrawer = dynamic(
  () => import("@/components/generator/GeneratorHistoryDrawer").then((m) => m.GeneratorHistoryDrawer),
  { ssr: false }
);

interface SessionEntry extends GeneratorHistoryEntry {
  result: GeneratedQuery;
  sql: string;
}

export default function AiSqlGeneratorPage() {
  const { showToast } = useToast();
  const loading = useSimulatedLoad();

  const [entries, setEntries] = useState<SessionEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [dialect, setDialect] = useState<SqlDialect>("PostgreSQL");
  const [showExplanation, setShowExplanation] = useState(false);
  const [showOptimization, setShowOptimization] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [followUpPrompt, setFollowUpPrompt] = useState("");

  // Real PGlite engine — same singleton used by Editor and Builder.
  const { isExecuting, queryResult, initDb, executeSql } = useSqlStore();

  // Boot the DB on first visit so Run works instantly.
  useEffect(() => {
    initDb();
  }, [initDb]);

  const activeEntry = entries.find((e) => e.id === activeId) ?? null;

  function handleGenerate(prompt: string) {
    setGenerating(true);
    setShowExplanation(false);
    setShowOptimization(false);

    setTimeout(() => {
      const generated = generateSqlForPrompt(prompt);
      const id = `gen-${Date.now()}`;
      const newEntry: SessionEntry = {
        id,
        prompt,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        result: generated,
        sql: generated.sql,
      };
      setEntries((prev) => [newEntry, ...prev]);
      setActiveId(id);
      setGenerating(false);
      setFollowUpPrompt("");
    }, 1100);
  }

  function updateActiveSql(sql: string) {
    if (!activeId) return;
    setEntries((prev) => prev.map((e) => (e.id === activeId ? { ...e, sql } : e)));
  }

  function handleFollowUpKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (followUpPrompt.trim()) handleGenerate(followUpPrompt);
    }
  }

  async function handleCopy() {
    if (!activeEntry) return;
    try {
      await navigator.clipboard.writeText(activeEntry.sql);
      showToast("Copied SQL to clipboard");
    } catch {
      showToast("Couldn't access the clipboard", "error");
    }
  }

  function handleDownload() {
    if (!activeEntry) return;
    const blob = new Blob([activeEntry.sql], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "query.sql";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded query.sql");
  }

  function handleSave() {
    if (!activeId) return;
    setSavedIds((prev) =>
      prev.includes(activeId) ? prev.filter((id) => id !== activeId) : [...prev, activeId]
    );
    showToast(savedIds.includes(activeId) ? "Removed from saved queries" : "Saved to Saved Queries");
  }

  async function handleShare() {
    if (!activeEntry) return;
    try {
      await navigator.clipboard.writeText(`${activeEntry.prompt}\n\n${activeEntry.sql}`);
      showToast("Share text copied to clipboard");
    } catch {
      showToast("Couldn't access the clipboard", "error");
    }
  }

  async function handleRun() {
    if (!activeEntry) return;
    await executeSql(activeEntry.sql);
  }

  function handleNewQuery() {
    setActiveId(null);
    setShowExplanation(false);
    setShowOptimization(false);
    setFollowUpPrompt("");
  }

  return (
    // Always flex-col min-h-0 — the overflow bug was caused by a conditional
    // class that only added overflow-y-auto on the empty state, which broke
    // the flex layout when an entry was active.
    <div className="flex-1 flex flex-col min-h-0">
      {loading ? (
        <WorkspaceSkeleton />
      ) : (
        <FadeIn className="flex-1 flex flex-col min-h-0">
          <div className="h-14 shrink-0 flex items-center justify-between px-lg border-b border-border-subtle bg-surface-container-lowest">
            <div className="flex items-center gap-md min-w-0">
              <div className="w-8 h-8 rounded-full bg-accent-ai/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-accent-ai" aria-hidden="true" />
              </div>
              <h1 className="font-heading text-headline-sm text-on-surface truncate">AI SQL Generator</h1>
            </div>
            <div className="flex items-center gap-sm shrink-0">
              <ConnectionBadge />
              {entries.length > 0 && (
                <>
                  <IconButton aria-label="New query" onClick={handleNewQuery}>
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </IconButton>
                  <IconButton aria-label="View session history" onClick={() => setHistoryOpen(true)}>
                    <HistoryIcon className="h-5 w-5" aria-hidden="true" />
                  </IconButton>
                </>
              )}
            </div>
          </div>

          {!activeEntry ? (
            // Empty state — allow scrolling for the hero content
            <div className="flex-1 overflow-y-auto">
              <PromptHero onGenerate={handleGenerate} generating={generating} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <GeneratorToolbar
                dialect={dialect}
                onDialectChange={setDialect}
                onCopy={handleCopy}
                onDownload={handleDownload}
                onSave={handleSave}
                onShare={handleShare}
                onToggleExplain={() => setShowExplanation((v) => !v)}
                onToggleOptimize={() => setShowOptimization((v) => !v)}
                onRun={handleRun}
                saved={savedIds.includes(activeEntry.id)}
                explainActive={showExplanation}
                optimizeActive={showOptimization}
                running={isExecuting}
              />

              <div className="flex-1 flex flex-col min-h-0 p-lg gap-md overflow-y-auto scrollbar-thin">
                {showExplanation && (
                  <InfoPanel
                    icon={Sparkles}
                    title="Explanation"
                    content={activeEntry.result.explanation}
                    tone="ai"
                    onDismiss={() => setShowExplanation(false)}
                  />
                )}
                {showOptimization && (
                  <InfoPanel
                    icon={Lightbulb}
                    title="Optimization suggestion"
                    content={activeEntry.result.optimization}
                    tone="tertiary"
                    onDismiss={() => setShowOptimization(false)}
                  />
                )}

                <div className="flex-1 min-h-[210px] bg-white dark:bg-black border border-gray-200 dark:border-transparent rounded-lg overflow-hidden flex flex-col">
                  <div className="h-10 shrink-0 flex items-center justify-between px-md border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#171b26]">
                    <span className="font-mono text-label-sm text-gray-500 dark:text-white/50">query.sql</span>
                    <span className="font-mono text-label-sm text-gray-400 dark:text-white/30">{dialect}</span>
                  </div>
                  <SqlCodeEditor value={activeEntry.sql} onChange={updateActiveSql} aria-label="Generated SQL" />
                </div>

                {/* Real query result from PGlite */}
                {queryResult && <ResultsConsole result={queryResult} />}
              </div>

              <div className="shrink-0 p-md border-t border-border-subtle bg-surface-container-lowest">
                <div className="relative max-w-3xl mx-auto">
                  <textarea
                    value={followUpPrompt}
                    onChange={(e) => setFollowUpPrompt(e.target.value)}
                    onKeyDown={handleFollowUpKeyDown}
                    disabled={generating}
                    rows={1}
                    placeholder="Ask a follow-up, or describe a new query…"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-sm pl-md pr-24 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary outline-none transition-all resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => followUpPrompt.trim() && handleGenerate(followUpPrompt)}
                    disabled={generating || !followUpPrompt.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-md py-1.5 rounded-md bg-primary text-on-primary font-label-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
                  >
                    {generating ? "Generating…" : "Generate"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </FadeIn>
      )}

      <GeneratorHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entries={entries}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          setHistoryOpen(false);
          setShowExplanation(false);
          setShowOptimization(false);
        }}
      />
    </div>
  );
}
