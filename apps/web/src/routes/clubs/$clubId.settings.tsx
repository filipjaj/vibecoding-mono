import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { api } from "@/lib/api";

type Club = {
  id: string;
  name: string;
  description: string | null;
  mediaType: string;
  selectionMode: string;
  pacingEnabled: boolean;
  recurrenceRule: string | null;
};

export const Route = createFileRoute("/clubs/$clubId/settings")({
  component: ClubSettingsPage,
});

function ClubSettingsPage() {
  const { clubId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: club, isLoading } = useQuery({
    queryKey: ["club", clubId],
    queryFn: () => api<Club>(`/api/clubs/${clubId}`),
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectionMode, setSelectionMode] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (club && !initialized) {
      setName(club.name);
      setDescription(club.description ?? "");
      setSelectionMode(club.selectionMode);
      setInitialized(true);
    }
  }, [club, initialized]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await api(`/api/clubs/${clubId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: description || undefined,
        selectionMode,
      }),
    });
    queryClient.invalidateQueries({ queryKey: ["club", clubId] });
    setSaving(false);
    navigate({ to: "/clubs/$clubId", params: { clubId } });
  }

  if (isLoading || !club)
    return (
      <p className="text-muted-foreground py-12 text-center">Laster...</p>
    );

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Innstillinger</h1>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="club-name">Klubbnavn</Label>
          <Input
            id="club-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="club-desc">Beskrivelse</Label>
          <Textarea
            id="club-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Utvelgelsesmodus</Label>
          <Select
            value={selectionMode}
            onValueChange={(v) => setSelectionMode(v ?? "")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin_picks">Admin velger</SelectItem>
              <SelectItem value="rotation">Rotasjon</SelectItem>
              <SelectItem value="vote">Avstemning</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 mt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Lagrer..." : "Lagre"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate({ to: "/clubs/$clubId", params: { clubId } })
            }
          >
            Avbryt
          </Button>
        </div>
      </form>
    </div>
  );
}
