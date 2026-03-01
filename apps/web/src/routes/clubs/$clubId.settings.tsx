import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { useOptimisticMutation } from "@/lib/mutations";

type Club = {
  id: string;
  name: string;
  description: string | null;
  mediaType: string;
  selectionMode: string;
  pacingEnabled: boolean;
  recurrenceRule: string | null;
};

type SettingsPayload = {
  name: string;
  description?: string;
  selectionMode: string;
};

export const Route = createFileRoute("/clubs/$clubId/settings")({
  component: ClubSettingsPage,
});

function ClubSettingsPage() {
  const { clubId } = Route.useParams();
  const navigate = useNavigate();

  const { data: club, isLoading } = useQuery({
    queryKey: ["club", clubId],
    queryFn: () => api<Club>(`/api/clubs/${clubId}`),
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectionMode, setSelectionMode] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (club && !initialized) {
      setName(club.name);
      setDescription(club.description ?? "");
      setSelectionMode(club.selectionMode);
      setInitialized(true);
    }
  }, [club, initialized]);

  const saveMutation = useOptimisticMutation<void, SettingsPayload>({
    queryKey: ["club", clubId],
    mutationFn: (payload) =>
      api(`/api/clubs/${clubId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onMutate(payload, qc) {
      qc.setQueryData<Club>(["club", clubId], (old) => {
        if (!old) return old;
        return {
          ...old,
          name: payload.name,
          description: payload.description ?? null,
          selectionMode: payload.selectionMode,
        };
      });
    },
    onSuccess() {
      navigate({ to: "/clubs/$clubId", params: { clubId } });
    },
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate({
      name,
      description: description || undefined,
      selectionMode,
    });
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
        {saveMutation.isError && (
          <p className="text-sm text-destructive">Kunne ikke lagre innstillinger. Prøv igjen.</p>
        )}
        <div className="flex gap-2 mt-2">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Lagrer..." : "Lagre"}
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
