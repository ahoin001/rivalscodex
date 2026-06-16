export default function HeroLoading() {
  return (
    <main className="lab-light-theme min-h-screen">
      <section className="mx-auto w-full max-w-[min(100%,1680px)] px-5 py-8 sm:px-8 lg:px-12">
        <div className="space-y-4">
          <div className="h-7 w-48 animate-pulse rounded bg-black/15" />
          <div className="h-12 w-80 max-w-full animate-pulse rounded bg-black/12" />
          <div className="h-[26rem] w-full animate-pulse rounded-xl border border-black/10 bg-black/8" />
        </div>
      </section>
    </main>
  );
}
