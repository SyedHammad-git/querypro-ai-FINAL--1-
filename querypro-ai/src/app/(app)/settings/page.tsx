"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Database, KeyRound, Plus, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingReveal } from "@/components/ui/LoadingReveal";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/Toast";
import { useAuthStore } from "@/lib/useAuthStore";
import { useSqlStore } from "@/lib/useSqlStore";

const SECTIONS = ["Profile", "Connections", "Notifications", "API Keys"] as const;
type Section = (typeof SECTIONS)[number];

function ToggleRow({
  label,
  description,
  defaultChecked = false,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between gap-md py-md border-b border-border-subtle last:border-0">
      <div className="min-w-0">
        <div className="font-label-md font-semibold text-on-surface">{label}</div>
        <div className="text-body-md text-on-surface-variant">{description}</div>
      </div>
      <Switch checked={checked} onChange={setChecked} label={label} />
    </div>
  );
}

export default function SettingsPage() {
  const [section, setSection] = useState<Section>("Profile");
  const { showToast } = useToast();
  const isDbReady = useSqlStore((state) => state.isDbReady);
  const schemaError = useSqlStore((state) => state.schemaError);

  // Auth store
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  // Controlled profile fields — seeded from the store so edits don't require
  // a page refresh to feel connected to the rest of the app.
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl ?? null);

  // Keep local fields in sync if the user is set asynchronously (e.g. after
  // the persist middleware rehydrates on first mount).
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setAvatarPreview(user.avatarUrl ?? null);
    }
  }, [user]);

  const photoInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Revoke any previous blob URL to avoid memory leaks.
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    e.target.value = "";
  }

  function handleSaveProfile() {
    updateProfile({ name: name.trim() || user?.name, email: email.trim() || user?.email, avatarUrl: avatarPreview ?? undefined });
    showToast("Profile saved");
  }

  const avatarSrc = avatarPreview ?? `https://i.pravatar.cc/72?img=13`;

  return (
    <div className="flex-1 overflow-y-auto">
      <LoadingReveal skeleton={<PageSkeleton />}>
        <PageHeader title="Settings" description="Manage your profile, connections, and preferences." />

        <div className="px-lg md:px-2xl pb-2xl flex flex-col md:flex-row gap-lg items-start">
          <nav className="w-full md:w-56 shrink-0 flex md:flex-col gap-1 overflow-x-auto scrollbar-hide" aria-label="Settings sections">
            {SECTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSection(s)}
                aria-current={section === s ? "page" : undefined}
                className={`text-left px-md py-sm rounded-lg font-label-md whitespace-nowrap transition-colors ${
                  section === s
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                {s}
              </button>
            ))}
          </nav>

          <div className="flex-1 w-full">
            {section === "Profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                </CardHeader>
                <CardBody className="flex flex-col gap-lg">
                  {/* Avatar picker */}
                  <div className="flex items-center gap-md">
                    <div className="relative group">
                      <Image
                        src={avatarSrc}
                        alt="Your profile photo"
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-full object-cover border border-border-subtle"
                        unoptimized={avatarPreview?.startsWith("blob:") ?? false}
                      />
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        aria-label="Change profile photo"
                        className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Camera className="h-5 w-5 text-white" aria-hidden="true" />
                      </button>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => photoInputRef.current?.click()}>
                      <Camera className="h-4 w-4" aria-hidden="true" />
                      Change photo
                    </Button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      aria-hidden="true"
                      onChange={handlePhotoChange}
                    />
                  </div>

                  {/* Controlled text fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
                    <label className="flex flex-col gap-xs">
                      <span className="font-label-md font-semibold text-on-surface">Full name</span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-outline-variant rounded-lg px-md py-md text-body-md bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                      />
                    </label>
                    <label className="flex flex-col gap-xs">
                      <span className="font-label-md font-semibold text-on-surface">Email</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-outline-variant rounded-lg px-md py-md text-body-md bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                      />
                    </label>
                  </div>

                  <div>
                    <Button onClick={handleSaveProfile}>
                      <Save className="h-4 w-4" aria-hidden="true" />
                      Save changes
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}

            {section === "Connections" && (
              <Card>
                <CardHeader>
                  <CardTitle>Backend connection</CardTitle>
                </CardHeader>
                <CardBody className="space-y-md">
                  <div className="flex items-center justify-between gap-md rounded-lg border border-border-subtle bg-surface-container-low px-md py-md">
                    <div className="flex items-center gap-md min-w-0">
                      <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Database className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-mono text-label-md truncate">Prisma + PGlite</div>
                        <div className="text-label-sm text-on-surface-variant">{isDbReady ? "Connected" : "Booting"}</div>
                      </div>
                    </div>
                    <span className={`rounded-full px-sm py-1 text-[10px] font-semibold uppercase ${isDbReady ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                      {isDbReady ? "Live" : "Starting"}
                    </span>
                  </div>
                  {schemaError ? (
                    <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-md py-sm text-sm text-red-700 dark:text-red-300">
                      {schemaError}
                    </div>
                  ) : (
                    <p className="text-sm text-on-surface-variant">
                      The workspace is using the live in-browser database and schema refresh pipeline.
                    </p>
                  )}
                </CardBody>
              </Card>
            )}

            {section === "Notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardBody className="p-md">
                  <ToggleRow
                    label="Long-running queries"
                    description="Alert me when a query exceeds 1 second."
                    defaultChecked
                  />
                  <ToggleRow
                    label="Schema changes"
                    description="Notify me when tables or columns change."
                    defaultChecked
                  />
                  <ToggleRow
                    label="Weekly digest"
                    description="A summary of query volume and performance."
                  />
                </CardBody>
              </Card>
            )}

            {section === "API Keys" && (
              <Card>
                <CardHeader>
                  <CardTitle>API keys</CardTitle>
                  <Button size="sm" variant="secondary">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Generate key
                  </Button>
                </CardHeader>
                <CardBody className="flex items-center gap-md">
                  <div className="w-9 h-9 rounded bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                    <KeyRound className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
                  </div>
                  <code className="font-mono text-label-md text-on-surface-variant flex-1 truncate">
                    qp_live_••••••••••••••••8f2a
                  </code>
                  <Button size="sm" variant="ghost">
                    Revoke
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </LoadingReveal>
    </div>
  );
}
