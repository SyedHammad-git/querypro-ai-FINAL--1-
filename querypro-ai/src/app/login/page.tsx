"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Database, Github, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/auth/PasswordField";
import { GoogleMark } from "@/components/auth/GoogleMark";
import { useToast } from "@/components/ui/Toast";
import { useAuthStore } from "@/lib/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    // Simulated auth round-trip — production wiring calls the auth service.
    setTimeout(() => {
      login({ name: email.split("@")[0] || "there", email });
      router.push("/dashboard");
    }, 900);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-md py-xl">
      <div className="w-full max-w-md flex flex-col items-center gap-lg">
        <div className="flex flex-col items-center gap-sm text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Database className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <h1 className="font-heading text-headline-lg text-on-surface">QueryPro AI</h1>
          <p className="font-sans text-body-md text-on-surface-variant">
            Secure access to your database workspace
          </p>
        </div>

        <div className="w-full bg-surface-container-lowest border border-border-subtle rounded shadow-elevation-2 p-lg flex flex-col gap-lg">
          <div className="grid grid-cols-2 rounded-lg bg-surface-container-low p-1">
            <span className="text-center py-sm rounded-md bg-surface-container-lowest text-primary font-label-md font-semibold shadow-elevation-1">
              Sign In
            </span>
            <Link
              href="/signup"
              className="text-center py-sm rounded-md text-on-surface-variant font-label-md hover:text-on-surface transition-colors"
            >
              Create Account
            </Link>
          </div>

          <div className="flex flex-col gap-sm">
            <button
              type="button"
              onClick={() => showToast("Google sign-in isn't available in this demo yet")}
              className="w-full flex items-center justify-center gap-sm py-md rounded-lg border border-outline-variant text-body-md text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <GoogleMark />
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => showToast("GitHub sign-in isn't available in this demo yet")}
              className="w-full flex items-center justify-center gap-sm py-md rounded-lg border border-outline-variant text-body-md text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <Github className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
              Continue with GitHub
            </button>
          </div>

          <div className="flex items-center gap-md">
            <div className="flex-1 h-px bg-border-subtle" />
            <span className="font-mono text-label-sm text-outline uppercase tracking-wider shrink-0">
              Secure email login
            </span>
            <div className="flex-1 h-px bg-border-subtle" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
            <div className="flex flex-col gap-xs">
              <label htmlFor="email" className="font-label-md font-semibold text-on-surface">
                Work email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-md top-1/2 -translate-y-1/2 h-[13.5px] w-[13.5px] text-on-surface-variant pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="dev@company.io"
                  className="w-full border border-outline-variant rounded-lg pl-[33px] pr-md py-md text-body-md bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                />
              </div>
            </div>

            <PasswordField
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              rightSlot={
                <Link href="/settings" className="text-label-md text-primary hover:underline">
                  Forgot password?
                </Link>
              }
            />

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-[13.5px] w-[13.5px] animate-spin" aria-hidden="true" /> : null}
              {submitting ? "Signing in…" : "Sign in to workspace"}
            </Button>
          </form>

          <p className="text-center text-body-md text-on-surface-variant">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>

        <p className="font-mono text-label-sm text-outline text-center">
          Encrypted connection · AES-256-GCM · v4.0.2-stable
        </p>
      </div>
    </div>
  );
}
