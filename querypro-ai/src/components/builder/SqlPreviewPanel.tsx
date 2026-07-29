import { AlertTriangle, Code2 } from "lucide-react";
import { CodeBlock } from "@/components/sql/CodeBlock";
import { ResultsConsole } from "@/components/sql/ResultsConsole";
import type { QueryResult } from "@/lib/types";

interface SqlPreviewPanelProps {
  sql: string;
  errors: string[];
  result: QueryResult | null;
}

export function SqlPreviewPanel({ sql, errors, result }: SqlPreviewPanelProps) {
  return (
    <div className="shrink-0 w-[clamp(210px,30vw,330px)] max-w-full border-l border-border-subtle bg-surface-container-lowest flex flex-col min-h-0">
      <div className="h-12 shrink-0 flex items-center gap-xs px-md border-b border-border-subtle">
        <Code2 className="h-[13.5px] w-[13.5px] text-primary" aria-hidden="true" />
        <h2 className="font-heading text-headline-sm text-on-surface">Preview SQL</h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-md flex flex-col gap-md">
        {errors.length > 0 && (
          <div className="bg-tertiary/5 border border-tertiary/20 rounded-lg p-md">
            <div className="flex items-center gap-xs text-tertiary font-label-md font-semibold mb-1">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {errors.length === 1 ? "1 thing to fix" : `${errors.length} things to fix`}
            </div>
            <ul className="list-disc list-inside text-body-md text-on-surface-variant space-y-0.5">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <CodeBlock sql={sql} />

        {result && <ResultsConsole result={result} />}
      </div>
    </div>
  );
}
