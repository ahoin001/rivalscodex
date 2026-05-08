import Link from "next/link";

export default function HeroNotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-5xl italic uppercase">Hero Not Found</h1>
      <p className="text-muted-foreground">
        This dossier entry is unavailable. Return to the gallery and select another
        hero.
      </p>
      <Link
        href="/"
        className="clipped-edge border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide hover:bg-white/20"
      >
        Return Home
      </Link>
    </main>
  );
}
