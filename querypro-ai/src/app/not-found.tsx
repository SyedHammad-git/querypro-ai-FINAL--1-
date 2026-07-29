"use client";

import Link from "next/link";
import { CompassIcon, Home, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-lg">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-lg">
        <div className="w-20 h-20 rounded-full bg-accent-ai/10 flex items-center justify-center">
          <CompassIcon className="h-9 w-9 text-accent-ai" aria-hidden="true" />
        </div>

        <div>
          <p className="font-mono text-label-md text-on-surface-variant tracking-widest uppercase mb-2">
            Error 404
          </p>
          <h1 className="font-heading text-headline-xl text-on-surface">
            This page went missing
          </h1>
          <p className="font-sans text-body-lg text-on-surface-variant mt-2">
            The page you&apos;re looking for doesn&apos;t exist, may have moved, or the link is out of date.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-md w-full sm:w-auto">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full">
              <Home className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
              Go to Dashboard
            </Button>
          </Link>
          <a
            href="https://support.querypro.ai"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto"
          >
            <Button variant="secondary" size="lg" className="w-full">
              <LifeBuoy className="h-[13.5px] w-[13.5px]" aria-hidden="true" />
              Report this issue
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
