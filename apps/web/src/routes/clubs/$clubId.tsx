import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { PhaseBadge } from "@/components/club/phase-badge";
import type { Phase } from "@/lib/phases";
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

type ClubEvent = {
  id: string; clubId: string; title: string; description: string | null;
  location: string | null; startsAt: string; endsAt: string | null;
};

type DiscussionThread = {
  id: string; title: string; createdAt: string;
  createdBy: { id: string; name: string; image: string | null };
};

type ThreadDetail = DiscussionThread & {
  comments: Array<{ id: string; text: string; createdAt: string; user: { id: string; name: string; image: string | null } }>;
};

type CurrentRound = {
  id: string;
  clubId: string;
  mediaItemId: string | null;
  order: number;
  eventId: string | null;
  phase: Phase;
  selectionMode: "admin_picks" | "rotation" | "vote";
  event: {
    id: string; title: string; description: string | null;
    location: string | null; startsAt: string; endsAt: string | null;
  } | null;
  media: {
    id: string; title: string; authorOrDirector: string | null;
    coverUrl: string | null; year: number | null; pageCount: number | null;
  } | null;
  progress: Array<{
    status: string; currentPage: number | null;
    user: { id: string; name: string; image: string | null };
  }>;
  pacing: {
    currentPage: number; totalPages: number; pagesRemaining: number;
    daysRemaining: number; pagesPerDay: number; aheadBehindDays: number;
  } | null;
};

export const Route = createFileRoute("/clubs/$clubId")({ component: ClubDetailPage });

function ClubDetailPage() {
  const { clubId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);

  // Add to Schedule dialog state
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [addingToSchedule, setAddingToSchedule] = useState(false);

  // Discussion state
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState("");
  const [commentText, setCommentText] = useState("");

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

  const { data: club, isLoading: clubLoading } = useQuery({
    queryKey: ["club", clubId],
    queryFn: () => api<Club>(`/api/clubs/${clubId}`),
  });

  const { data: schedule = [] } = useQuery({
    queryKey: ["club-schedule", clubId],
    queryFn: () => api<ScheduleItem[]>(`/api/clubs/${clubId}/schedule`),
  });

  const { data: clubEvents = [] } = useQuery({
    queryKey: ["club-events", clubId],
    queryFn: () => api<ClubEvent[]>(`/api/clubs/${clubId}/events`),
  });

  const { data: discussions = [] } = useQuery({
    queryKey: ["club-discussions", clubId],
    queryFn: () => api<DiscussionThread[]>(`/api/clubs/${clubId}/discussions`),
  });

  const { data: currentRound } = useQuery({
    queryKey: ["club-round", clubId],
    queryFn: () => api<CurrentRound>(`/api/clubs/${clubId}/rounds/current`),
  });

  const { data: threadDetail } = useQuery({
    queryKey: ["discussion", expandedThread],
    queryFn: () => api<ThreadDetail>(`/api/discussions/${expandedThread}`),
    enabled: !!expandedThread,
  });

  const now = new Date();
  const upcomingEvents = clubEvents.filter((e) => new Date(e.startsAt) >= now);
  const pastEvents = clubEvents.filter((e) => new Date(e.startsAt) < now);

  const isAdmin = club?.members.some(
    (m) => m.user.id === session?.user?.id && m.role === "admin",
  );

  if (clubLoading || !club) return <p className="text-muted-foreground py-12 text-center">Laster...</p>;

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
          mediaType: club!.mediaType,
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
      queryClient.invalidateQueries({ queryKey: ["club-schedule", clubId] });
      setShowAddSchedule(false);
    } catch (err) {
      console.error("Failed to add to schedule:", err);
      alert("Kunne ikke legge til i programmet. Prøv igjen.");
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
      queryClient.invalidateQueries({ queryKey: ["club-events", clubId] });
      // If there's an active round without an event, link it
      if (currentRound?.phase === "active" && !currentRound.eventId) {
        queryClient.invalidateQueries({ queryKey: ["club-round", clubId] });
      }
      navigate({ to: "/events/$eventId", params: { eventId: event.id } });
    } catch (err) {
      setEventError(err instanceof Error ? err.message : "Kunne ikke opprette arrangement");
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

  async function handleCreateDiscussion(e: React.FormEvent) {
    e.preventDefault();
    if (!newDiscussionTitle.trim()) return;
    await api(`/api/clubs/${clubId}/discussions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newDiscussionTitle }),
    });
    queryClient.invalidateQueries({ queryKey: ["club-discussions", clubId] });
    setNewDiscussionTitle("");
    setShowNewDiscussion(false);
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !expandedThread) return;
    await api(`/api/discussions/${expandedThread}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: commentText }),
    });
    queryClient.invalidateQueries({ queryKey: ["discussion", expandedThread] });
    setCommentText("");
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
            <Badge variant="secondary">{club.mediaType === "book" ? "Bokklubb" : "Filmklubb"}</Badge>
            <Badge variant="outline">{club.members.length} medlemmer</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link to="/clubs/$clubId/settings" params={{ clubId }}>
              <Button variant="outline" size="icon" aria-label="Innstillinger">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              </Button>
            </Link>
          )}
          {isAdmin && (
            <Button variant="outline" onClick={() => setShowCreateEvent(true)}>
              Opprett arrangement
            </Button>
          )}
          <Button variant="outline" onClick={copyInviteLink}>{copied ? "Kopiert!" : "Kopier invitasjonslenke"}</Button>
        </div>
      </div>

      {/* Current Round / Phase */}
      {currentRound?.phase && currentRound.phase !== "completed" && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <PhaseBadge phase={currentRound.phase} />
            <span className="text-sm text-muted-foreground">Runde {currentRound.order}</span>
          </div>

          {/* SELECTION phase */}
          {currentRound.phase === "selection" && (
            <div>
              <h3 className="font-semibold mb-2">Velg neste {club.mediaType === "book" ? "bok" : "film"}</h3>
              {isAdmin && currentRound.selectionMode === "admin_picks" && (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Søk og velg hva klubben skal {club.mediaType === "book" ? "lese" : "se"} neste gang.
                  </p>
                  <MediaSearch mediaType={club.mediaType} onSelect={async (result) => {
                    const media = await api<{ id: string }>("/api/media", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ...result, mediaType: club.mediaType }),
                    });
                    await api(`/api/clubs/${clubId}/rounds/current/select`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ mediaItemId: media.id }),
                    });
                    queryClient.invalidateQueries({ queryKey: ["club-round", clubId] });
                  }} />
                </div>
              )}
              {!isAdmin && (
                <p className="text-sm text-muted-foreground">Venter på at admin velger...</p>
              )}
            </div>
          )}

          {/* ACTIVE phase */}
          {currentRound.phase === "active" && currentRound.media && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                {currentRound.media.coverUrl && (
                  <div className="w-20 aspect-[2/3] overflow-hidden rounded-lg bg-muted shrink-0">
                    <img src={currentRound.media.coverUrl} alt={currentRound.media.title} className="h-full w-full object-cover" />
                  </div>
                )}
                <div>
                  <Link to="/media/$mediaId" params={{ mediaId: currentRound.media.id }}>
                    <h3 className="font-semibold hover:underline">{currentRound.media.title}</h3>
                  </Link>
                  {currentRound.media.authorOrDirector && (
                    <p className="text-sm text-muted-foreground">{currentRound.media.authorOrDirector}</p>
                  )}
                  {currentRound.event && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Arrangement: {new Date(currentRound.event.startsAt).toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })}
                      {currentRound.event.location && ` · ${currentRound.event.location}`}
                    </p>
                  )}
                </div>
              </div>
              {currentRound.pacing && (
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-sm font-medium">
                    {currentRound.pacing.pagesPerDay} sider/dag for å rekke det
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Side {currentRound.pacing.currentPage} av {currentRound.pacing.totalPages}
                    {currentRound.pacing.aheadBehindDays > 0 && ` · ${currentRound.pacing.aheadBehindDays} dager foran`}
                    {currentRound.pacing.aheadBehindDays < 0 && ` · ${Math.abs(currentRound.pacing.aheadBehindDays)} dager bak`}
                  </p>
                </div>
              )}
              {!currentRound.event && isAdmin && (
                <Button variant="outline" size="sm" onClick={() => setShowCreateEvent(true)}>
                  Planlegg arrangement
                </Button>
              )}
            </div>
          )}

          {/* EVENT phase */}
          {currentRound.phase === "event" && currentRound.event && (
            <div>
              <h3 className="font-semibold mb-2">Arrangement i dag!</h3>
              <p className="text-sm">
                {new Date(currentRound.event.startsAt).toLocaleTimeString("nb-NO", { hour: "numeric", minute: "2-digit" })}
                {currentRound.event.location && ` · ${currentRound.event.location}`}
              </p>
              <Link to="/events/$eventId" params={{ eventId: currentRound.event.id }}>
                <Button variant="outline" size="sm" className="mt-3">Se arrangement</Button>
              </Link>
            </div>
          )}

          {/* REVIEW phase */}
          {currentRound.phase === "review" && currentRound.media && (
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold">Hva syntes du om {currentRound.media.title}?</h3>
              <p className="text-sm text-muted-foreground">
                Del din vurdering med klubben.
              </p>
              <Link to="/media/$mediaId" params={{ mediaId: currentRound.media.id }}>
                <Button variant="outline" size="sm">Skriv anmeldelse</Button>
              </Link>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={async () => {
                  await api(`/api/clubs/${clubId}/rounds/current/advance`, { method: "POST" });
                  queryClient.invalidateQueries({ queryKey: ["club-round", clubId] });
                }}>
                  Avslutt runde og start neste
                </Button>
              )}
            </div>
          )}
        </section>
      )}

      {/* Start new round button (when no active round) */}
      {isAdmin && (!currentRound?.phase || currentRound.phase === "completed") && (
        <Button onClick={async () => {
          await api(`/api/clubs/${clubId}/rounds`, { method: "POST" });
          queryClient.invalidateQueries({ queryKey: ["club-round", clubId] });
        }}>
          Start ny runde
        </Button>
      )}

      {/* Schedule - cover grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Program</h2>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setShowAddSchedule(true)}>
              Legg til i programmet
            </Button>
          )}
        </div>
        {schedule.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            Ingen elementer i programmet ennå.
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
                        <Badge className="text-xs shadow-sm">Nå</Badge>
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

      {/* Events */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Arrangementer</h2>
        {clubEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen arrangementer ennå.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {upcomingEvents.map((evt) => {
              const d = new Date(evt.startsAt);
              return (
                <Link key={evt.id} to="/events/$eventId" params={{ eventId: evt.id }}>
                  <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/20 hover:shadow">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary shrink-0">
                      <span className="text-xs font-medium uppercase leading-none">{d.toLocaleDateString("nb-NO", { month: "short" })}</span>
                      <span className="text-lg font-bold leading-tight">{d.getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{evt.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {d.toLocaleTimeString("nb-NO", { hour: "numeric", minute: "2-digit" })}
                        {evt.location && ` · ${evt.location}`}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
            {pastEvents.length > 0 && (
              <p className="text-sm text-muted-foreground">+ {pastEvents.length} tidligere {pastEvents.length === 1 ? "arrangement" : "arrangementer"}</p>
            )}
          </div>
        )}
      </section>

      {/* Members */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Medlemmer</h2>
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

      {/* Discussions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Diskusjoner</h2>
          {session?.user && (
            <Button variant="outline" size="sm" onClick={() => setShowNewDiscussion(true)}>
              Ny diskusjon
            </Button>
          )}
        </div>

        {showNewDiscussion && (
          <form onSubmit={handleCreateDiscussion} className="flex gap-2 mb-4">
            <Input
              placeholder="Diskusjonstema..."
              value={newDiscussionTitle}
              onChange={(e) => setNewDiscussionTitle(e.target.value)}
              autoFocus
            />
            <Button type="submit" size="sm" disabled={!newDiscussionTitle.trim()}>
              Opprett
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { setShowNewDiscussion(false); setNewDiscussionTitle(""); }}>
              Avbryt
            </Button>
          </form>
        )}

        {discussions.length === 0 && !showNewDiscussion ? (
          <p className="text-sm text-muted-foreground">Ingen diskusjoner ennå. Start en ny!</p>
        ) : (
          <div className="flex flex-col gap-2">
            {discussions.map((thread) => (
              <div key={thread.id}>
                <button
                  onClick={() => setExpandedThread(expandedThread === thread.id ? null : thread.id)}
                  className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm text-left transition-colors hover:border-primary/20 hover:shadow"
                >
                  {thread.createdBy.image ? (
                    <img src={thread.createdBy.image} alt={thread.createdBy.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="flex w-8 h-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary shrink-0">
                      {thread.createdBy.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{thread.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {thread.createdBy.name} · {new Date(thread.createdAt).toLocaleDateString("nb-NO")}
                    </p>
                  </div>
                </button>

                {expandedThread === thread.id && threadDetail && (
                  <div className="ml-11 mt-2 flex flex-col gap-3 pb-2">
                    {threadDetail.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        {comment.user.image ? (
                          <img src={comment.user.image} alt={comment.user.name} className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" />
                        ) : (
                          <div className="flex w-6 h-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary shrink-0 mt-0.5">
                            {comment.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">{comment.user.name}</span>{" "}
                            <span className="text-muted-foreground text-xs">
                              {new Date(comment.createdAt).toLocaleDateString("nb-NO")}
                            </span>
                          </p>
                          <p className="text-sm">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                    {threadDetail.comments.length === 0 && (
                      <p className="text-sm text-muted-foreground">Ingen kommentarer ennå.</p>
                    )}
                    {session?.user && (
                      <form onSubmit={handleAddComment} className="flex gap-2">
                        <Input
                          placeholder="Skriv en kommentar..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="text-sm"
                        />
                        <Button type="submit" size="sm" disabled={!commentText.trim()}>
                          Send
                        </Button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add to Schedule Dialog */}
      <AlertDialog open={showAddSchedule} onOpenChange={setShowAddSchedule}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Legg til i programmet</AlertDialogTitle>
            <AlertDialogDescription>
              Søk etter {club.mediaType === "book" ? "en bok" : "en film"} å legge til i klubbens program.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[50vh] overflow-y-auto -mx-6 px-6">
            {addingToSchedule ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Legger til...</p>
            ) : (
              <MediaSearch mediaType={club.mediaType} onSelect={handleAddToSchedule} />
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
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
            <AlertDialogTitle>Opprett arrangement</AlertDialogTitle>
            <AlertDialogDescription>
              Planlegg et nytt arrangement for denne klubben.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={handleCreateEvent} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-title">Tittel</Label>
              <Input
                id="event-title"
                required
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="f.eks. Månedlig bokdiskusjon"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-description">Beskrivelse</Label>
              <Textarea
                id="event-description"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Hva skal dere diskutere?"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-location">Sted</Label>
              <Input
                id="event-location"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="f.eks. Deichman Bjørvika, rom 3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-starts">Starter</Label>
                <Input
                  id="event-starts"
                  type="datetime-local"
                  required
                  value={eventStartsAt}
                  onChange={(e) => setEventStartsAt(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-ends">Slutter</Label>
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
                <Label>Koble til programelement</Label>
                <Select value={eventScheduleItemId} onValueChange={(v) => setEventScheduleItemId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ingen (valgfritt)" />
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
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <Button type="submit" disabled={eventLoading}>
                {eventLoading ? "Oppretter..." : "Opprett arrangement"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
