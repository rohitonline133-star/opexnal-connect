import React from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}

export function ScreenHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between pb-4 border-b">
      <h1 className="text-xl font-bold">{title}</h1>
    </div>
  );
}
