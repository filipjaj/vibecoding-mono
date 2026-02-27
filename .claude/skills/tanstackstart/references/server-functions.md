# Server Functions

Server functions run on the server but can be called from anywhere – loaders, components, hooks, or other server functions.

## Basic Usage

```tsx
import { createServerFn } from '@tanstack/react-start'

// GET (default)
export const getData = createServerFn().handler(async () => {
  return { message: 'Hello from server!' }
})

// POST
export const saveData = createServerFn({ method: 'POST' }).handler(async () => {
  return { success: true }
})
```

## Input Validation

Always validate input since it crosses the network boundary.

### Basic Validation

```tsx
export const getUser = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return findUser(data.id)
  })

// Call with:
await getUser({ data: { id: '123' } })
```

### Zod Validation

```tsx
import { z } from 'zod'

const createPostSchema = z.object({
  title: z.string().min(3),
  content: z.string(),
})

export const createPostFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createPostSchema.parse(data))
  .handler(async ({ data }) => {
    // data is typed as { title: string, content: string }
    return db.post.create({ data })
  })
```

## Error Handling

### Basic Errors

```tsx
export const riskyFn = createServerFn().handler(async () => {
  if (someCondition) {
    throw new Error('Something went wrong!')
  }
  return { success: true }
})

// Errors are serialized to the client
try {
  await riskyFn()
} catch (error) {
  console.log(error.message) // "Something went wrong!"
}
```

### Redirects

```tsx
import { redirect } from '@tanstack/react-router'

export const requireAuth = createServerFn().handler(async () => {
  const user = await getCurrentUser()
  if (!user) {
    throw redirect({ to: '/login' })
  }
  return user
})
```

### Not Found

```tsx
import { notFound } from '@tanstack/react-router'

export const getPost = createServerFn()
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const post = await db.post.findUnique({ where: { id: data.id } })
    if (!post) throw notFound()
    return post
  })
```

## Request Context

Access headers, set response headers, etc.

```tsx
import { createServerFn } from '@tanstack/react-start'
import { getWebRequest } from 'vinxi/http'
import {
  setResponseHeaders,
  setResponseStatus,
} from '@tanstack/react-start/server'

export const getCachedData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const request = getWebRequest()
    const authHeader = request.headers.get('Authorization')

    setResponseHeaders(
      new Headers({
        'Cache-Control': 'public, max-age=300',
      }),
    )

    return fetchData()
  },
)
```

## File Organization

Recommended pattern for larger apps:

```
src/features/posts/
├── server-fns.ts       # createServerFn wrappers (safe to import anywhere)
├── posts.server.ts     # Server-only helpers (DB queries, internal logic)
└── schemas.ts          # Shared Zod schemas (client-safe)
```

```tsx
// posts.server.ts – Server-only
import { db } from '@/lib/db'

export async function findPostById(id: string) {
  return db.post.findUnique({ where: { id } })
}
```

```tsx
// server-fns.ts – Safe to import in components
import { createServerFn } from '@tanstack/react-start'
import { findPostById } from './posts.server'
import { getPostSchema } from './schemas'

export const getPostFn = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => getPostSchema.parse(data))
  .handler(async ({ data }) => {
    return findPostById(data.id)
  })
```

## Auth in Server Functions

Always verify auth server-side:

```tsx
import { getWebRequest } from 'vinxi/http'
import { auth } from '@/lib/auth-server'

export const createPostFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createPostSchema.parse(data))
  .handler(async ({ data }) => {
    const request = getWebRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) throw new Error('Unauthorized')

    return db.post.create({
      data: { ...data, userId: session.user.id },
    })
  })
```

## Calling Server Functions

### In Loaders

```tsx
export const Route = createFileRoute('/posts')({
  loader: () => getPostsFn(),
})
```

### In Components (with useServerFn)

```tsx
import { useServerFn } from '@tanstack/react-start'

function Component() {
  const getPosts = useServerFn(getPostsFn)

  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: () => getPosts(),
  })
}
```

### In Mutations

```tsx
const { mutate } = useMutation({
  mutationFn: createPostFn,
})
```
