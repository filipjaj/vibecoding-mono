import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/clubs")({ component: ClubsLayout });

type Club = {
  club: { id: string; name: string; description: string | null; mediaType: string };
  role: string;
};

function ClubsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = pathname === "/clubs" || pathname === "/clubs/";

  if (!isIndex) {
    return <Outlet />;
  }

  return <ClubsIndex />;
}

function ClubsIndex() {
  const { data: session } = useSession();

  const { data: profile } = useQuery({
    queryKey: ["user", session?.user?.id],
    queryFn: () => api<{ clubs: Club[] }>(`/api/users/${session!.user.id}`),
    enabled: !!session?.user?.id,
  });

  const clubs = profile?.clubs ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Klubber</h1>
          <p className="text-muted-foreground mt-1">Bok- og filmklubbene dine.</p>
        </div>
        <Button render={<Link to="/clubs/new" />}>Ny klubb</Button>
      </div>

      {clubs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground mb-3">Du er ikke med i noen klubber ennå.</p>
          <Button variant="outline" render={<Link to="/clubs/new" />}>Opprett din første klubb</Button>
        </div>
      )}

      {clubs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map(({ club, role }) => (
            <Link key={club.id} to="/clubs/$clubId" params={{ clubId: club.id }}>
              <div className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {club.mediaType === "book" ? "B" : "F"}
                  </div>
                  {role === "admin" && <Badge variant="secondary" className="text-xs">Admin</Badge>}
                </div>
                <h3 className="font-semibold text-lg leading-tight">{club.name}</h3>
                {club.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{club.description}</p>
                )}
                <Badge variant="outline" className="mt-3">{club.mediaType === "book" ? "Bokklubb" : "Filmklubb"}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
