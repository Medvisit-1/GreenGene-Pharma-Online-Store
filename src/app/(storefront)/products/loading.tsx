export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 h-9 w-48 animate-pulse rounded-lg bg-surface" />
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-full animate-pulse rounded-lg bg-surface" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col">
              <div className="aspect-square w-full animate-pulse rounded-2xl bg-surface" />
              <div className="mx-auto mt-3 h-3 w-3/4 animate-pulse rounded bg-surface" />
              <div className="mx-auto mt-2 h-4 w-1/3 animate-pulse rounded bg-surface" />
              <div className="mt-3 h-9 w-full animate-pulse rounded-full bg-surface" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
