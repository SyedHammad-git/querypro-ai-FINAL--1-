"use client";

import { useEffect, useState } from "react";
import { Blocks, Bot, Sparkles, Workflow, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const ONBOARDING_KEY = "querypro-onboarding-seen";

const HIGHLIGHTS = [
  {
    icon: Bot,
    title: "Ask the AI for SQL",
    description: "Describe what you need in plain language on the AI SQL Generator.",
  },
  {
    icon: Blocks,
    title: "Build queries visually",
    description: "No AI required — drag tables together in the Manual SQL Builder.",
  },
  {
    icon: Workflow,
    title: "Explore your schema",
    description: "Browse tables, columns, and relationships without leaving the flow.",
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(ONBOARDING_KEY);
      if (!seen) setOpen(true);
    } catch {
      // Storage unavailable — skip onboarding rather than show it every load.
    }
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      // Storage unavailable — onboarding will simply reappear next visit.
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-lg" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-in" onClick={dismiss} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-surface-container-lowest border border-outline-variant rounded-xl shadow-elevation-3 overflow-hidden animate-scale-in">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Skip introduction"
          className="absolute top-md right-md p-1.5 rounded hover:bg-surface-container-low text-on-surface-variant z-10"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="p-xl text-center border-b border-border-subtle">
          <div className="w-14 h-14 rounded-full bg-accent-ai/10 flex items-center justify-center mx-auto mb-md">
            <Sparkles className="h-7 w-7 text-accent-ai" aria-hidden="true" />
          </div>
          <h2 id="onboarding-title" className="font-heading text-headline-lg text-on-surface">
            Welcome to QueryPro AI
          </h2>
          <p className="font-sans text-body-md text-on-surface-variant mt-2">
            Three ways to get from a question to a query, fast.
          </p>
        </div>

        <div className="p-lg flex flex-col gap-md">
          {HIGHLIGHTS.map((item) => (
            <div key={item.title} className="flex items-start gap-md">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="h-[13.5px] w-[13.5px] text-primary" aria-hidden="true" />
              </div>
              <div>
                <div className="font-label-md font-semibold text-on-surface">{item.title}</div>
                <p className="text-body-md text-on-surface-variant">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-lg border-t border-border-subtle">
          <Button variant="primary" size="lg" className="w-full" onClick={dismiss}>
            Get started
          </Button>
        </div>
      </div>
    </div>
  );
}
