# Authentication (BetterAuth)

## Setup

### 1. Auth Configuration

```tsx
// lib/auth.ts (server)
import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './db'

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  plugins: [tanstackStartCookies()], // Must be last!
})
```

### 2. Auth Client

```tsx
// lib/auth-client.ts
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_APP_URL,
})

export const { signIn, signUp, signOut, useSession } = authClient
```

### 3. API Route

```tsx
// routes/api/auth/$.ts
import { auth } from '@/lib/auth'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => auth.handler(request),
      POST: async ({ request }) => auth.handler(request),
    },
  },
})
```

## Protected Routes

### Using beforeLoad (Recommended)

Use a pathless layout to protect multiple routes:

```tsx
// routes/_authenticated.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { auth } from '@/lib/auth'
import { getWebRequest } from 'vinxi/http'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const request = getWebRequest()
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }

    // Pass session to child routes via context
    return {
      user: session.user,
      session: session.session,
    }
  },
  component: () => <Outlet />,
})
```

Child routes automatically have auth context:

```tsx
// routes/_authenticated/dashboard.tsx -> /dashboard
export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardComponent,
})

function DashboardComponent() {
  const { user } = Route.useRouteContext()
  return <h1>Welcome, {user.name}</h1>
}
```

### Using Middleware

Alternative pattern for per-route protection:

```tsx
// lib/middleware.ts
import { redirect } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '@/lib/auth'

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })

  if (!session) {
    throw redirect({ to: '/login' })
  }

  return next()
})
```

```tsx
// routes/dashboard.tsx
import { authMiddleware } from '@/lib/middleware'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
  server: {
    middleware: [authMiddleware],
  },
})
```

## Auth in Server Functions

Always verify auth server-side, even if route is protected:

```tsx
// features/posts/server-fns.ts
import { createServerFn } from '@tanstack/react-start'
import { getWebRequest } from 'vinxi/http'
import { auth } from '@/lib/auth'

export const createPostFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createPostSchema.parse(data))
  .handler(async ({ data }) => {
    const request = getWebRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    return db.post.create({
      data: {
        ...data,
        userId: session.user.id,
      },
    })
  })
```

## Client-Side Auth

### useSession Hook

```tsx
import { useSession } from '@/lib/auth-client'

function Navbar() {
  const { data: session, isPending } = useSession()

  if (isPending) return <div>Loading...</div>

  return session ? (
    <span>Hello, {session.user.name}</span>
  ) : (
    <Link to="/login">Sign In</Link>
  )
}
```

### Sign In/Out

```tsx
import { signIn, signOut } from '@/lib/auth-client'

// Email/password
await signIn.email({
  email: 'user@example.com',
  password: 'password',
})

// Sign out
await signOut()
```

## Auth Context Pattern

Pass auth to entire app via router context:

```tsx
// app/router.tsx
import { createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'

export interface RouterContext {
  queryClient: QueryClient
  // Add auth if needed globally
}

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
})
```

```tsx
// routes/__root.tsx
import { createRootRouteWithContext } from '@tanstack/react-router'
import type { RouterContext } from '@/app/router'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})
```
