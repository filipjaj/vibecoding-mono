import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { signIn, signUp } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' && search.redirect.startsWith('/') && !search.redirect.startsWith('//')
      ? search.redirect
      : undefined,
  }),
})

function LoginPage() {
  const navigate = useNavigate()
  const { redirect } = Route.useSearch()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await signUp.email({ email, password, name })
        if (error) {
          setError(error.message ?? 'Registrering feilet')
          return
        }
      } else {
        const { error } = await signIn.email({ email, password })
        if (error) {
          setError(error.message ?? 'Innlogging feilet')
          return
        }
      }
      navigate({ to: redirect ?? '/' })
    } catch {
      setError('Noe gikk galt. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    await signIn.social({ provider: 'google', callbackURL: redirect ? `${window.location.origin}${redirect}` : window.location.origin })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isSignUp ? 'Opprett konto' : 'Velkommen tilbake'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp
              ? 'Kom i gang med klubbene dine'
              : 'Logg inn på hylla di'}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full"
            >
              Fortsett med Google
            </Button>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-xs uppercase tracking-wider">
                eller
              </span>
              <Separator className="flex-1" />
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {isSignUp && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Navn</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ditt navn"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="deg@eksempel.no"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Passord</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={loading} className="w-full">
                {loading
                  ? isSignUp
                    ? 'Oppretter konto...'
                    : 'Logger inn...'
                  : isSignUp
                    ? 'Opprett konto'
                    : 'Logg inn'}
              </Button>
            </form>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {isSignUp ? 'Har du allerede en konto?' : 'Har du ikke en konto?'}{' '}
          <button
            type="button"
            className="font-medium text-primary hover:underline underline-offset-4"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
            }}
          >
            {isSignUp ? 'Logg inn' : 'Registrer deg'}
          </button>
        </p>
      </div>
    </div>
  )
}
