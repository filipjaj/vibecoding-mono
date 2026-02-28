import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, API_URL } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

type ClubPreview = { id: string; name: string; description: string | null; mediaType: string; memberCount: number };

export const Route = createFileRoute("/join/$inviteCode")({ component: JoinPage });

function JoinPage() {
  const { inviteCode } = Route.useParams();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [club, setClub] = useState<ClubPreview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/join/${inviteCode}`).then((r) => r.json()).then(setClub).catch(() => setError("Invalid invite link"));
  }, [inviteCode]);

  async function handleJoin() {
    if (!session?.user) { navigate({ to: "/login" }); return; }
    const result = await api<{ club: { id: string } }>(`/api/clubs/join/${inviteCode}`, { method: "POST" });
    navigate({ to: "/clubs/$clubId", params: { clubId: result.club.id } });
  }

  if (error) return <AppShell><p className="text-center text-muted-foreground py-20">{error}</p></AppShell>;
  if (!club) return <AppShell><p>Loading...</p></AppShell>;

  return (
    <AppShell>
      <Card className="mx-auto max-w-md p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">{club.name}</h1>
        {club.description && <p className="text-muted-foreground">{club.description}</p>}
        <div className="flex justify-center gap-2">
          <Badge variant="secondary">{club.mediaType === "book" ? "Book Club" : "Film Club"}</Badge>
          <Badge variant="outline">{club.memberCount} members</Badge>
        </div>
        <Button onClick={handleJoin} className="w-full" size="lg">
          {session?.user ? "Join Club" : "Sign in to Join"}
        </Button>
      </Card>
    </AppShell>
  );
}
