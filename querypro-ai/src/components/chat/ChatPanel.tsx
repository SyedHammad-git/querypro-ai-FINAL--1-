"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Sparkles, Trash2 } from "lucide-react";
import { CHAT_CONTEXT_TABLES } from "@/lib/mock-data";
import type { ChatMessage } from "@/lib/types";
import { ChatMessageBubble, ChatTypingIndicator } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  /** Renders a condensed header for embedding inside the multi-pane workspace. */
  compact?: boolean;
  onRunQuery?: (sql: string) => void;
  /** Overrides the root sizing classes (defaults to "flex-1"). */
  className?: string;
  /** Table names currently in scope, sent as grounding context to the AI route. Defaults to the app's mock schema. */
  contextTables?: string[];
  /** Optional preloaded messages to render instead of the persisted history fetch. */
  initialMessages?: ChatMessage[];
}

/** Splits a streamed response into a prose explanation and a trailing SQL statement, if one is present. */
function splitExplanationAndSql(text: string): { text: string; sql?: string } {
  const match = text.match(/((?:SELECT|INSERT|UPDATE|DELETE|WITH|CREATE)\b[\s\S]*)/i);
  const sqlPart = match?.[1];
  if (!match || match.index === undefined || !sqlPart) return { text };
  const explanation = text.slice(0, match.index).trim();
  return { text: explanation || "Here's the query:", sql: sqlPart.trim() };
}

export function ChatPanel({ compact = false, onRunQuery, className, contextTables = CHAT_CONTEXT_TABLES, initialMessages }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [waitingForFirstToken, setWaitingForFirstToken] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const historyAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, waitingForFirstToken]);

  // Cancel any in-flight generation request if the panel unmounts (e.g. the
  // user navigates away mid-stream) — otherwise the fetch keeps running in
  // the background and its reader loop keeps calling setState on a
  // component that's no longer mounted.
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
      setLoadingHistory(false);
      return;
    }

    const controller = new AbortController();
    historyAbortRef.current = controller;

    async function loadHistory() {
      setLoadingHistory(true);
      try {
        const res = await fetch("/api/chat/save", { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const payload = await res.json().catch(() => null);
        const loadedMessages = Array.isArray(payload?.messages) ? payload.messages : [];
        const mappedMessages = loadedMessages.map((message: { id: string; role: string; content: string; sql?: string | null; createdAt?: string }) => ({
          id: message.id,
          role: message.role === "assistant" ? "assistant" : "user",
          text: message.content,
          sql: message.sql ?? undefined,
          timestamp: message.createdAt
            ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "",
        }));

        setMessages(mappedMessages);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("[/components/chat/ChatPanel] failed to load chat history", error);
        setMessages([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingHistory(false);
        }
      }
    }

    void loadHistory();

    return () => {
      controller.abort();
      abortRef.current?.abort();
    };
  }, [initialMessages]);

  async function appendMessage(prompt: string) {
    const controller = new AbortController();
    abortRef.current = controller;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const assistantId = `msg-${Date.now() + 1}`;
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      text: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setBusy(true);
    setWaitingForFirstToken(true);

    function updateAssistant(patch: Partial<ChatMessage>) {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)));
    }

    const saveMessage = async (payload: { role: "user" | "assistant"; content: string; sql?: string }) => {
      try {
        await fetch("/api/chat/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error("[/components/chat/ChatPanel] failed to save chat message", error);
      }
    };

    try {
      // The client only ever sends the prompt + table names in scope — the
      // route handler owns the system prompt and the provider API key.
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, schemaContext: contextTables }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? `Request failed with status ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        if (accumulated.trim().length > 0) setWaitingForFirstToken(false);
        const parsed = splitExplanationAndSql(accumulated);
        updateAssistant(parsed);
      }

      const finalResponse = splitExplanationAndSql(accumulated);
      void saveMessage({ role: "user", content: prompt });
      void saveMessage({ role: "assistant", content: finalResponse.text, sql: finalResponse.sql });
    } catch (err) {
      if (controller.signal.aborted) return; // unmounted or superseded — no UI left to update
      setWaitingForFirstToken(false);
      updateAssistant({
        text: err instanceof Error ? `Sorry — ${err.message.toLowerCase()}. Please try again.` : "Sorry — something went wrong reaching the AI service.",
      });
    } finally {
      if (controller.signal.aborted) return;
      setBusy(false);
      setWaitingForFirstToken(false);
    }
  }

  function handleClear() {
    setMessages([]);
  }

  return (
    <div className={cn(className ?? "flex-1", "flex min-h-0 flex-col overflow-hidden rounded-xl border border-border-subtle/70 bg-surface-container-lowest shadow-[0_0_0_1px_rgba(255,255,255,0.02)]")}>
      <div className="flex shrink-0 items-center justify-between border-b border-border-subtle/70 bg-surface-container-lowest px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-ai/10">
            <Sparkles className="h-4 w-4 text-accent-ai" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-on-surface">
              {compact ? "AI Assistant" : "QueryPro AI Bot"}
            </div>
            {!compact && (
              <div className="truncate text-[11px] text-on-surface-variant">Online · /api/generate</div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <IconButton aria-label="Clear conversation" className="h-7 w-7" onClick={handleClear}>
            <Trash2 className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
          </IconButton>
          <IconButton aria-label="More options" className="h-7 w-7">
            <MoreVertical className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 scrollbar-thin">
        {loadingHistory && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <ChatTypingIndicator />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-on-surface-variant">
            <Sparkles className="h-5 w-5 text-accent-ai" aria-hidden="true" />
            <p className="text-sm leading-6">No saved chat history yet. Ask a question to start a new one.</p>
          </div>
        ) : (
          messages
            .filter((m) => !(m.role === "assistant" && m.text === "" && !m.sql))
            .map((message) => (
              <ChatMessageBubble
                key={message.id}
                message={message}
                onSuggestionClick={(label) => appendMessage(label)}
                onRunQuery={onRunQuery}
              />
            ))
        )}
        {waitingForFirstToken && <ChatTypingIndicator />}
      </div>

      <ChatInput contextTables={contextTables} onSend={appendMessage} disabled={busy} />
    </div>
  );
}
