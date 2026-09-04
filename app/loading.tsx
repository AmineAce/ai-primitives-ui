export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-screen flex-col items-center justify-center gap-6"
    >
      <div className="border-muted bg-elevated flex h-12 w-12 animate-pulse items-center justify-center rounded-full border">
        <div className="border-fg-muted size-2 rounded-full border" />
      </div>
      <div className="bg-elevated h-2.5 w-44 animate-pulse rounded-full" />
      <div className="bg-elevated h-2.5 w-28 animate-pulse rounded-full" />
    </div>
  );
}
