/** Shared hydration placeholder so pages don't flash blank before localStorage loads. */
export default function Loading() {
  return <div className="text-muted text-sm">Loading…</div>;
}
