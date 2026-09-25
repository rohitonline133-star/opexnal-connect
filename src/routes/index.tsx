import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Globe2, Sparkles } from "lucide-react";
import { OpexnalMark, OpexnalWordmark } from "@/components/opexnal/logo";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Opexnal — Create. Connect. Grow." },
      {
        name: "description",
        content:
          "Opexnal is a global social platform for creators and communities. Share moments, build an audience and grow — privately and securely.",
      },
      { property: "og:title", content: "Opexnal — Create. Connect. Grow." },
      {
        property: "og:description",
        content:
          "A global, mobile-first social platform for creators and communities. Create. Connect. Grow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const highlights = [
  {
    icon: Sparkles,
    title: "Built for creators",
    body: "Personal, creator and business accounts from day one.",
  },
  {
    icon: ShieldCheck,
    title: "Security first",
    body: "Two-factor auth, device sessions and audit logging.",
  },
  { icon: Globe2, title: "Global ready", body: "Worldwide accounts, time zones and languages." },
];

function Landing() {
  const { user, loading } = useSession();

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-12 pt-16">
      <div
        className="brand-glow pointer-events-none absolute inset-x-0 top-0 h-80"
        aria-hidden="true"
      />

      <div className="relative flex flex-1 flex-col">
        <OpexnalMark className="h-14 w-14" />

        <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight">
          <OpexnalWordmark className="text-4xl" />
        </h1>
        <p className="mt-3 text-lg font-medium brand-gradient-text">Create. Connect. Grow.</p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          An original, global social platform. Build your profile, grow a real audience and stay in
          control of your privacy.
        </p>

        <div className="mt-8 space-y-3">
          {highlights.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex gap-3 rounded-2xl border border-border bg-surface p-4 elevated"
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto space-y-3 pt-10">
          {loading ? null : user ? (
            <Button asChild variant="brand" size="xl">
              <Link to="/home">
                Open Feed <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="brand" size="xl">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Create your account
                </Link>
              </Button>
              <Button asChild variant="surface" size="xl">
                <Link to="/auth" search={{ mode: "login" }}>
                  Log in to existing account
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
