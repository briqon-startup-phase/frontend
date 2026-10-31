export default function Loading() {
  return (
    <div
      className="loading-view"
      role="status"
      aria-label="Loading equipment workspace"
    >
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-strip" />
      <div className="skeleton skeleton-panel" />
      <span className="sr-only">Loading workspace…</span>
    </div>
  );
}
