import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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

export const Route = createFileRoute("/clubs/new")({ component: NewClubPage });

function NewClubPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState<"book" | "film">("book");
  const [recurrenceRule, setRecurrenceRule] = useState("");
  const [selectionMode, setSelectionMode] = useState<"admin_picks" | "rotation" | "vote">("admin_picks");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const club = await api<{ id: string }>("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          mediaType,
          selectionMode,
          recurrenceRule: recurrenceRule || undefined,
        }),
      });
      navigate({ to: "/clubs/$clubId", params: { clubId: club.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke opprette klubb");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Opprett en klubb</h1>
      <p className="text-muted-foreground mb-8">Start en ny bok- eller filmklubb med venner.</p>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Klubbnavn</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Fredagens filmklubb" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Hva handler klubben om?" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Medietype</Label>
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => setMediaType("book")}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${mediaType === "book" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                Bøker
              </button>
              <button type="button" onClick={() => setMediaType("film")}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${mediaType === "film" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                Filmer
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Velgemåte</Label>
            <Select value={selectionMode} onValueChange={(v) => setSelectionMode(v as "admin_picks" | "rotation" | "vote")}>
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="recurrence">Gjentakelse (valgfritt)</Label>
            <Input id="recurrence" value={recurrenceRule} onChange={(e) => setRecurrenceRule(e.target.value)} placeholder="f.eks. Annenhver torsdag kl. 19:00" />
          </div>
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Oppretter..." : "Opprett klubb"}
          </Button>
        </form>
      </div>
    </div>
  );
}
