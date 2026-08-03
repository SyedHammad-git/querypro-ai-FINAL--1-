"use client";

import { useState } from "react";
import { Bot, PlayCircle, Sparkles, ThumbsUp, User } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/types";
import { CodeBlock } from "@/components/sql/CodeBlock";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
  onSuggestionClick?: (label: string) => void;
  onRunQuery?: (sql: string) => void;
}

export function ChatMessageBubble({ message, onSuggestionClick, onRunQuery }: ChatMessageProps) {
  const [helpful, setHelpful] = useState(false);
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "flex max-w-[92%] gap-2.5",
        isAssistant ? "" : "ml-auto flex-row-reverse max-w-[88%]"
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
          isAssistant ? "border-accent-ai/20 bg-accent-ai/10" : "border-primary/20 bg-primary/10"
        )}
      >
        {isAssistant ? (
          <Bot className="h-3.5 w-3.5 text-accent-ai" aria-hidden="true" />
        ) : (
          <User className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        )}
      </div>

      <div
        className={cn(
          "min-w-0 flex-1 rounded-xl border px-3 py-2.5 shadow-sm",
          isAssistant
            ? "border-border-subtle/70 bg-surface-container/80 rounded-tl-sm"
            : "border-primary/20 bg-primary/10 rounded-tr-sm"
        )}
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className={cn("text-[10px] font-semibold uppercase tracking-[0.24em]", isAssistant ? "text-accent-ai" : "text-primary")}>
            {isAssistant ? "Assistant" : "You"}
          </span>
          {message.timestamp ? <span className="text-[10px] text-on-surface-variant/80">{message.timestamp}</span> : null}
        </div>
        <p className={cn("text-sm leading-6 whitespace-pre-wrap", isAssistant ? "text-on-surface" : "text-on-surface")}> 
          {message.text}
        </p>

        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSuggestionClick?.(s.label)}
                className="rounded-full border border-accent-ai/25 px-2.5 py-1 text-[11px] font-medium text-accent-ai transition-colors hover:bg-accent-ai/5"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {message.sql && (
          <>
            <CodeBlock sql={message.sql} className="mt-2 mb-2" />
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-on-surface-variant">
              <button
                type="button"
                onClick={() => setHelpful((v) => !v)}
                aria-pressed={helpful}
                className={cn(
                  "flex items-center gap-1 transition-colors hover:text-accent-ai",
                  helpful && "text-accent-ai"
                )}
              >
                <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                Helpful
              </button>
              <button
                type="button"
                onClick={() => onRunQuery?.(message.sql ?? "")}
                className="flex items-center gap-1 transition-colors hover:text-success"
              >
                <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Run Query
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ChatTypingIndicator() {
  return (
    <div className="flex max-w-[85%] gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-ai/10">
        <Sparkles className="h-3.5 w-3.5 animate-pulse text-accent-ai" aria-hidden="true" />
      </div>
      <div className="flex items-center gap-1 rounded-xl border border-border-subtle/70 bg-surface-container/80 px-3 py-2.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-outline animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
