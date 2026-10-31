"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import {
  LayoutDashboard,
  Refrigerator,
  ChartNoAxesCombined,
  Bell,
  History,
  Settings,
  BookOpen,
  Search,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  Menu,
  X,
  Radio,
  Pause,
  Play,
  Check,
  Building2,
} from "lucide-react";
import { useWorkspace } from "./workspace-provider";
import { Modal } from "./ui";
import { outlets } from "@/lib/sample-data";
import { outletName } from "@/lib/domain";
import Image from "next/image";

const links = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/equipment", label: "Equipment", icon: Refrigerator },
  { href: "/energy", label: "Energy", icon: ChartNoAxesCombined },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/activity", label: "Activity log", icon: History },
];

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="BRIQON home">
      <Image
        className="brand-logo"
        src="/assets/logo.svg"
        alt=""
        width={44}
        height={44}
      />
      <span className="brand-wordmark">BRIQON</span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, scope, setScope, paused, setPaused, toast } = useWorkspace();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [guide, setGuide] = useState(false);
  const scoped = state.equipment.filter(
    (e) => scope === "all" || e.outletId === scope,
  );
  const unresolved = state.notifications.filter(
    (n) => !n.acknowledged && scoped.some((e) => e.id === n.equipmentId),
  ).length;
  const current =
    links.find((l) =>
      l.href === "/" ? pathname === "/" : pathname.startsWith(l.href),
    )?.label || "Settings";
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);
  const found = query.trim()
    ? state.equipment.filter((e) =>
        `${e.name} ${e.id} ${outletName(e.outletId)}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : state.equipment.slice(0, 4);
  return (
    <div className="app-frame">
      <Script
        src="/vendor/charts.js"
        onReady={() => {
          window.dispatchEvent(new Event("briqon-charts-ready"));
        }}
      />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {menu && (
        <button
          className="nav-overlay"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <aside
        className={`sidebar ${menu ? "is-open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="brand-row">
          <Brand />
          <button
            className="icon-button mobile-only"
            aria-label="Close navigation"
            onClick={() => setMenu(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="workspace-initial">B</span>
          <div>
            <strong>{state.preferences.workspace}</strong>
            <span>Equipment workspace</span>
          </div>
        </div>
        <p className="nav-label">Workspace</p>
        <nav>
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${href === "/" ? (pathname === "/" ? "active" : "") : pathname.startsWith(href) ? "active" : ""}`}
              aria-current={
                (href === "/" ? pathname === "/" : pathname.startsWith(href))
                  ? "page"
                  : undefined
              }
            >
              <Icon size={18} />
              <span>{label}</span>
              {href === "/notifications" && unresolved > 0 && (
                <span className="nav-count">{unresolved}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link
            href="/settings"
            className={`nav-item ${pathname === "/settings" ? "active" : ""}`}
          >
            <Settings size={18} />
            Settings
          </Link>
          <button className="nav-item" onClick={() => setGuide(true)}>
            <BookOpen size={18} />
            Workspace guide
            <ArrowUpRight size={14} className="push-right" />
          </button>
          <Link href="/settings" className="profile">
            <span className="avatar">OM</span>
            <span>
              <strong>Outlet manager</strong>
              <small>Workspace settings</small>
            </span>
            <ChevronRight size={16} />
          </Link>
        </div>
      </aside>
      <div className="main-frame" inert={menu}>
        <div className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-only"
              aria-label="Open navigation"
              aria-expanded={menu}
              onClick={() => setMenu(true)}
            >
              <Menu size={20} />
            </button>
            <div className="topbar-brand">
              <Brand />
            </div>
            <Building2 size={15} className="desktop-only" />
            <span className="desktop-only">Workspace</span>
            <ChevronRight size={13} className="desktop-only" />
            <span>{current}</span>
          </div>
          <div className="topbar-actions">
            <button className="search-trigger" onClick={() => setSearch(true)}>
              <Search size={16} />
              <span>Search equipment</span>
              <kbd>Ctrl K</kbd>
            </button>
            <Link
              href="/notifications"
              className="icon-button notification-bell"
              aria-label={`${unresolved} unacknowledged notifications`}
            >
              <Bell size={18} />
              {unresolved > 0 && <span />}
            </Link>
          </div>
        </div>
        <main id="main-content" className="main-sheet">
          <div className="scope-row">
            <div className="outlet-select">
              <Building2 size={15} />
              <label className="sr-only" htmlFor="outlet-scope">
                Outlet
              </label>
              <select
                id="outlet-scope"
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value);
                  if (pathname === "/") router.replace("/", { scroll: false });
                }}
              >
                <option value="all">All outlets</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
            <div className="data-status">
              <span className={`tiny-dot ${paused ? "paused" : ""}`} />
              <span>{paused ? "Playback paused" : "Simulation running"}</span>
              <span className="scope-separator">/</span>
              <span>31 Oct 2026</span>
            </div>
          </div>
          {children}
          <footer className="page-footer">
            <span>BRIQON · Equipment connected. Operations in view.</span>
            <span>All times in WIB (UTC+7)</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
      <Modal
        open={search}
        onClose={() => setSearch(false)}
        title="Find equipment"
      >
        <div className="search-input">
          <Search size={18} />
          <input
            autoFocus
            aria-label="Search by equipment, ID or outlet"
            placeholder="Search equipment, ID or outlet…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <p className="search-caption">
          {query ? `${found.length} matching equipment` : "Quick access"}
        </p>
        <div className="search-results">
          {found.map((e) => (
            <button
              key={e.id}
              onClick={() => {
                router.push(`/equipment/${e.id}`);
                setSearch(false);
                setQuery("");
              }}
            >
              <Refrigerator size={18} />
              <span>
                <strong>{e.name}</strong>
                <small>
                  {e.id} · {outletName(e.outletId)}
                </small>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
          {found.length === 0 && (
            <p className="empty-message">
              No matching equipment. Try a name, ID, or outlet.
            </p>
          )}
        </div>
      </Modal>
      <Modal
        open={guide}
        onClose={() => setGuide(false)}
        title="Your equipment workspace"
      >
        <div className="guide-content">
          <p>
            Follow the condition of your refrigeration equipment, investigate
            notifications, and review each control response in one workspace.
          </p>
          <h3>Observe</h3>
          <p>
            Choose an outlet or open an equipment detail to see temperatures,
            configured ranges, energy use, and reading freshness.
          </p>
          <h3>Respond</h3>
          <p>
            Acknowledge a notification to record that it has been reviewed.
            Acknowledging does not resolve the underlying condition.
          </p>
          <h3>Verify</h3>
          <p>
            A confirmed command means the device reported the requested relay
            state. Physical equipment behavior requires separate feedback or an
            on-site check.
          </p>
          <div className="info-note">
            This workspace uses sample data. Control actions are simulated; no
            physical equipment is connected.
          </div>
          <button className="button primary" onClick={() => setGuide(false)}>
            Got it
          </button>
        </div>
      </Modal>
    </div>
  );
}
