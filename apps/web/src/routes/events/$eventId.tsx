import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

type EventDetail = {
  id: string; clubId: string; title: string; description: string | null;
  location: string | null; startsAt: string; endsAt: string | null;
  media: { id: string; title: string; coverUrl: string | null; authorOrDirector: string | null } | null;
  rsvps: Array<{ status: string; user: { id: string; name: string; image: string | null } }>;
};

export const Route = createFileRoute("/events/$eventId")({ component: EventDetailPage });

function EventDetailPage() {
  const { eventId } = Route.useParams();
  const { data: session } = useSession();
  const [event, setEvent] = useState<EventDetail | null>(null);

  useEffect(() => { api<EventDetail>(`/api/events/${eventId}`).then(setEvent).catch(console.error); }, [eventId]);

  async function handleRsvp(status: "going" | "maybe" | "not_going") {
    await api(`/api/events/${eventId}/rsvp`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = await api<EventDetail>(`/api/events/${eventId}`);
    setEvent(updated);
  }

  if (!event) return <AppShell><p>Loading...</p></AppShell>;

  const myRsvp = event.rsvps.find((r) => r.user.id === session?.user?.id);
  const going = event.rsvps.filter((r) => r.status === "going");

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <p className="text-muted-foreground mt-1">
            {new Date(event.startsAt).toLocaleDateString("en-US", {
              weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
            })}
          </p>
          {event.location && <p className="text-sm mt-2">{event.location}</p>}
        </div>

        {event.description && <p>{event.description}</p>}

        {event.media && (
          <Card className="flex gap-4 p-4">
            {event.media.coverUrl && <img src={event.media.coverUrl} alt={event.media.title} className="w-12 h-16 object-cover rounded" />}
            <div>
              <p className="font-medium">{event.media.title}</p>
              <p className="text-sm text-muted-foreground">{event.media.authorOrDirector}</p>
            </div>
          </Card>
        )}

        {session?.user && (
          <div className="flex gap-2">
            {(["going", "maybe", "not_going"] as const).map((status) => (
              <Button key={status} variant={myRsvp?.status === status ? "default" : "outline"} onClick={() => handleRsvp(status)}>
                {status === "not_going" ? "Can't Go" : status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        )}

        <section>
          <h3 className="font-semibold mb-2">Going ({going.length})</h3>
          <div className="flex flex-wrap gap-2">
            {going.map((r) => (<Badge key={r.user.id} variant="secondary">{r.user.name}</Badge>))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
