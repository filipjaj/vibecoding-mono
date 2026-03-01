import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

type EventDetail = {
  id: string; clubId: string; clubName: string; title: string; description: string | null;
  location: string | null; startsAt: string; endsAt: string | null;
  media: { id: string; title: string; coverUrl: string | null; authorOrDirector: string | null } | null;
  rsvps: Array<{ status: string; user: { id: string; name: string; image: string | null } }>;
};

export const Route = createFileRoute("/events/$eventId")({ component: EventDetailPage });

function EventDetailPage() {
  const { eventId } = Route.useParams();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => api<EventDetail>(`/api/events/${eventId}`),
  });

  async function handleRsvp(status: "going" | "maybe" | "not_going") {
    await api(`/api/events/${eventId}/rsvp`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    queryClient.invalidateQueries({ queryKey: ["event", eventId] });
  }

  if (isLoading || !event) return <p className="text-muted-foreground py-12 text-center">Laster...</p>;

  const myRsvp = event.rsvps.find((r) => r.user.id === session?.user?.id);
  const going = event.rsvps.filter((r) => r.status === "going");

  const rsvpLabels: Record<string, string> = {
    going: "Kommer", maybe: "Kanskje", not_going: "Kan ikke",
  };

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link to="/clubs/$clubId" params={{ clubId: event.clubId }} className="hover:text-foreground transition-colors">
            {event.clubName}
          </Link>
          <span>/</span>
          <span>{event.title}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
        <p className="text-muted-foreground mt-2">
          {new Date(event.startsAt).toLocaleDateString("nb-NO", {
            weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
          })}
        </p>
        {event.location && <p className="text-sm mt-1">{event.location}</p>}
      </div>

      {event.description && <p className="leading-relaxed">{event.description}</p>}

      {event.media && (
        <div className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          {event.media.coverUrl && (
            <div className="w-12 aspect-[2/3] overflow-hidden rounded-lg bg-muted shrink-0">
              <img src={event.media.coverUrl} alt={event.media.title} className="h-full w-full object-cover" />
            </div>
          )}
          <div>
            <p className="font-medium">{event.media.title}</p>
            {event.media.authorOrDirector && <p className="text-sm text-muted-foreground">{event.media.authorOrDirector}</p>}
          </div>
        </div>
      )}

      {session?.user && (
        <div className="flex gap-2">
          {(["going", "maybe", "not_going"] as const).map((status) => (
            <Button key={status}
              variant={myRsvp?.status === status ? "default" : "outline"}
              onClick={() => handleRsvp(status)}>
              {rsvpLabels[status]}
            </Button>
          ))}
        </div>
      )}

      <section>
        <h3 className="font-semibold mb-3">Kommer ({going.length})</h3>
        <div className="flex flex-wrap gap-2">
          {going.map((r) => (
            <div key={r.user.id} className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm shadow-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {r.user.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium">{r.user.name}</span>
            </div>
          ))}
          {going.length === 0 && <p className="text-sm text-muted-foreground">Ingen påmeldte ennå.</p>}
        </div>
      </section>
    </div>
  );
}
