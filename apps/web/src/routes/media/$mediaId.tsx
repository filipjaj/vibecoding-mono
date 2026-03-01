import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

type MediaDetail = {
  id: string; title: string; authorOrDirector: string | null; coverUrl: string | null;
  year: number | null; description: string | null; mediaType: string;
  reviews: Array<{ id: string; rating: number; text: string | null; createdAt: string; user: { id: string; name: string; image: string | null } }>;
};

type ShelfItem = {
  status: "want" | "reading" | "watched" | "finished";
  media: { id: string };
};

export const Route = createFileRoute("/media/$mediaId")({ component: MediaDetailPage });

function MediaDetailPage() {
  const { mediaId } = Route.useParams();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const { data: media, isLoading } = useQuery({
    queryKey: ["media", mediaId],
    queryFn: () => api<MediaDetail>(`/api/media/${mediaId}`),
  });

  const { data: shelfItems } = useQuery({
    queryKey: ["shelf", session?.user?.id],
    queryFn: () => api<ShelfItem[]>(`/api/users/${session!.user.id}/shelf`),
    enabled: !!session?.user?.id,
  });

  const currentShelfStatus = shelfItems?.find((i) => i.media.id === mediaId)?.status;

  async function handleShelfAction(status: string) {
    await api("/api/shelf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaItemId: mediaId, status }),
    });
    queryClient.invalidateQueries({ queryKey: ["shelf", session!.user.id] });
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    await api(`/api/media/${mediaId}/reviews`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, text: reviewText || undefined }),
    });
    queryClient.invalidateQueries({ queryKey: ["media", mediaId] });
    setRating(0);
    setReviewText("");
  }

  if (isLoading || !media) return <p className="text-muted-foreground py-12 text-center">Laster...</p>;

  const avgRating = media.reviews.length > 0
    ? (media.reviews.reduce((sum, r) => sum + r.rating, 0) / media.reviews.length).toFixed(1)
    : null;

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* Hero section */}
      <div className="flex gap-8">
        <div className="shrink-0">
          <div className="w-40 aspect-[2/3] overflow-hidden rounded-xl bg-muted shadow-md ring-1 ring-black/5 sm:w-48">
            {media.coverUrl ? (
              <img src={media.coverUrl} alt={media.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground p-4 text-center">{media.title}</div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <h1 className="text-3xl font-bold tracking-tight leading-tight">{media.title}</h1>
          <p className="text-muted-foreground">
            {media.authorOrDirector}{media.year && ` · ${media.year}`}
          </p>

          {/* Rating display */}
          <div className="flex items-center gap-3">
            {avgRating && (
              <>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`text-lg ${star <= Math.round(Number(avgRating)) ? "text-[var(--color-star)]" : "text-[var(--color-star-muted)]"}`}>★</span>
                  ))}
                </div>
                <span className="text-lg font-semibold">{avgRating}</span>
                <span className="text-sm text-muted-foreground">({media.reviews.length} anmeldelser)</span>
              </>
            )}
            {!avgRating && <span className="text-sm text-muted-foreground">Ingen anmeldelser ennå</span>}
          </div>

          {/* Shelf buttons */}
          {session?.user && (
            <div className="flex gap-2 mt-1">
              {(media.mediaType === "book"
                ? [{ status: "want", label: "Vil lese" }, { status: "reading", label: "Leser nå" }, { status: "finished", label: "Ferdig" }]
                : [{ status: "want", label: "Vil se" }, { status: "watched", label: "Sett" }, { status: "finished", label: "Ferdig" }]
              ).map(({ status, label }) => (
                <Button
                  key={status}
                  variant={currentShelfStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleShelfAction(status)}
                >
                  {label}
                </Button>
              ))}
            </div>
          )}

          {media.description && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mt-1">{media.description}</p>
          )}
        </div>
      </div>

      {/* Write review */}
      {session?.user && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-semibold mb-4">Skriv en anmeldelse</h3>
          <form onSubmit={submitReview} className="flex flex-col gap-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star} type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className={`text-2xl transition-colors ${star <= (hoverRating || rating) ? "text-[var(--color-star)]" : "text-[var(--color-star-muted)]"}`}
                >★</button>
              ))}
            </div>
            <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Hva synes du?" />
            <Button type="submit" disabled={rating === 0} className="w-fit">Publiser anmeldelse</Button>
          </form>
        </div>
      )}

      {/* Reviews list */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Anmeldelser</h2>
        {media.reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen anmeldelser ennå. Bli den første!</p>
        ) : (
          <div className="space-y-4">
            {media.reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {review.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium text-sm">{review.user.name}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`text-xs ${star <= review.rating ? "text-[var(--color-star)]" : "text-[var(--color-star-muted)]"}`}>★</span>
                      ))}
                    </div>
                  </div>
                </div>
                {review.text && <p className="text-sm leading-relaxed">{review.text}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
