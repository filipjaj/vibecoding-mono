import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [shelf, setShelf] = useState<ShelfItem[]>([]);

  useEffect(() => {
    api<UserProfile>(`/api/users/${userId}`).then(setProfile).catch(console.error);
    api<ShelfItem[]>(`/api/users/${userId}/shelf`).then(setShelf).catch(console.error);
  }, [userId]);

  if (!profile) return <AppShell><p>Loading...</p></AppShell>;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {profile.image ? <img src={profile.image} alt={profile.name} className="w-16 h-16 rounded-full" /> : <div className="w-16 h-16 rounded-full bg-muted" />}
          <div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">{profile.clubs.length} clubs · {profile.reviewCount} reviews</p>
          </div>
        </div>

        <section>
          <h2 className="text-xl font-semibold mb-3">Clubs</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.clubs.map(({ club }) => (
              <Link key={club.id} to="/clubs/$clubId" params={{ clubId: club.id }}>
                <Card className="p-3 hover:bg-accent transition-colors">
                  <p className="font-medium">{club.name}</p>
                  <Badge variant="outline" className="mt-1">{club.mediaType === "book" ? "Book" : "Film"}</Badge>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Shelf</h2>
          {shelf.length === 0 ? (
            <p className="text-muted-foreground">Nothing on the shelf yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {shelf.map((item) => (
                <Link key={item.media.id} to="/media/$mediaId" params={{ mediaId: item.media.id }}>
                  <Card className="p-3 hover:bg-accent transition-colors">
                    <div className="flex gap-3">
                      {item.media.coverUrl && <img src={item.media.coverUrl} alt={item.media.title} className="w-10 h-14 object-cover rounded" />}
                      <div>
                        <p className="font-medium text-sm">{item.media.title}</p>
                        <Badge variant="outline" className="mt-1 text-xs">{item.status}</Badge>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
