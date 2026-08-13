import { Sparkles } from "lucide-react";

export function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center px-8 py-24 text-center">
      <div className="brand-gradient-bg flex h-12 w-12 items-center justify-center rounded-2xl">
        <Sparkles className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
