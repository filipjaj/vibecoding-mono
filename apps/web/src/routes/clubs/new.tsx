import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

export const Route = createFileRoute("/clubs/new")({ component: NewClubPage });

function NewClubPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState<"book" | "film">("book");
  const [recurrenceRule, setRecurrenceRule] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const club = await api<{ id: string }>("/api/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, mediaType, recurrenceRule }),
    });
    navigate({ to: "/clubs/$clubId", params: { clubId: club.id } });
  }

  return (
    <AppShell>
      <Card className="mx-auto max-w-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Create a Club</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Club Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Friday Film Club" required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this club about?" />
          </div>
          <div>
            <Label>Media Type</Label>
            <div className="flex gap-2 mt-1">
              <Button type="button" variant={mediaType === "book" ? "default" : "outline"} onClick={() => setMediaType("book")}>Books</Button>
              <Button type="button" variant={mediaType === "film" ? "default" : "outline"} onClick={() => setMediaType("film")}>Films</Button>
            </div>
          </div>
          <div>
            <Label htmlFor="recurrence">Recurrence (optional)</Label>
            <Input id="recurrence" value={recurrenceRule} onChange={(e) => setRecurrenceRule(e.target.value)} placeholder="e.g. Every 2 weeks on Thursday at 19:00" />
          </div>
          <Button type="submit" className="w-full">Create Club</Button>
        </form>
      </Card>
    </AppShell>
  );
}
