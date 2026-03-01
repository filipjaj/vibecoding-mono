import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type UserProfile = {
  id: string; name: string; image: string | null; createdAt: string;
  clubs: Array<{ club: { id: string; name: string; mediaType: string }; role: string }>;
  reviewCount: number;
};

type ShelfItem = {
  status: string; addedAt: string;
  media: { id: string; title: string; authorOrDirector: string | null; coverUrl: string | null; year: number | null; mediaType: string };
};

export const Route = createFileRoute("/users/$userId")({ component: UserProfilePage });

function UserProfilePage() {
  const { userId } = Route.useParams();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => api<UserProfile>(`/api/users/${userId}`),
  });

  const { data: shelf = [] } = useQuery({
    queryKey: ["user-shelf", userId],
    queryFn: () => api<ShelfItem[]>(`/api/users/${userId}/shelf`),
  });

  if (profileLoading || !profile) return <p className="text-muted-foreground py-12 text-center">Laster...</p>;

  return (
    <div className="flex flex-col gap-8">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        {profile.image ? (
          <img src={profile.image} alt={profile.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-border" />
        ) : (
          <div className="flex w-16 h-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {profile.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">{profile.clubs.length} klubber · {profile.reviewCount} anmeldelser</p>
        </div>
      </div>

      {/* Clubs */}
      {profile.clubs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Klubber</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profile.clubs.map(({ club }) => (
              <Link key={club.id} to="/clubs/$clubId" params={{ clubId: club.id }}>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {club.mediaType === "book" ? "B" : "F"}
                    </div>
                    <div>
                      <p className="font-medium">{club.name}</p>
                      <p className="text-xs text-muted-foreground">{club.mediaType === "book" ? "Bokklubb" : "Filmklubb"}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Shelf - cover grid */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Hylle</h2>
        {shelf.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingenting på hylla ennå.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {shelf.map((item) => (
              <Link key={item.media.id} to="/media/$mediaId" params={{ mediaId: item.media.id }}>
                <div className="group flex flex-col gap-2">
                  <div className="aspect-[2/3] overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-black/5 transition-shadow group-hover:shadow-md">
                    {item.media.coverUrl ? (
                      <img src={item.media.coverUrl} alt={item.media.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-3 text-xs text-muted-foreground text-center">{item.media.title}</div>
                    )}
                  </div>
                  <p className="text-sm font-medium leading-tight truncate">{item.media.title}</p>
                  {item.media.authorOrDirector && <p className="text-xs text-muted-foreground truncate">{item.media.authorOrDirector}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
