import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/post/$postId")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/p/$postId",
      params: { postId: params.postId },
      replace: true,
    });
  },
  component: () => null,
});
