"use client";

import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Paperclip, TableProperties, Zap } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  contextTables: string[];
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ contextTables, onSend, disabled }: ChatInputProps) {
  const { showToast } = useToast();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="p-lg bg-surface-container-lowest border-t border-border-subtle shrink-0">
      <div
        className={cn(
          "relative rounded-xl transition-all",
          focused && "ring-2 ring-primary/20"
        )}
      >
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-md pr-32 focus:border-primary outline-none transition-all resize-none font-sans text-body-md text-on-surface placeholder:text-on-surface-variant/60"
          placeholder="Describe the data you need…"
          rows={3}
          disabled={disabled}
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-md">
          <button
            type="button"
            aria-label="Attach a file"
            onClick={() => showToast("File attachments aren't available in this demo yet")}
            className="p-2 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <Paperclip className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || !value.trim()}
            className="bg-primary text-on-primary px-md py-2 rounded-lg font-label-md flex items-center gap-2 shadow-elevation-1 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <Zap className="h-4 w-4" aria-hidden="true" />
            Generate SQL
          </button>
        </div>
      </div>

      <div className="mt-md flex items-center gap-md flex-wrap">
        <span className="font-mono text-label-sm text-outline uppercase tracking-wider">
          Context:
        </span>
        <div className="flex gap-2 flex-wrap">
          {contextTables.map((table) => (
            <span
              key={table}
              className="flex items-center gap-1 px-2 py-1 bg-surface-container rounded-md border border-outline-variant/30 text-[7.5px] font-bold text-on-surface-variant"
            >
              <TableProperties className="h-3 w-3" aria-hidden="true" />
              {table}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
