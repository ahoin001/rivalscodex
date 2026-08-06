"use client";

import { type FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

type AdminLoginFormProps = {
  nextPath: string;
};

export function AdminLoginForm({ nextPath }: AdminLoginFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client) {
      setStatus("Supabase is not configured in this environment.");
      return;
    }

    setBusy(true);
    setStatus(null);

    const origin = window.location.origin;
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    setBusy(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Check your email for the sign-in link.");
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 rounded border border-rivals-ink/20 bg-white p-6 shadow-sm">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase italic text-rivals-ink">
          Admin sign-in
        </h1>
        <p className="mt-2 text-sm text-rivals-ink-soft">
          We&apos;ll email you a magic link to edit hero guides.
        </p>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-rivals-ink-muted">
          Email
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
          className="w-full rounded border border-rivals-light-300 px-3 py-2 text-sm text-rivals-ink outline-none focus:border-rivals-yellow-500"
          placeholder="you@example.com"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded bg-rivals-yellow-500 px-4 py-2 font-display text-sm font-bold uppercase italic tracking-wide text-rivals-ink transition-colors hover:bg-rivals-yellow-400 disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send magic link"}
      </button>
      {status ? <p className="text-sm text-rivals-ink-soft">{status}</p> : null}
    </form>
  );
}
