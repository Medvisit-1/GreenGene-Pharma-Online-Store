export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 h-3 w-40 animate-pulse rounded bg-surface" />
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="aspect-square w-full animate-pulse rounded-2xl bg-surface" />
        <div className="space-y-4">
          <div className="h-3 w-24 animate-pulse rounded bg-surface" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-surface" />
          <div className="h-7 w-28 animate-pulse rounded bg-surface" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-surface" />
          <div className="h-12 w-full animate-pulse rounded-full bg-surface" />
          <div className="h-24 w-full animate-pulse rounded-2xl bg-surface" />
        </div>
      </div>
    </div>
  );
}
