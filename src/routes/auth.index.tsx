import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const authSearchSchema = z.object({
  mode: z.enum(["login", "signup"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/")({
  validateSearch: (search: Record<string, unknown>) => authSearchSchema.parse(search),
  beforeLoad: ({ search }) => {
    if (search.mode === "signup") {
      throw redirect({
        to: "/auth/signup",
        search: { redirect: search.redirect },
      });
    }
    throw redirect({
      to: "/auth/login",
      search: { redirect: search.redirect },
    });
  },
});
