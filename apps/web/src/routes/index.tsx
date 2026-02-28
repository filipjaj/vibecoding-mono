import { createFileRoute, Link } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const COVERS = [
  { title: "Naiv. Super.", coverUrl: "https://covers.openlibrary.org/b/isbn/9788202166984-M.jpg", rotation: -5, top: "8%", left: "5%", size: "w-20 h-28 sm:w-24 sm:h-34", duration: 14, mobileHidden: false },
  { title: "Normal People", coverUrl: "https://image.tmdb.org/t/p/w185/c4mk4EQVIM11yd3W43DDdqDazDU.jpg", rotation: 4, top: "15%", right: "8%", size: "w-18 h-26 sm:w-22 sm:h-32", duration: 17, mobileHidden: false },
  { title: "Parasite", coverUrl: "https://image.tmdb.org/t/p/w185/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", rotation: -3, top: "55%", left: "8%", size: "w-16 h-24 sm:w-20 sm:h-28", duration: 12, mobileHidden: false },
  { title: "Spirited Away", coverUrl: "https://image.tmdb.org/t/p/w185/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", rotation: 7, top: "60%", right: "6%", size: "w-18 h-26 sm:w-24 sm:h-34", duration: 19, mobileHidden: false },
  { title: "Doppler", coverUrl: "https://covers.openlibrary.org/b/isbn/9788202245351-M.jpg", rotation: -8, top: "35%", left: "3%", size: "w-14 h-20 sm:w-18 sm:h-26", duration: 16, mobileHidden: false },
  { title: "Amélie", coverUrl: "https://image.tmdb.org/t/p/w185/nSxDa3M9aMvGVLoItzWTepQ5h5d.jpg", rotation: 3, top: "40%", right: "4%", size: "w-16 h-24 sm:w-20 sm:h-28", duration: 13, mobileHidden: true },
  { title: "Drive", coverUrl: "https://image.tmdb.org/t/p/w185/602vevIURmpDfzbnv5Ubi6wIkQm.jpg", rotation: -4, top: "75%", left: "15%", size: "w-14 h-20 sm:w-18 sm:h-26", duration: 20, mobileHidden: true },
  { title: "In the Mood for Love", coverUrl: "https://image.tmdb.org/t/p/w185/iYypPT4bhqXfq1b6EnmxvRt6b2Y.jpg", rotation: 6, top: "78%", right: "12%", size: "w-14 h-20 sm:w-16 sm:h-24", duration: 15, mobileHidden: true },
];

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const { data: session } = useSession();
  if (!session?.user) return <SignedOutHome />;
  return <SignedInDashboard userId={session.user.id} name={session.user.name} />;
}

function SignedOutHome() {
  const painRef = useScrollReveal();
  const pillarsRef = useScrollReveal();
  const stepsRef = useScrollReveal();

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

        {/* Floating cover art collage */}
        {COVERS.map((cover) => (
          <div
            key={cover.title}
            className={`pointer-events-none absolute ${cover.size} ${cover.mobileHidden ? "hidden sm:block" : "block"} overflow-hidden rounded-lg shadow-md opacity-[0.18]`}
            style={{
              top: cover.top,
              left: cover.left,
              right: cover.right,
              transform: `rotate(${cover.rotation}deg)`,
              animation: `gradient-drift ${cover.duration}s ease-in-out infinite`,
            }}
          >
            <img
              src={cover.coverUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        ))}

        <div className="hero-fade-in relative z-10 flex flex-col items-center gap-6">
          <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
            Kulturen er bedre sammen.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Start en bok- eller filmklubb med folkene som betyr noe.
            Shelf holder den i live.
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
      <section
        ref={painRef}
        className="bg-foreground px-4 py-20 text-center text-background sm:py-28"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-10 sm:gap-14">
          {/* Beat 1 — Film watcher */}
          <div className="reveal flex flex-col gap-1">
            <p className="text-lg italic text-background/70 sm:text-xl">
              Du har akkurat sett en film som forandret alt.
            </p>
            <p
              className="reveal text-lg italic text-background/70 sm:text-xl"
              data-delay="100"
            >
              Du lukker laptopen.
            </p>
            <p
              className="reveal text-lg italic text-background/70 sm:text-xl"
              data-delay="200"
            >
              Ingen å snakke med.
            </p>
          </div>

          {/* Beat 2 — Reader */}
          <div className="reveal flex flex-col gap-1">
            <p className="text-lg italic text-background/70 sm:text-xl">
              Bokhyllen din er full av historier du aldri har delt.
            </p>
            <p
              className="reveal text-lg italic text-background/70 sm:text-xl"
              data-delay="100"
            >
              Du har meninger. Du har terningkast i hodet.
            </p>
            <p
              className="reveal text-lg italic text-background/70 sm:text-xl"
              data-delay="200"
            >
              Men ingen spør.
            </p>
          </div>

          {/* Beat 3 — Punchy lines */}
          <div className="flex flex-col gap-4 sm:gap-6">
            <p className="reveal text-xl font-bold sm:text-2xl">
              Du leser alene.
            </p>
            <p
              className="reveal text-xl font-bold sm:text-2xl"
              data-delay="100"
            >
              Du glemmer å møtes.
            </p>
            <p
              className="reveal text-xl font-bold sm:text-2xl"
              data-delay="200"
            >
              Gruppechatten drukner i memes.
            </p>
          </div>

          {/* Beat 4 — The turn */}
          <p className="reveal text-lg italic text-background/80 sm:text-xl">
            Det trenger ikke være sånn.
          </p>
        </div>
      </section>

      {/* Vision — 4 pillars */}
      <section ref={pillarsRef} className="px-4 py-20 sm:py-28">
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
          ].map((pillar, i) => (
            <div
              key={pillar.title}
              className="reveal flex flex-col gap-2"
              data-delay={String(i * 100)}
            >
              <div className={`h-2 w-2 rounded-full ${pillar.color}`} />
              <h3 className="text-lg font-semibold">{pillar.title}</h3>
              <p className="text-muted-foreground">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        ref={stepsRef}
        className="border-t border-border/60 px-4 py-20 sm:py-28"
      >
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
          ].map((item, i) => (
            <div
              key={item.step}
              className="reveal flex flex-col gap-2"
              data-delay={String(i * 100)}
            >
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
        {/* Gradient blobs */}
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
            Du trenger ikke lese alene.
          </h2>
          <p className="mx-auto max-w-md text-muted-foreground sm:text-lg">
            Bøker og filmer er bedre sammen. 2026 er ditt år.
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
