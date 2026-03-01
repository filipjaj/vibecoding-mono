import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

type ClubPreview = { id: string; name: string; description: string | null; mediaType: string; memberCount: number };

export const Route = createFileRoute("/join/$inviteCode")({ component: JoinPage });

function JoinPage() {
  const { inviteCode } = Route.useParams();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [club, setClub] = useState<ClubPreview | null>(null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    api<ClubPreview>(`/api/join/${inviteCode}`).then(setClub).catch(() => setError("Ugyldig invitasjonslenke"));
  }, [inviteCode]);

  async function handleJoin() {
    if (!session?.user) { navigate({ to: "/login", search: { redirect: `/join/${inviteCode}` } }); return; }
    setJoining(true);
    setError("");
    try {
      const result = await api<{ club: { id: string } }>(`/api/clubs/join/${inviteCode}`, {
        method: "POST",
      });
      navigate({ to: "/clubs/$clubId", params: { clubId: result.club.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke bli med i klubben");
      setJoining(false);
    }
  }

  if (error && !club) return <p className="text-center text-muted-foreground py-20">{error}</p>;
  if (!club) return <p className="text-center text-muted-foreground py-20">Laster...</p>;

  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary mx-auto mb-4">
          {club.mediaType === "book" ? "B" : "F"}
        </div>
        <h1 className="text-2xl font-bold mb-2">{club.name}</h1>
        {club.description && <p className="text-muted-foreground mb-4">{club.description}</p>}
        <div className="flex justify-center gap-2 mb-6">
          <Badge variant="secondary">{club.mediaType === "book" ? "Bokklubb" : "Filmklubb"}</Badge>
          <Badge variant="outline">{club.memberCount} medlemmer</Badge>
        </div>
        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive mb-4">{error}</p>}
        <Button onClick={handleJoin} className="w-full" size="lg" disabled={joining}>
          {joining ? "Blir med..." : session?.user ? "Bli med i klubben" : "Logg inn for å bli med"}
        </Button>
      </div>
    </div>
  );
}
