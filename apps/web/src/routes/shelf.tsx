import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/shelf")({ component: ShelfPage });

function ShelfPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Shelf</h1>
        <p className="text-muted-foreground">
          Everything you are reading, watching, and listening to.
        </p>
      </div>
    </div>
  );
}
