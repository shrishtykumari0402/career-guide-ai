export default function Loading() {
  return (
    <div className="container mx-auto space-y-10 px-5 pb-20 pt-32 md:px-8 md:pt-44" aria-label="Loading">
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <div className="mx-auto h-3 w-36 animate-pulse rounded-full bg-muted" />
        <div className="mx-auto h-14 max-w-2xl animate-pulse rounded-xl bg-muted" />
        <div className="mx-auto h-5 max-w-xl animate-pulse rounded-full bg-muted" />
      </div>
      <div className="mx-auto aspect-video max-w-6xl animate-pulse rounded-xl border border-border/70 bg-muted/60 shadow-2xl" />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-48 animate-pulse rounded-xl border border-border/70 bg-muted/50" />
        ))}
      </div>
    </div>
  );
}
