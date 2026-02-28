import { Link, useRouter } from "@tanstack/react-router";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/clubs", label: "Clubs" },
  { to: "/shelf", label: "My Shelf" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-semibold tracking-tight text-foreground">
              Shelf
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground outline-none ring-ring focus-visible:ring-2"
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span>{session.user.name?.charAt(0)?.toUpperCase() ?? "?"}</span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8}>
                  <DropdownMenuLabel>{session.user.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      signOut().then(() => router.navigate({ to: "/login" }));
                    }}
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" size="sm" render={<Link to="/login" />}>
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background sm:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-6 pb-20 sm:pb-6">
        {children}
      </main>
    </div>
  );
}
