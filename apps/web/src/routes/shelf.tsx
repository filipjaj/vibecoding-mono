import { createFileRoute, Link } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";

export const Route = createFileRoute("/shelf")({ component: ShelfPage });

type ShelfItem = {
  status: "want" | "reading" | "watched" | "finished";
  addedAt: string;
  media: {
    id: string; title: string; authorOrDirector: string | null;
    coverUrl: string | null; mediaType: "book" | "film"; year: number | null;
  };
};

const statusLabels: Record<string, string> = {
  reading: "Leser nå", want: "Vil lese", watched: "Sett", finished: "Ferdig",
};

const filters = ["all", "reading", "want", "watched", "finished"] as const;

function ShelfPage() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState<string>("all");

  const { data: shelf, isLoading } = useQuery({
    queryKey: ["shelf", session?.user?.id],
    queryFn: () => api<ShelfItem[]>(`/api/users/${session!.user.id}/shelf`),
    enabled: !!session?.user?.id,
  });

  const filtered = filter === "all" ? shelf : shelf?.filter((i) => i.status === filter);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hylla mi</h1>
        <p className="text-muted-foreground mt-1">Alt du leser og ser på.</p>
      </div>

      <div className="flex gap-1 rounded-xl bg-muted p-1 w-fit">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {f === "all" ? "Alle" : statusLabels[f] ?? f}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Laster...</p>}

      {filtered && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">{filter === "all" ? "Hylla di er tom." : `Ingen «${statusLabels[filter]}»-elementer.`}</p>
        </div>
      )}

      {filtered && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((item) => (
            <Link key={item.media.id} to="/media/$mediaId" params={{ mediaId: item.media.id }}>
              <div className="group flex flex-col gap-2">
                <div className="aspect-[2/3] overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-black/5 transition-all group-hover:shadow-md group-hover:ring-primary/20">
                  {item.media.coverUrl ? (
                    <img src={item.media.coverUrl} alt={item.media.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-3 text-xs text-muted-foreground text-center">{item.media.title}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">{item.media.title}</p>
                  {item.media.authorOrDirector && <p className="text-xs text-muted-foreground truncate mt-0.5">{item.media.authorOrDirector}</p>}
                  <span className="inline-block mt-1 text-xs text-muted-foreground">{statusLabels[item.status]}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
