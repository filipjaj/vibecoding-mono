import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/clubs")({ component: ClubsPage });

function ClubsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clubs</h1>
        <p className="text-muted-foreground">
          Browse and manage your media clubs.
        </p>
      </div>
    </div>
  );
}
