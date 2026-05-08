import Link from "next/link";
import { notFound } from "next/navigation";
import { RivalsFeatureSection, RivalsPageShell, RivalsPill, RivalsSectionHeader } from "@/components/ui";
import { DevApiPanel } from "@/features/dev-api/components/dev-api-panel";

export default function DevEndpointsPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <RivalsPageShell className="space-y-8 py-7 lg:py-12">
      <RivalsSectionHeader
        eyebrow="Developer Toolkit"
        title="Endpoint Testing"
        description="Dedicated page for validating Marvel Rivals API behavior with full response payload visibility."
      />

      <div>
        <Link
          href="/"
          className="inline-flex w-fit border border-brand-gold/45 bg-brand-gold-muted px-3 py-1 text-xs uppercase tracking-wide text-brand-gold hover:border-brand-gold hover:bg-brand-gold hover:text-[#10131e]"
        >
          Back To Home
        </Link>
      </div>

      <RivalsFeatureSection
        eyebrow="Dev Only"
        title="Full Payload Endpoint Tester"
        description="Runs server-side endpoint checks and keeps full JSON responses visible for deep inspection."
        media={
          <div className="space-y-2">
            <RivalsPill tone="brand">No Truncation</RivalsPill>
            <p className="text-sm leading-6 text-muted-foreground">
              Use this page when endpoint responses are large and you need the entire payload for
              debugging.
            </p>
            <div className="border-t border-brand-gold/40 pt-2 text-xs uppercase tracking-wide text-brand-gold/90">
              Full JSON · Secure Key Handling · Hero Endpoint Diagnostics
            </div>
          </div>
        }
      >
        <DevApiPanel truncateResponse={false} responseMaxHeightClassName="max-h-[70vh]" />
      </RivalsFeatureSection>
    </RivalsPageShell>
  );
}
