import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { MediaSearch } from "@/components/media/media-search";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";

type Club = {
  id: string; name: string; description: string | null; mediaType: "book" | "film";
  inviteCode: string; recurrenceRule: string | null;
  members: Array<{ user: { id: string; name: string; image: string | null }; role: string }>;
};

type ScheduleItem = {
  id: string; order: number; scheduledDate: string | null; status: string;
  media: { id: string; title: string; authorOrDirector: string | null; coverUrl: string | null; year: number | null };
};

export const Route = createFileRoute("/clubs/$clubId")({ component: ClubDetailPage });

function ClubDetailPage() {
  const { clubId } = Route.useParams();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [club, setClub] = useState<Club | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [copied, setCopied] = useState(false);

  // Add to Schedule dialog state
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [addingToSchedule, setAddingToSchedule] = useState(false);

  // Create Event dialog state
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventStartsAt, setEventStartsAt] = useState("");
  const [eventEndsAt, setEventEndsAt] = useState("");
  const [eventScheduleItemId, setEventScheduleItemId] = useState("");
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState("");

  const fetchSchedule = useCallback(() => {
    api<ScheduleItem[]>(`/api/clubs/${clubId}/schedule`).then(setSchedule).catch(console.error);
  }, [clubId]);

  useEffect(() => {
    api<Club>(`/api/clubs/${clubId}`).then(setClub).catch(console.error);
    fetchSchedule();
  }, [clubId, fetchSchedule]);

  const isAdmin = club?.members.some(
    (m) => m.user.id === session?.user?.id && m.role === "admin",
  );

  if (!club) return <p className="text-muted-foreground py-12 text-center">Loading...</p>;

  function copyInviteLink() {
    navigator.clipboard.writeText(`${window.location.origin}/join/${club!.inviteCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAddToSchedule(searchResult: {
    externalId: string;
    title: string;
    authorOrDirector: string | null;
    coverUrl: string | null;
    year: number | null;
    description: string | null;
  }) {
    setAddingToSchedule(true);
    try {
      const media = await api<{ id: string }>("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalId: searchResult.externalId,
          type: club!.mediaType,
          title: searchResult.title,
          authorOrDirector: searchResult.authorOrDirector,
          coverUrl: searchResult.coverUrl,
          year: searchResult.year,
          description: searchResult.description,
        }),
      });
      await api(`/api/clubs/${clubId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaItemId: media.id }),
      });
      fetchSchedule();
      setShowAddSchedule(false);
    } catch (err) {
      console.error("Failed to add to schedule:", err);
    } finally {
      setAddingToSchedule(false);
    }
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setEventLoading(true);
    setEventError("");
    try {
      const event = await api<{ id: string }>(`/api/clubs/${clubId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventTitle,
          startsAt: new Date(eventStartsAt).toISOString(),
          ...(eventDescription && { description: eventDescription }),
          ...(eventLocation && { location: eventLocation }),
          ...(eventEndsAt && { endsAt: new Date(eventEndsAt).toISOString() }),
          ...(eventScheduleItemId && { scheduleItemId: eventScheduleItemId }),
        }),
      });
      navigate({ to: "/events/$eventId", params: { eventId: event.id } });
    } catch (err) {
      setEventError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setEventLoading(false);
    }
  }

  function resetEventForm() {
    setEventTitle("");
    setEventDescription("");
    setEventLocation("");
    setEventStartsAt("");
    setEventEndsAt("");
    setEventScheduleItemId("");
    setEventError("");
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
              {club.mediaType === "book" ? "B" : "F"}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{club.name}</h1>
          </div>
          {club.description && <p className="text-muted-foreground max-w-lg">{club.description}</p>}
          <div className="flex gap-2 mt-3">
            <Badge variant="secondary">{club.mediaType === "book" ? "Book Club" : "Film Club"}</Badge>
            <Badge variant="outline">{club.members.length} members</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => setShowCreateEvent(true)}>
              Create Event
            </Button>
          )}
          <Button variant="outline" onClick={copyInviteLink}>{copied ? "Copied!" : "Copy Invite Link"}</Button>
        </div>
      </div>

      {/* Schedule - cover grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Schedule</h2>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setShowAddSchedule(true)}>
              Add to Schedule
            </Button>
          )}
        </div>
        {schedule.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            No items scheduled yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {schedule.map((item) => (
              <Link key={item.id} to="/media/$mediaId" params={{ mediaId: item.media.id }}>
                <div className="group flex flex-col gap-2">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-black/5 transition-shadow group-hover:shadow-md">
                    {item.media.coverUrl ? (
                      <img src={item.media.coverUrl} alt={item.media.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-3 text-xs text-muted-foreground text-center">{item.media.title}</div>
                    )}
                    {item.status === "current" && (
                      <div className="absolute top-2 left-2">
                        <Badge className="text-xs shadow-sm">Current</Badge>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">{item.media.title}</p>
                    {item.media.authorOrDirector && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{item.media.authorOrDirector}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Members */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Members</h2>
        <div className="flex flex-wrap gap-2">
          {club.members.map((m) => (
            <Link key={m.user.id} to="/users/$userId" params={{ userId: m.user.id }}>
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm shadow-sm transition-colors hover:border-primary/20 hover:shadow">
                {m.user.image ? (
                  <img src={m.user.image} alt={m.user.name} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="flex w-6 h-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {m.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium">{m.user.name}</span>
                {m.role === "admin" && <Badge variant="secondary" className="text-xs">admin</Badge>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Add to Schedule Dialog */}
      <AlertDialog open={showAddSchedule} onOpenChange={setShowAddSchedule}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Add to Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Search for a {club.mediaType} to add to the club's schedule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {addingToSchedule ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Adding...</p>
          ) : (
            <MediaSearch mediaType={club.mediaType} onSelect={handleAddToSchedule} />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Event Dialog */}
      <AlertDialog
        open={showCreateEvent}
        onOpenChange={(open) => {
          setShowCreateEvent(open);
          if (!open) resetEventForm();
        }}
      >
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Create Event</AlertDialogTitle>
            <AlertDialogDescription>
              Schedule a new event for this club.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={handleCreateEvent} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                required
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g. Monthly Book Discussion"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="What will you discuss?"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="e.g. Central Library, Room 3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-starts">Starts at</Label>
                <Input
                  id="event-starts"
                  type="datetime-local"
                  required
                  value={eventStartsAt}
                  onChange={(e) => setEventStartsAt(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-ends">Ends at</Label>
                <Input
                  id="event-ends"
                  type="datetime-local"
                  value={eventEndsAt}
                  onChange={(e) => setEventEndsAt(e.target.value)}
                />
              </div>
            </div>
            {schedule.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label>Link to schedule item</Label>
                <Select value={eventScheduleItemId} onValueChange={(v) => setEventScheduleItemId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="None (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {schedule.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.media.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {eventError && (
              <p className="text-sm text-destructive">{eventError}</p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button type="submit" disabled={eventLoading}>
                {eventLoading ? "Creating..." : "Create Event"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
