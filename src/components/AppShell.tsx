import React from "react";
import { useNavigate } from "@tanstack/react-router";

type AppShellProps = { children: React.ReactNode; activeTab?: string; header?: React.ReactNode };

export function AppShell({ children, header }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {header}
      {children}
    </div>
  );
}

type ScreenHeaderProps = {
  title: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void | Promise<void>;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, showBack = false, onBack, left, right }: ScreenHeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="flex items-center justify-between gap-3 border-b pb-4">
      <div className="flex min-w-10 items-center">
        {left}
        {showBack && (
          <button
            type="button"
            aria-label="Go back"
            onClick={() => (onBack ? void onBack() : navigate({ to: "/home" }))}
            className="rounded-md px-2 py-1 text-sm hover:bg-muted"
          >
            ← Back
          </button>
        )}
      </div>
      <h1 className="text-xl font-bold">{title}</h1>
      <div className="flex min-w-10 justify-end">{right}</div>
    </header>
  );
}
