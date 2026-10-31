"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <h1>Unable to load this view</h1>
      <p>Your workspace could not be displayed. Try loading it again.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
