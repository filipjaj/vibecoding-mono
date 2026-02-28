import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

type MediaDetail = {
  id: string; title: string; authorOrDirector: string | null; coverUrl: string | null;
  year: number | null; description: string | null; mediaType: string;
  reviews: Array<{ id: string; rating: number; text: string | null; createdAt: string; user: { id: string; name: string; image: string | null } }>;
};

export const Route = createFileRoute("/media/$mediaId")({ component: MediaDetailPage });

function MediaDetailPage() {
  const { mediaId } = Route.useParams();
  const { data: session } = useSession();
  const [media, setMedia] = useState<MediaDetail | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => { api<MediaDetail>(`/api/media/${mediaId}`).then(setMedia).catch(console.error); }, [mediaId]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    await api(`/api/media/${mediaId}/reviews`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, text: reviewText || undefined }),
    });
    const updated = await api<MediaDetail>(`/api/media/${mediaId}`);
    setMedia(updated);
    setRating(0);
    setReviewText("");
  }

  if (!media) return <AppShell><p>Loading...</p></AppShell>;

  const avgRating = media.reviews.length > 0
    ? (media.reviews.reduce((sum, r) => sum + r.rating, 0) / media.reviews.length).toFixed(1)
    : "—";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex gap-6">
          {media.coverUrl && <img src={media.coverUrl} alt={media.title} className="w-32 h-48 object-cover rounded-lg shadow" />}
          <div>
            <h1 className="text-3xl font-bold">{media.title}</h1>
            <p className="text-muted-foreground mt-1">{media.authorOrDirector}{media.year && ` (${media.year})`}</p>
            <p className="text-lg mt-2">{avgRating} avg · {media.reviews.length} reviews</p>
            {media.description && <p className="text-sm text-muted-foreground mt-3 max-w-lg">{media.description}</p>}
          </div>
        </div>

        {session?.user && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Write a Review</h3>
            <form onSubmit={submitReview} className="space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)}
                    className={`text-2xl ${star <= rating ? "text-primary" : "text-muted-foreground/30"}`}>★</button>
                ))}
              </div>
              <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="What did you think?" />
              <Button type="submit" disabled={rating === 0}>Post Review</Button>
            </form>
          </Card>
        )}

        <section>
          <h2 className="text-xl font-semibold mb-3">Reviews</h2>
          {media.reviews.length === 0 ? (
            <p className="text-muted-foreground">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {media.reviews.map((review) => (
                <Card key={review.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{review.user.name}</span>
                    <span className="text-primary">{"★".repeat(review.rating)}</span>
                  </div>
                  {review.text && <p className="text-sm">{review.text}</p>}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
