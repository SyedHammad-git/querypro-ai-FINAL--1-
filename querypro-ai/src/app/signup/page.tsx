"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Database, Github, Loader2, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/auth/PasswordField";
import { GoogleMark } from "@/components/auth/GoogleMark";
import { useToast } from "@/components/ui/Toast";
import { useAuthStore } from "@/lib/useAuthStore";

export default function SignupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const login = useAuthStore((s) => s.login);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const passwordsMatch = confirmPassword.length === 0 || confirmPassword === password;
  const canSubmit = fullName.trim() && email.trim() && password && confirmPassword === password && agreed;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    // Simulated account creation — production wiring calls the auth service.
    setTimeout(() => {
      login({ name: fullName.trim(), email: email.trim() });
      router.push("/dashboard");
    }, 900);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-lg py-2xl">
      <div className="w-full max-w-md flex flex-col items-center gap-lg">
        <div className="flex flex-col items-center gap-sm text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Database className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <h1 className="font-heading text-headline-lg text-on-surface">QueryPro AI</h1>
          <p className="font-sans text-body-md text-on-surface-variant">High-performance SQL studio</p>
        </div>

        <div className="w-full bg-surface-container-lowest border border-border-subtle rounded shadow-elevation-2 p-lg flex flex-col gap-lg">
          <div className="grid grid-cols-2 rounded-lg bg-surface-container-low p-1">
            <Link
              href="/login"
              className="text-center py-sm rounded-md text-on-surface-variant font-label-md hover:text-on-surface transition-colors"
            >
              Sign In
            </Link>
            <span className="text-center py-sm rounded-md bg-surface-container-lowest text-primary font-label-md font-semibold shadow-elevation-1">
              Create Account
            </span>
          </div>

          <div className="flex flex-col gap-sm">
            <button
              type="button"
              onClick={() => showToast("Google sign-up isn't available in this demo yet")}
              className="w-full flex items-center justify-center gap-sm py-md rounded-lg border border-outline-variant text-body-md text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <GoogleMark />
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => showToast("GitHub sign-up isn't available in this demo yet")}
              className="w-full flex items-center justify-center gap-sm py-md rounded-lg border border-outline-variant text-body-md text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <Github className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
              Continue with GitHub
            </button>
          </div>

          <div className="flex items-center gap-md">
            <div className="flex-1 h-px bg-border-subtle" />
            <span className="font-mono text-label-sm text-outline uppercase tracking-wider shrink-0">
              Secure account registration
            </span>
            <div className="flex-1 h-px bg-border-subtle" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
            <div className="flex flex-col gap-xs">
              <label htmlFor="full-name" className="font-label-md font-semibold text-on-surface">
                Full name
              </label>
              <div className="relative">
                <User
                  className="absolute left-md top-1/2 -translate-y-1/2 h-[13.5px] w-[13.5px] text-on-surface-variant pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="full-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  placeholder="John Doe"
                  className="w-full border border-outline-variant rounded-lg pl-[33px] pr-md py-md text-body-md bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-xs">
              <label htmlFor="work-email" className="font-label-md font-semibold text-on-surface">
                Work email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-md top-1/2 -translate-y-1/2 h-[13.5px] w-[13.5px] text-on-surface-variant pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="work-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="name@company.com"
                  className="w-full border border-outline-variant rounded-lg pl-[33px] pr-md py-md text-body-md bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                />
              </div>
            </div>

            <PasswordField
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              showStrength
            />

            <div className="flex flex-col gap-xs">
              <PasswordField
                id="confirm-password"
                label="Confirm password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
              />
              {!passwordsMatch && (
                <span className="text-label-sm text-error">Passwords don&apos;t match yet.</span>
              )}
            </div>

            <label className="flex items-start gap-sm">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/40 shrink-0"
              />
              <span className="text-body-md text-on-surface-variant">
                By creating an account, you agree to our{" "}
                <a href="#" className="text-primary hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary hover:underline">
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            <Button type="submit" size="lg" className="w-full" disabled={!canSubmit || submitting}>
              {submitting ? <Loader2 className="h-[13.5px] w-[13.5px] animate-spin" aria-hidden="true" /> : null}
              {submitting ? "Creating account…" : "Create workspace account"}
            </Button>
          </form>

          <p className="text-center text-body-md text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="font-mono text-label-sm text-outline text-center">
          Node: global-01 · AES-256 enabled · v4.0.2-stable
        </p>
      </div>
    </div>
  );
}
