import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/profile/$userId")({
  component: ProfilePage,
});

type UserProfile = {
  id: string;
  name: string;
  image: string | null;
  createdAt: string;
  clubs: Array<{
    club: { id: string; name: string; mediaType: string; coverImageUrl: string | null };
    role: string;
  }>;
  reviewCount: number;
};

type ShelfItem = {
  status: "want" | "reading" | "watched" | "finished";
  addedAt: string;
  media: {
    id: string;
    title: string;
    authorOrDirector: string | null;
    coverUrl: string | null;
    mediaType: "book" | "film";
    year: number | null;
  };
};

const shelfStatusLabels: Record<string, string> = {
  want: "Want",
  reading: "Reading",
  watched: "Watched",
  finished: "Finished",
};

const shelfStatusVariants: Record<string, "default" | "secondary" | "outline"> = {
  want: "outline",
  reading: "default",
  watched: "secondary",
  finished: "secondary",
};

function ProfilePage() {
  const { userId } = Route.useParams();
  const { data: session } = useSession();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => api<UserProfile>(`/api/users/${userId}`),
  });

  const { data: shelf, isLoading: shelfLoading } = useQuery({
    queryKey: ["user", userId, "shelf"],
    queryFn: () => api<ShelfItem[]>(`/api/users/${userId}/shelf`),
  });

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  const isOwnProfile = session?.user?.id === profile.id;

  const shelfByStatus = (shelf ?? []).reduce<Record<string, ShelfItem[]>>(
    (acc, item) => {
      if (!acc[item.status]) acc[item.status] = [];
      acc[item.status].push(item);
      return acc;
    },
    {}
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-6">
        {profile.image ? (
          <img
            src={profile.image}
            alt={profile.name}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-semibold text-muted-foreground">
            {profile.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">
            Joined {new Date(profile.createdAt).toLocaleDateString()} &middot;{" "}
            {profile.reviewCount} {profile.reviewCount === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Clubs */}
      {profile.clubs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Clubs</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.clubs.map(({ club, role }) => (
              <Card key={club.id} className="flex flex-row items-center gap-3 p-3">
                {club.coverImageUrl ? (
                  <img
                    src={club.coverImageUrl}
                    alt={club.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
                    {club.mediaType === "book" ? "B" : "F"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{club.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{role}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Shelf */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          {isOwnProfile ? "My Shelf" : `${profile.name}'s Shelf`}
        </h2>

        {shelfLoading ? (
          <p className="text-sm text-muted-foreground">Loading shelf...</p>
        ) : (shelf ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No items on the shelf yet.</p>
        ) : (
          <div className="space-y-6">
            {(["reading", "want", "watched", "finished"] as const).map((status) => {
              const items = shelfByStatus[status];
              if (!items || items.length === 0) return null;
              return (
                <div key={status}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    {shelfStatusLabels[status]} ({items.length})
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                      <Card key={item.media.id} className="overflow-hidden">
                        <div className="flex gap-3 p-3">
                          {item.media.coverUrl ? (
                            <img
                              src={item.media.coverUrl}
                              alt={item.media.title}
                              className="h-20 w-14 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="flex h-20 w-14 items-center justify-center rounded bg-muted text-xs text-muted-foreground flex-shrink-0">
                              {item.media.mediaType === "book" ? "Book" : "Film"}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <p className="font-medium text-sm leading-tight truncate">
                              {item.media.title}
                            </p>
                            {item.media.authorOrDirector && (
                              <p className="text-xs text-muted-foreground truncate">
                                {item.media.authorOrDirector}
                              </p>
                            )}
                            {item.media.year && (
                              <p className="text-xs text-muted-foreground">
                                {item.media.year}
                              </p>
                            )}
                            <div className="mt-auto pt-1">
                              <Badge variant={shelfStatusVariants[item.status]}>
                                {shelfStatusLabels[item.status]}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
