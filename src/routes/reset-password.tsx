import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const resetSearchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => resetSearchSchema.parse(search),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/auth/reset-password",
      search: search.token ? { token: search.token } : {},
      replace: true,
    });
  },
  component: () => null,
});
