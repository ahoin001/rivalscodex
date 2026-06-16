export default function RootLoading() {
  return (
    <main className="mx-auto w-full max-w-[min(100%,1680px)] px-4 py-10 sm:px-6 lg:px-10">
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded bg-white/15" />
        <div className="h-4 w-[22rem] max-w-full animate-pulse rounded bg-white/10" />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[4/5] animate-pulse rounded-xl border border-white/10 bg-white/8"
          />
        ))}
      </div>
    </main>
  );
}
