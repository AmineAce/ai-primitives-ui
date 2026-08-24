export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-screen flex-col items-center justify-center gap-6"
    >
      <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full border border-muted bg-elevated">
        <div className="size-2 rounded-full border border-fg-muted" />
      </div>
      <div className="h-2.5 w-44 animate-pulse rounded-full bg-elevated" />
      <div className="h-2.5 w-28 animate-pulse rounded-full bg-elevated" />
    </div>
  );
}
