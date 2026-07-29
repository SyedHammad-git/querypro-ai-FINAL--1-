"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { highlightSql } from "@/lib/sql-highlight";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  sql: string;
  className?: string;
  /** Hide the hover-to-reveal copy button, e.g. inside already-chrome'd panels. */
  showCopy?: boolean;
}

/**
 * Compact dark SQL snippet. Per DESIGN.md, code surfaces never use
 * shadows — they "sink" into the page via the dark #111827 fill instead.
 */
export function CodeBlock({ sql, className, showCopy = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — fail silently, the button simply won't confirm.
    }
  }

  return (
    <div className={cn("group relative bg-white dark:bg-black border border-gray-200 dark:border-transparent rounded-lg overflow-hidden", className)}>
      <pre className="p-4 overflow-x-auto scrollbar-thin-dark">
        <code className="font-mono text-body-md leading-relaxed">{highlightSql(sql)}</code>
      </pre>
      {showCopy && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="absolute top-2 right-2 p-1.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded text-gray-600 dark:text-white/80 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
        >
          {copied ? (
            <Check className="h-4 w-4 text-success" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}
