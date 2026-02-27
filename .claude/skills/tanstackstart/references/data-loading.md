# Data Loading

Loaders run _before_ the route renders, ensuring data is ready when the component mounts. In TanStack Start, loaders typically run on the server (SSR) and the result is sent to the client.

## Basic Loader

```tsx
// routes/posts.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts')({
  loader: async () => {
    const response = await fetch('https://api.example.com/posts')
    return response.json()
  },
  component: PostsComponent,
})

function PostsComponent() {
  const posts = Route.useLoaderData()
  return posts.map((post) => <div key={post.id}>{post.title}</div>)
}
```

## Loader with Params

```tsx
// routes/posts/$postId.tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const response = await fetch(`/api/posts/${params.postId}`)
    return response.json()
  },
  component: PostComponent,
})

function PostComponent() {
  const post = Route.useLoaderData()
  return <h1>{post.title}</h1>
}
```

## Loader with Search Params

Requires validation and `loaderDeps` to trigger reload on param change.

```tsx
import { z } from 'zod'

const searchSchema = z.object({
  page: z.number().optional().default(1),
  sort: z.enum(['asc', 'desc']).optional().default('asc'),
})

export const Route = createFileRoute('/posts')({
  // 1. Validate search params
  validateSearch: (search) => searchSchema.parse(search),

  // 2. Declare which params trigger reload
  loaderDeps: ({ search }) => ({ page: search.page, sort: search.sort }),

  // 3. Use deps (not search) in loader
  loader: async ({ deps }) => {
    return fetch(`/api/posts?page=${deps.page}&sort=${deps.sort}`)
  },
  component: PostsComponent,
})
```

## With TanStack Query (Recommended)

The "gold standard" pattern: use Query for caching, deduping, and background refetching.

### 1. Define Query Options

```tsx
// features/posts/posts.queries.ts
import { queryOptions } from '@tanstack/react-query'

export const postsQueryOptions = queryOptions({
  queryKey: ['posts'],
  queryFn: async () => {
    const res = await fetch('/api/posts')
    return res.json()
  },
})

export const postQueryOptions = (postId: string) =>
  queryOptions({
    queryKey: ['posts', postId],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${postId}`)
      if (!res.ok) throw new Error('Not found')
      return res.json()
    },
  })
```

### 2. Pre-fetch in Loader

```tsx
// routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { postQueryOptions } from '@/features/posts/posts.queries'

export const Route = createFileRoute('/posts/$postId')({
  loader: ({ context, params }) => {
    // Pre-fetch and populate cache (SSR-friendly)
    return context.queryClient.ensureQueryData(postQueryOptions(params.postId))
  },
  component: PostComponent,
})
```

### 3. Use in Component

```tsx
// features/posts/components/post-detail.tsx
import { useSuspenseQuery } from '@tanstack/react-query'
import { postQueryOptions } from '../posts.queries'
import { Route } from '@/routes/posts/$postId'

export function PostDetail() {
  const { postId } = Route.useParams()

  // Reads from cache (populated by loader), refetches if stale
  const { data: post } = useSuspenseQuery(postQueryOptions(postId))

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
    </article>
  )
}
```

## Why TanStack Query?

1. **No waterfalls** – Data fetches when route matches, before render
2. **SSR hydration** – Server-fetched data transfers to client cache
3. **Type safety** – Types flow through queryOptions
4. **Background refetching** – Stale data auto-updates
5. **Deduplication** – Multiple components share one request

## Caching Options

```tsx
export const Route = createFileRoute('/posts')({
  loader: async () => fetchPosts(),
  staleTime: 10_000, // Consider fresh for 10s
  gcTime: 300_000, // Keep in cache for 5min
})
```

Or via queryOptions:

```tsx
export const postsQueryOptions = queryOptions({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  staleTime: 1000 * 60 * 5, // 5 minutes
})
```

## Error & Loading States

TanStack Start handles these via route options:

```tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: ({ params }) => fetchPost(params.postId),
  pendingComponent: () => <div>Loading...</div>,
  errorComponent: ({ error }) => <div>Error: {error.message}</div>,
  notFoundComponent: () => <div>Post not found</div>,
})
```

Or throw from loader:

```tsx
import { notFound } from '@tanstack/react-router'

loader: async ({ params }) => {
  const post = await fetchPost(params.postId)
  if (!post) throw notFound()
  return post
}
```
