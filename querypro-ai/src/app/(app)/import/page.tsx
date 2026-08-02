"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import {
  ArrowRight,
  ChevronRight,
  Info,
  Loader2,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { useSqlStore } from "@/lib/useSqlStore";

type Step = "upload" | "map" | "review";
type Collision = "skip" | "upsert" | "fail";

interface ParsedField {
  source: string;
  sample: string;
}

const STEPS: { id: Step; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "map", label: "Map" },
  { id: "review", label: "Review" },
];

const COLLISION_OPTIONS: { id: Collision; label: string; description: string }[] = [
  { id: "skip", label: "Skip Duplicates", description: "Do not import existing records." },
  { id: "upsert", label: "Overwrite (Upsert)", description: "Update records with matching PKs." },
  { id: "fail", label: "Fail on Error", description: "Stop import if a duplicate is found." },
];

const MAX_FILE_BYTES = 512 * 1024 * 1024; // 512MB, matching the stated limit

function parseCsvPreview(text: string): ParsedField[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = (lines[0] ?? "").split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const firstRow = (lines[1] ?? "").split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
  return headers.map((h, i) => ({ source: h, sample: firstRow[i] ?? "" }));
}

function parseJsonPreview(text: string): ParsedField[] {
  try {
    const data = JSON.parse(text);
    const record = Array.isArray(data) ? data[0] : data;
    if (!record || typeof record !== "object") return [];
    return Object.entries(record).map(([key, value]) => ({ source: key, sample: String(value) }));
  } catch {
    return [];
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImportPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<ParsedField[]>([]);
  const [isSqlFile, setIsSqlFile] = useState(false);
  const [targetTableId, setTargetTableId] = useState("");
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [collision, setCollision] = useState<Collision>("skip");
  const [dryRun, setDryRun] = useState(true);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  const schemaGroups = useSqlStore((state) => state.schemaGroups);
  const allTables = useMemo(
    () =>
      schemaGroups.flatMap((group) =>
        group.tables
          .filter((t) => t.kind === "table")
          .map((table) => ({ id: table.id, qualifiedName: `${group.name}.${table.name}`, columns: table.columns }))
      ),
    [schemaGroups]
  );

  useEffect(() => {
    if (!allTables.length) {
      setTargetTableId("");
      return;
    }

    const exists = allTables.some((table) => table.id === targetTableId);
    if (!exists) {
      setTargetTableId(allTables[0]?.id ?? "");
    }
  }, [allTables, targetTableId]);

  const targetTable = allTables.find((t) => t.id === targetTableId) ?? allTables[0];

  const mappedCount = useMemo(
    () => fields.filter((f) => mappings[f.source] && mappings[f.source] !== "ignore").length,
    [fields, mappings]
  );

  function resetAll() {
    setStep("upload");
    setFile(null);
    setFields([]);
    setIsSqlFile(false);
    setMappings({});
    setImported(false);
  }

  function handleFile(selected: File) {
    if (selected.size > MAX_FILE_BYTES) {
      showToast(`${selected.name} is over the 512MB limit for batch processing`);
      return;
    }

    setFile(selected);
    setImported(false);
    const isSql = selected.name.toLowerCase().endsWith(".sql");
    setIsSqlFile(isSql);

    if (isSql) {
      setFields([]);
      setStep("map");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = selected.name.toLowerCase().endsWith(".json") ? parseJsonPreview(text) : parseCsvPreview(text);
      setFields(parsed);
      const defaults: Record<string, string> = {};
      parsed.forEach((f, i) => {
        const col = targetTable?.columns[i];
        if (col) defaults[f.source] = col.id;
      });
      setMappings(defaults);
      setStep("map");
    };
    reader.readAsText(selected);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  }

  function handleDownloadTemplate() {
    const header = "user_email,full_name,signup_ts,account_type\n";
    const sample = '"dev_rel_01@querypro.ai","Alex Rivera","2023-10-24 14:32:01","Enterprise_Admin"\n';
    const blob = new Blob([header, sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "querypro-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded querypro-import-template.csv");
  }

  function handleStartImport() {
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setImported(true);
      showToast(
        dryRun
          ? "Dry run complete — schema validated, nothing was written"
          : `Imported ${Math.max(mappedCount, 1) * 128} rows into ${targetTable?.qualifiedName}`
      );
    }, 1200);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-lg md:px-2xl pt-xl pb-2xl flex flex-col gap-xl max-w-[1050px] mx-auto">
        {/* Header + stepper */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg">
          <div>
            <h1 className="font-heading text-headline-xl text-on-surface mb-2">Batch Data Import</h1>
            <p className="text-on-surface-variant max-w-xl">
              Bulk import high volumes of records into your connected database, with schema validation and
              real-time column mapping.
            </p>
          </div>
          <div className="flex items-center gap-md w-full md:w-auto md:min-w-[285px]" role="list" aria-label="Import steps">
            {STEPS.map((s, i) => {
              const isActive = s.id === step;
              const isDone = STEPS.findIndex((x) => x.id === step) > i;
              return (
                <div key={s.id} className="flex items-center gap-md flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-label-sm transition-colors",
                        isActive
                          ? "border-primary text-primary bg-surface-container-low"
                          : isDone
                            ? "border-primary bg-primary text-on-primary"
                            : "border-outline-variant text-outline-variant bg-surface-container-low"
                      )}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={cn(
                        "text-[7.5px] font-bold uppercase tracking-widest",
                        isActive || isDone ? "text-on-surface" : "text-outline-variant"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border-subtle mb-4" aria-hidden="true" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-lg items-start">
          {/* Main column */}
          <div className="xl:col-span-9 flex flex-col gap-lg min-w-0">
            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              className={cn(
                "rounded-xl p-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-surface-container-lowest",
                dragActive ? "border-primary bg-primary/5" : "border-primary/30 hover:border-primary/60"
              )}
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-lg">
                <UploadCloud className="h-9 w-9 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-heading text-headline-md text-on-surface mb-2">
                {file ? file.name : "Drop your dataset here"}
              </h3>
              <p className="text-on-surface-variant mb-lg max-w-sm">
                {file
                  ? `${formatBytes(file.size)} · ${isSqlFile ? "SQL script" : "ready to map columns below"}`
                  : "Supports .csv, .json, and .sql formats. Max file size 512MB for batch processing."}
              </p>
              <div className="flex gap-md" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-lg py-2.5 bg-primary text-on-primary font-semibold rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-[0_0_13.5px_rgba(78,222,163,0.25)]"
                >
                  Browse Files
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-lg py-2.5 bg-surface-container text-on-surface-variant font-semibold rounded-lg border border-border-subtle hover:bg-surface-container-high transition-colors"
                >
                  Download Sample Template
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.sql"
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) handleFile(selected);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Preview & mapping */}
            {file && !isSqlFile && fields.length > 0 && (
              <div className="rounded-xl overflow-hidden bg-surface-container-lowest border border-border-subtle">
                <div className="p-md border-b border-border-subtle flex items-center justify-between flex-wrap gap-sm bg-surface-container-low/50">
                  <div className="flex items-center gap-sm">
                    <Sparkles className="h-[13.5px] w-[13.5px] text-primary" aria-hidden="true" />
                    <h3 className="font-label-md font-bold uppercase tracking-wider text-on-surface">
                      Data Preview &amp; Column Mapping
                    </h3>
                  </div>
                  <span className="text-label-sm text-on-surface-variant font-mono px-sm py-1 bg-surface-container-highest rounded">
                    detected_format: {file.name.split(".").pop()?.toUpperCase()} (UTF-8)
                  </span>
                </div>
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-high/40 border-b border-border-subtle">
                        <th className="p-md font-label-md text-label-sm text-outline w-48">Source Field</th>
                        <th className="p-md w-10" />
                        <th className="p-md font-label-md text-label-sm text-outline w-56">Database Target</th>
                        <th className="p-md font-label-md text-label-sm text-outline">Sample Data (Row 1)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/40 font-mono text-body-md">
                      {fields.map((f) => (
                        <tr key={f.source} className="hover:bg-primary/5 transition-colors">
                          <td className="p-md font-semibold text-on-surface">{f.source}</td>
                          <td className="p-md text-primary">
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </td>
                          <td className="p-md">
                            <select
                              value={mappings[f.source] ?? "ignore"}
                              onChange={(e) => setMappings((prev) => ({ ...prev, [f.source]: e.target.value }))}
                              className="bg-surface-container-lowest border border-outline-variant rounded-md text-label-sm py-1.5 px-2 w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                            >
                              {targetTable?.columns.map((col) => (
                                <option key={col.id} value={col.id}>
                                  {targetTable.qualifiedName.split(".")[0]?.charAt(0)}.{col.name}
                                </option>
                              ))}
                              <option value="ignore">Ignore Column</option>
                            </select>
                          </td>
                          <td className="p-md text-primary/90 truncate max-w-xs">&quot;{f.sample}&quot;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {file && isSqlFile && (
              <div className="rounded-xl p-lg bg-surface-container-lowest border border-border-subtle flex items-center gap-md">
                <Info className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                <p className="text-body-md text-on-surface-variant">
                  SQL scripts are executed directly against the target connection — no column mapping needed.
                  Review the statement before running it.
                </p>
              </div>
            )}

            {step === "review" && (
              <div className="rounded-xl p-lg bg-surface-container-lowest border border-border-subtle flex flex-col gap-md">
                <h3 className="font-heading text-headline-sm text-on-surface">Final Review</h3>
                {imported ? (
                  <div className="flex items-center gap-sm text-primary">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                    <span className="font-label-md font-semibold">
                      {dryRun ? "Dry run complete — schema validated." : "Import complete."}
                    </span>
                  </div>
                ) : (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-md text-body-md">
                    <div>
                      <dt className="text-label-sm text-outline uppercase tracking-wider">File</dt>
                      <dd className="text-on-surface font-mono">{file?.name ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-label-sm text-outline uppercase tracking-wider">Target table</dt>
                      <dd className="text-on-surface font-mono">{targetTable?.qualifiedName ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-label-sm text-outline uppercase tracking-wider">Columns mapped</dt>
                      <dd className="text-on-surface">{isSqlFile ? "N/A — raw SQL" : `${mappedCount} of ${fields.length}`}</dd>
                    </div>
                    <div>
                      <dt className="text-label-sm text-outline uppercase tracking-wider">Collision strategy</dt>
                      <dd className="text-on-surface">{COLLISION_OPTIONS.find((c) => c.id === collision)?.label}</dd>
                    </div>
                  </dl>
                )}
                <div className="flex gap-md pt-sm">
                  {!imported ? (
                    <button
                      type="button"
                      onClick={handleStartImport}
                      disabled={importing}
                      className="px-xl py-3 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-[0_0_13.5px_rgba(78,222,163,0.3)] flex items-center gap-sm disabled:opacity-60"
                    >
                      {importing && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                      {importing ? "Running…" : dryRun ? "Run Validation" : "Start Import"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resetAll}
                      className="px-xl py-3 bg-surface-container text-on-surface font-bold rounded-lg border border-border-subtle hover:bg-surface-container-high transition-colors"
                    >
                      Import Another File
                    </button>
                  )}
                </div>
              </div>
            )}

            {file && (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={resetAll}
                  className="px-lg py-2 text-error hover:bg-error/10 rounded-lg transition-colors font-semibold flex items-center gap-sm"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Clear All
                </button>
                {step === "map" && (
                  <button
                    type="button"
                    onClick={() => setStep("review")}
                    className="px-xl py-3 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-[0_0_13.5px_rgba(78,222,163,0.25)] flex items-center gap-sm"
                  >
                    Next Step: Final Review
                    <ChevronRight className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Configuration sidebar */}
          <div className="xl:col-span-3 flex flex-col gap-lg">
            <div className="rounded-xl p-lg bg-surface-container-lowest border border-border-subtle flex flex-col gap-lg">
              <h4 className="font-label-md font-bold text-on-surface flex items-center gap-sm">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                Import Configuration
              </h4>

              <label className="flex flex-col gap-xs">
                <span className="text-label-sm font-bold text-outline uppercase tracking-widest">Target Table</span>
                <select
                  value={targetTableId}
                  onChange={(e) => setTargetTableId(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-sm text-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                >
                  {allTables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.qualifiedName}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-sm">
                <span className="text-label-sm font-bold text-outline uppercase tracking-widest">Collision Strategy</span>
                {COLLISION_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={cn(
                      "flex items-center gap-sm p-sm rounded-lg border cursor-pointer transition-all",
                      collision === opt.id ? "border-primary/60 bg-primary/5" : "border-border-subtle hover:border-primary/40"
                    )}
                  >
                    <input
                      type="radio"
                      name="collision"
                      checked={collision === opt.id}
                      onChange={() => setCollision(opt.id)}
                      className="accent-primary h-4 w-4 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-label-md text-on-surface">{opt.label}</p>
                      <p className="text-[8.25px] text-outline">{opt.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-md border-t border-border-subtle flex flex-col gap-xs">
                <div className="flex items-center justify-between">
                  <span className="text-label-md text-on-surface-variant">Dry Run Mode</span>
                  <Switch checked={dryRun} onChange={setDryRun} label="Dry run mode" labelHidden />
                </div>
                <p className="text-[8.25px] text-outline">Validate schema without writing to the database.</p>
              </div>
            </div>

            <div className="p-lg bg-primary/5 rounded-xl border border-primary/20">
              <h5 className="text-primary font-bold text-label-md mb-xs flex items-center gap-sm">
                <Info className="h-4 w-4" aria-hidden="true" />
                Pro Tip
              </h5>
              <p className="text-label-sm text-on-surface-variant leading-relaxed">
                For datasets larger than 1M rows, use the CLI tool for faster multi-threaded uploads directly
                from your local machine.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
