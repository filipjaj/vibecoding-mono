import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type SearchResult = { externalId: string; title: string; authorOrDirector: string | null; coverUrl: string | null; year: number | null; description: string | null };

type Props = { mediaType: "book" | "film"; onSelect: (item: SearchResult) => void };

export function MediaSearch({ mediaType, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await api<SearchResult[]>(`/api/media/search?q=${encodeURIComponent(query)}&type=${mediaType}`);
      setResults(data);
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Søk etter ${mediaType === "book" ? "bøker" : "filmer"}...`} />
        <Button type="submit" disabled={loading}>{loading ? "..." : "Søk"}</Button>
      </form>
      {results.map((item) => (
        <Card key={item.externalId} className="flex gap-3 p-3 cursor-pointer hover:bg-accent transition-colors" onClick={() => onSelect(item)}>
          {item.coverUrl && <img src={item.coverUrl} alt={item.title} className="w-10 h-14 object-cover rounded" />}
          <div>
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.authorOrDirector}{item.year && ` (${item.year})`}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
