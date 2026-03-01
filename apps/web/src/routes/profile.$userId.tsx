import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/profile/$userId")({
  component: ProfileRedirect,
});

function ProfileRedirect() {
  const { userId } = Route.useParams();
  return <Navigate to="/users/$userId" params={{ userId }} />;
}
