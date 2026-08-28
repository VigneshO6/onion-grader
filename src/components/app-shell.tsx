import { Link, useLocation } from "@tanstack/react-router";
import { ScanLine, FileText, Camera, User } from "lucide-react";
import type { ReactNode } from "react";

const tabs = [
  { to: "/", label: "Scan", icon: ScanLine },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/camera", label: "Camera", icon: Camera },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-background pb-24">
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-4 pb-4">
        <div className="surface flex items-center justify-around rounded-3xl px-2 py-2">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className={`grid size-11 shrink-0 place-items-center rounded-full transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground ring-1 ring-primary/60"
                    : "text-muted-foreground"
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
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 pt-8 pb-4">
      <div className="min-w-0">
        <h1 className="truncate font-display text-2xl font-bold text-foreground">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
