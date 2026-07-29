"use client";

import { useState } from "react";
import type { KeyboardEvent } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { GENERATOR_SUGGESTIONS } from "@/lib/mock-data";

interface PromptHeroProps {
  onGenerate: (prompt: string) => void;
  generating?: boolean;
}

export function PromptHero({ onGenerate, generating = false }: PromptHeroProps) {
  const [value, setValue] = useState("");

  function submit(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed || generating) return;
    onGenerate(trimmed);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit(value);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-lg py-2xl">
      <div className="w-full max-w-2xl flex flex-col items-center text-center gap-lg">
        <div className="w-14 h-14 rounded-full bg-accent-ai/10 flex items-center justify-center">
          <Sparkles className="h-7 w-7 text-accent-ai" aria-hidden="true" />
        </div>

        <div>
          <h1 className="font-heading text-headline-xl-mobile md:text-display-lg text-on-surface">
            What data do you need today?
          </h1>
          <p className="font-sans text-body-lg text-on-surface-variant mt-2">
            Describe it in plain language — QueryPro writes the SQL.
          </p>
        </div>

        <div className="w-full relative">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            disabled={generating}
            placeholder="Describe the SQL query you want to generate…"
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-lg pr-16 text-body-lg text-on-surface placeholder:text-on-surface-variant/60 shadow-elevation-1 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all resize-none"
          />
          <button
            type="button"
            onClick={() => submit(value)}
            disabled={generating || !value.trim()}
            aria-label="Generate SQL"
            className="absolute bottom-4 right-4 h-10 w-10 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-sm">
          {GENERATOR_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => submit(suggestion)}
              disabled={generating}
              className="px-md py-2 rounded-full border border-outline-variant bg-surface-container-lowest text-label-md text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-40"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
