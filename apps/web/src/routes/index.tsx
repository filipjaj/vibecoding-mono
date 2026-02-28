import { createFileRoute, Link } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const { data: session } = useSession();
  if (!session?.user) return <SignedOutHome />;
  return <SignedInDashboard userId={session.user.id} name={session.user.name} />;
}

function SignedOutHome() {
  return (
    <div className="-mx-4 -mt-8 -mb-8 sm:-mx-6 sm:-mb-8">
      {/* Hero */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 text-center">
        {/* Gradient blobs */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[100px]"
          style={{ animation: "gradient-drift 12s ease-in-out infinite" }}
        />
        <div
          className="pointer-events-none absolute left-1/3 top-1/3 h-[300px] w-[300px] rounded-full bg-chart-3/20 blur-[80px]"
          style={{ animation: "gradient-drift 15s ease-in-out infinite reverse" }}
        />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
            Kulturen er bedre sammen.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Shelf gjør det enkelt å starte en bokklubb eller filmklubb med
            vennene dine — og faktisk holde den i live.
          </p>
          <Button
            size="lg"
            className="mt-4 px-8 text-base"
            render={<Link to="/login" />}
          >
            Kom i gang — det er gratis
          </Button>
        </div>
      </section>

      {/* Pain */}
      <section className="bg-foreground px-4 py-20 text-center text-background sm:py-28">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 sm:gap-6">
          <p className="text-xl font-medium sm:text-2xl">Du leser alene.</p>
          <p className="text-xl font-medium sm:text-2xl">Du glemmer å møtes.</p>
          <p className="text-xl font-medium sm:text-2xl">
            Gruppechatten drukner i memes.
          </p>
        </div>
      </section>

      {/* Vision — 4 pillars */}
      <section className="px-4 py-20 sm:py-28">
        <div className="mx-auto grid max-w-4xl gap-12 sm:grid-cols-2 sm:gap-16">
          {[
            {
              color: "bg-chart-1",
              title: "Start en klubb",
              desc: "Inviter vennene dine med en lenke. Ferdig.",
            },
            {
              color: "bg-chart-2",
              title: "Lag en leseplan",
              desc: "Velg bøker eller filmer, sett datoer, hold oversikten.",
            },
            {
              color: "bg-chart-4",
              title: "Del meningene dine",
              desc: "Gi terningkast, skriv anmeldelser, se hva vennene synes.",
            },
            {
              color: "bg-chart-3",
              title: "Møt opp",
              desc: "Planlegg neste treff, send påmeldinger, hold klubben i live.",
            },
          ].map((pillar) => (
            <div key={pillar.title} className="flex flex-col gap-2">
              <div className={`h-2 w-2 rounded-full ${pillar.color}`} />
              <h3 className="text-lg font-semibold">{pillar.title}</h3>
              <p className="text-muted-foreground">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/60 px-4 py-20 sm:py-28">
        <div className="mx-auto grid max-w-5xl gap-12 sm:grid-cols-3 sm:gap-8">
          {[
            {
              step: "01",
              title: "Opprett en klubb",
              desc: "Velg om det er bok eller film. Gi den et navn.",
            },
            {
              step: "02",
              title: "Inviter vennene",
              desc: "Del invitasjonslenken. De er med på sekunder.",
            },
            {
              step: "03",
              title: "Begynn reisen",
              desc: "Legg til bøker, sett opp møter, og nyt kulturen sammen.",
            },
          ].map((item) => (
            <div key={item.step} className="flex flex-col gap-2">
              <span className="text-6xl font-bold text-primary/10">
                {item.step}
              </span>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden px-4 py-24 text-center sm:py-32">
        {/* Gradient blobs — bookend with hero */}
        <div
          className="pointer-events-none absolute right-1/3 top-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-primary/15 blur-[100px]"
          style={{ animation: "gradient-drift 14s ease-in-out infinite" }}
        />
        <div
          className="pointer-events-none absolute left-1/4 bottom-1/4 h-[250px] w-[250px] rounded-full bg-chart-3/15 blur-[80px]"
          style={{ animation: "gradient-drift 18s ease-in-out infinite reverse" }}
        />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-5xl">
            Din neste bokklubb starter her.
          </h2>
          <p className="mx-auto max-w-md text-muted-foreground sm:text-lg">
            Shelf er gratis. Ingen kredittkort. Bare kultur og gode samtaler.
          </p>
          <Button
            size="lg"
            className="mt-4 px-8 text-base"
            render={<Link to="/login" />}
          >
            Opprett din første klubb
          </Button>
        </div>
      </section>
    </div>
  );
}

function SignedInDashboard({ userId, name }: { userId: string; name: string }) {
  const feedQuery = useQuery({
    queryKey: ["feed"],
    queryFn: () => api<FeedItem[]>("/api/feed"),
  });
  const shelfQuery = useQuery({
    queryKey: ["shelf", userId],
    queryFn: () => api<ShelfItem[]>(`/api/users/${userId}/shelf`),
  });

  const currentlyReading = shelfQuery.data?.filter((i) => i.status === "reading") ?? [];
  const wantToRead = shelfQuery.data?.filter((i) => i.status === "want") ?? [];

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {name}</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in your clubs.</p>
      </div>

      {currentlyReading.length > 0 && (
        <CoverSection title="Currently Reading" items={currentlyReading} />
      )}
      {wantToRead.length > 0 && (
        <CoverSection title="Want to Read" items={wantToRead} />
      )}

      {shelfQuery.data && shelfQuery.data.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground mb-3">Your shelf is empty. Join a club to get started.</p>
          <Button variant="outline" render={<Link to="/clubs" />}>Browse Clubs</Button>
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4">Activity</h2>
        {feedQuery.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {feedQuery.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        )}
        {feedQuery.data && feedQuery.data.length > 0 && (
          <div className="space-y-1">
            {feedQuery.data.slice(0, 10).map((event) => (
              <div key={event.id} className="flex items-start gap-3 rounded-xl px-4 py-3 hover:bg-accent/50 transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary mt-0.5">
                  {event.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm">
                    <span className="font-medium">{event.user.name}</span>{" "}
                    <span className="text-muted-foreground">{formatEventType(event.type)}</span>
                    {event.club && <span className="text-muted-foreground"> in <span className="font-medium text-foreground">{event.club.name}</span></span>}
                  </p>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(event.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CoverSection({ title, items }: { title: string; items: ShelfItem[] }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link to="/shelf" className="text-sm text-primary font-medium hover:underline underline-offset-4">View all</Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.slice(0, 5).map((item, i) => item.media && (
          <Link key={i} to="/media/$mediaId" params={{ mediaId: item.media.id }}>
            <div className="group flex flex-col gap-2">
              <div className="aspect-[2/3] overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-black/5 transition-shadow group-hover:shadow-md">
                {item.media.coverUrl ? (
                  <img src={item.media.coverUrl} alt={item.media.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground p-2 text-center">{item.media.title}</div>
                )}
              </div>
              <p className="text-sm font-medium leading-tight truncate">{item.media.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function formatEventType(type: string): string {
  const map: Record<string, string> = {
    shelf_update: "updated their shelf", progress_update: "updated their progress",
    review_created: "wrote a review", club_created: "created a club", member_joined: "joined",
  };
  return map[type] ?? type.replace(/_/g, " ");
}

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface FeedItem {
  id: string; type: string; payload: unknown; createdAt: string;
  user: { id: string; name: string; image: string | null };
  club: { id: string; name: string } | null;
}
interface ShelfItem {
  status: string; addedAt: string;
  media: { id: string; title: string; mediaType: string; coverUrl?: string | null } | null;
}
