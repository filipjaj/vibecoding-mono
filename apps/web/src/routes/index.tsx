import { createFileRoute, Link } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const { data: session } = useSession();

  if (!session?.user) {
    return <SignedOutHome />;
  }

  return <SignedInDashboard userId={session.user.id} name={session.user.name} />;
}

function SignedOutHome() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-20 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight">
          Track what you read, watch & listen to
        </h1>
        <p className="mx-auto max-w-lg text-lg text-muted-foreground">
          Shelf helps you and your clubs keep track of books, movies, podcasts
          and more — together.
        </p>
      </div>
      <Button size="lg" render={<Link to="/login" />}>
        Get started
      </Button>
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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {name}
        </h1>
        <p className="text-muted-foreground">
          Here is what is happening in your clubs.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Current shelf summary */}
        <Card>
          <CardHeader>
            <CardTitle>My Shelf</CardTitle>
            <CardDescription>Your current reading & watching list</CardDescription>
          </CardHeader>
          <CardContent>
            {shelfQuery.isLoading && (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
            {shelfQuery.data && shelfQuery.data.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing on your shelf yet.{" "}
                <Link to="/clubs" className="text-primary underline-offset-4 hover:underline">
                  Join a club
                </Link>{" "}
                to get started.
              </p>
            )}
            {shelfQuery.data && shelfQuery.data.length > 0 && (
              <ul className="flex flex-col gap-2">
                {shelfQuery.data.slice(0, 5).map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate font-medium">
                      {item.media?.title ?? "Untitled"}
                    </span>
                    <Badge variant="secondary">{item.status}</Badge>
                  </li>
                ))}
                {shelfQuery.data.length > 5 && (
                  <li>
                    <Link
                      to="/shelf"
                      className="text-sm text-primary underline-offset-4 hover:underline"
                    >
                      View all ({shelfQuery.data.length})
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>Recent updates from your clubs</CardDescription>
          </CardHeader>
          <CardContent>
            {feedQuery.isLoading && (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
            {feedQuery.data && feedQuery.data.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No activity yet. Updates from your clubs will show up here.
              </p>
            )}
            {feedQuery.data && feedQuery.data.length > 0 && (
              <ul className="flex flex-col gap-3">
                {feedQuery.data.slice(0, 8).map((event) => (
                  <li key={event.id} className="flex flex-col gap-0.5 text-sm">
                    <span>
                      <span className="font-medium">{event.user.name}</span>{" "}
                      <span className="text-muted-foreground">
                        {formatEventType(event.type)}
                      </span>
                      {event.club && (
                        <span className="text-muted-foreground">
                          {" "}in {event.club.name}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(event.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatEventType(type: string): string {
  switch (type) {
    case "shelf_update":
      return "updated their shelf";
    case "progress_update":
      return "updated their progress";
    case "review_created":
      return "wrote a review";
    case "club_created":
      return "created a club";
    case "member_joined":
      return "joined";
    default:
      return type.replace(/_/g, " ");
  }
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

interface FeedItem {
  id: string;
  type: string;
  payload: unknown;
  createdAt: string;
  user: { id: string; name: string; image: string | null };
  club: { id: string; name: string } | null;
}

interface ShelfItem {
  status: string;
  addedAt: string;
  media: { id: string; title: string; mediaType: string } | null;
}
