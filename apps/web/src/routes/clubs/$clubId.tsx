import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

type Club = {
  id: string; name: string; description: string | null; mediaType: "book" | "film";
  inviteCode: string; recurrenceRule: string | null;
  members: Array<{ user: { id: string; name: string; image: string | null }; role: string; joinedAt: string }>;
};

type ScheduleItem = {
  id: string; order: number; scheduledDate: string | null; status: string;
  media: { id: string; title: string; authorOrDirector: string | null; coverUrl: string | null; year: number | null };
};

export const Route = createFileRoute("/clubs/$clubId")({ component: ClubDetailPage });

function ClubDetailPage() {
  const { clubId } = Route.useParams();
  const [club, setClub] = useState<Club | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api<Club>(`/api/clubs/${clubId}`).then(setClub).catch(console.error);
    api<ScheduleItem[]>(`/api/clubs/${clubId}/schedule`).then(setSchedule).catch(console.error);
  }, [clubId]);

  if (!club) return <AppShell><p>Loading...</p></AppShell>;

  function copyInviteLink() {
    const link = `${window.location.origin}/join/${club!.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{club.name}</h1>
            {club.description && <p className="text-muted-foreground mt-1">{club.description}</p>}
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">{club.mediaType === "book" ? "Book Club" : "Film Club"}</Badge>
              <Badge variant="outline">{club.members.length} members</Badge>
            </div>
          </div>
          <Button variant="outline" onClick={copyInviteLink}>{copied ? "Copied!" : "Copy Invite Link"}</Button>
        </div>

        <section>
          <h2 className="text-xl font-semibold mb-3">Schedule</h2>
          {schedule.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">No items scheduled yet.</Card>
          ) : (
            <div className="space-y-3">
              {schedule.map((item) => (
                <Link key={item.id} to="/media/$mediaId" params={{ mediaId: item.media.id }}>
                  <Card className="flex gap-4 p-4 hover:bg-accent transition-colors">
                    {item.media.coverUrl && <img src={item.media.coverUrl} alt={item.media.title} className="w-12 h-16 object-cover rounded" />}
                    <div>
                      <h3 className="font-medium">{item.media.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.media.authorOrDirector}{item.media.year && ` (${item.media.year})`}</p>
                      <Badge variant={item.status === "current" ? "default" : "outline"} className="mt-1">{item.status}</Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Members</h2>
          <div className="flex flex-wrap gap-3">
            {club.members.map((m) => (
              <Link key={m.user.id} to="/users/$userId" params={{ userId: m.user.id }}>
                <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-accent transition-colors">
                  {m.user.image ? <img src={m.user.image} alt={m.user.name} className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-muted" />}
                  <span>{m.user.name}</span>
                  {m.role === "admin" && <Badge variant="secondary" className="text-xs">admin</Badge>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
