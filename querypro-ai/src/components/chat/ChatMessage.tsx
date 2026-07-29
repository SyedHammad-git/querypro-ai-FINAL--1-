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
        "flex gap-md max-w-[90%]",
        isAssistant ? "" : "ml-auto flex-row-reverse max-w-[85%]"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isAssistant ? "bg-accent-ai/10" : "bg-primary/10"
        )}
      >
        {isAssistant ? (
          <Bot className="h-4 w-4 text-accent-ai" aria-hidden="true" />
        ) : (
          <User className="h-4 w-4 text-primary" aria-hidden="true" />
        )}
      </div>

      <div
        className={cn(
          "min-w-0 flex-1 rounded-2xl",
          isAssistant
            ? "bg-surface-container-low border border-border-subtle rounded-tl-none p-md"
            : "bg-primary text-on-primary rounded-tr-none p-md"
        )}
      >
        <p
          className={cn(
            "font-sans text-body-md",
            isAssistant ? "text-brand-dark" : "text-on-primary"
          )}
        >
          {message.text}
        </p>

        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-md flex flex-wrap gap-2">
            {message.suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSuggestionClick?.(s.label)}
                className="px-3 py-1.5 rounded-full border border-accent-ai/30 text-accent-ai font-label-sm hover:bg-accent-ai/5 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {message.sql && (
          <>
            <CodeBlock sql={message.sql} className="mt-md mb-md" />
            <div className="flex items-center gap-md text-outline">
              <button
                type="button"
                onClick={() => setHelpful((v) => !v)}
                aria-pressed={helpful}
                className={cn(
                  "flex items-center gap-1 hover:text-accent-ai transition-colors text-xs",
                  helpful && "text-accent-ai"
                )}
              >
                <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                Helpful
              </button>
              <button
                type="button"
                onClick={() => onRunQuery?.(message.sql ?? "")}
                className="flex items-center gap-1 hover:text-success transition-colors text-xs"
              >
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
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
    <div className="flex gap-md max-w-[85%]">
      <div className="w-8 h-8 rounded-full bg-accent-ai/10 flex items-center justify-center shrink-0">
        <Sparkles className="h-4 w-4 text-accent-ai animate-pulse" aria-hidden="true" />
      </div>
      <div className="bg-surface-container-low border border-border-subtle rounded-2xl rounded-tl-none p-md flex items-center gap-1">
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
