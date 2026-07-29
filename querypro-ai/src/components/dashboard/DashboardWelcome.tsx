"use client";

import { useAuthStore } from "@/lib/useAuthStore";

/**
 * Client island that reads the user's first name from the auth store.
 * Extracted from the Server Component dashboard page so the RSC doesn't
 * have to become a client component just for this one dynamic heading.
 */
export function DashboardWelcome() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <h1 className="font-heading text-headline-xl-mobile md:text-display-lg text-on-surface">
      Welcome back, {firstName}
    </h1>
  );
}
