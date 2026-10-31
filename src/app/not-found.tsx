import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>Page not found</h1>
      <p>Return to your equipment workspace.</p>
      <Link className="button primary" href="/">
        Go to overview
      </Link>
    </div>
  );
}
