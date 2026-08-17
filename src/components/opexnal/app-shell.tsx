import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, PlusSquare, Bell, User, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Search },
  { to: "/create", label: "Create", icon: PlusSquare, primary: true },
  { to: "/reels", label: "Reels", icon: Clapperboard },
  { to: "/activity", label: "Activity", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
] as const;


export function AppShell({
  children,
  header,
}: {
  children: ReactNode;
  header?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      {header}
      <main className="flex-1 pb-24">{children}</main>

      <nav
        aria-label="Primary"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-md items-center justify-around border-t border-border bg-background/95 px-2 pt-2 backdrop-blur"
      >
        {tabs.map(({ to, label, icon: Icon, ...rest }) => {
          const primary = "primary" in rest && rest.primary;
          const active = pathname === to || pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                primary && "brand-gradient-bg text-primary-foreground shadow-[var(--shadow-brand)]",
                !primary && (active ? "text-foreground" : "text-muted-foreground hover:text-foreground"),
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function ScreenHeader({
  title,
  left,
  right,
}: {
  title: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur">
      <div className="flex w-16 items-center">{left}</div>
      <h1 className="truncate text-base font-semibold">{title}</h1>
      <div className="flex w-16 items-center justify-end gap-1">{right}</div>
    </header>
  );
}
