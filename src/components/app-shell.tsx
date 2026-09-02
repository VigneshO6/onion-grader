import { Link, useLocation } from "@tanstack/react-router";
import { Bell, LayoutDashboard, ScanLine, FileText, User, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/camera", label: "Quality Analysis", icon: ScanLine },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function Brand() {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-violet text-primary-foreground">
        <span className="font-display text-sm font-extrabold">Ai</span>
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-lg leading-tight font-extrabold text-primary">
          Onion<span className="text-foreground">AI</span>
        </span>
        <span className="block truncate text-[10px] font-semibold text-muted-foreground">
          AI-Powered Quality Assessment
        </span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  return (
    <nav className="space-y-1.5">
      {navItems.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
              active
                ? "bg-gradient-violet text-primary-foreground shadow-glow"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            <Icon className="size-5 shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="border-b border-sidebar-border px-5 py-5">
          <Brand />
        </div>
        <div className="p-4">
          <NavLinks />
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-72 max-w-[85vw] bg-sidebar p-4 shadow-card">
            <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <Brand />
              <button
                aria-label="Close menu"
                className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-sidebar-accent"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
          <button
            aria-label="Open menu"
            className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-accent lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="min-w-0 lg:hidden">
            <Brand />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="grid size-10 place-items-center rounded-xl text-muted-foreground">
              <Bell className="size-5" />
            </span>
            <Link
              to="/profile"
              className={`flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-semibold transition-colors hover:bg-accent ${
                pathname.startsWith("/profile") ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              <span className="grid size-8 place-items-center rounded-full bg-secondary text-secondary-foreground">
                <User className="size-4" />
              </span>
              <span className="hidden sm:inline">Account</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pt-5 pb-24 sm:px-6 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card px-2 py-2 lg:hidden">
        <div className="flex items-center justify-around">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className={`grid size-11 shrink-0 place-items-center rounded-xl transition-colors ${
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-5" />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pb-5">
      <div className="min-w-0">
        <h1 className="truncate font-display text-2xl font-extrabold text-foreground">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
