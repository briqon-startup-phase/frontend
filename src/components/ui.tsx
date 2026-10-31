"use client";
import { useEffect, useRef } from "react";
import {
  X,
  ArrowUpRight,
  CircleCheck,
  CircleAlert,
  WifiOff,
} from "lucide-react";
import Link from "next/link";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    else if (!open && ref.current?.open) ref.current.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </header>
  );
}
export function PanelHeading({
  title,
  description,
  href,
  linkLabel = "View all",
  children,
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {linkLabel}
          <ArrowUpRight size={14} />
        </Link>
      )}
      {children}
    </div>
  );
}
export function Status({ status }: { status: string }) {
  const tone =
    status === "In range" || status === "Confirmed" || status === "Resolved"
      ? "positive"
      : status === "Needs attention" || status === "Pending"
        ? "warning"
        : "neutral";
  return (
    <span className={`status ${tone}`}>
      <span className="status-dot" />
      {status}
    </span>
  );
}
export function NotificationIcon({ severity }: { severity: string }) {
  return severity === "resolved" ? (
    <CircleCheck size={17} />
  ) : severity === "offline" ? (
    <WifiOff size={17} />
  ) : (
    <CircleAlert size={17} />
  );
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
