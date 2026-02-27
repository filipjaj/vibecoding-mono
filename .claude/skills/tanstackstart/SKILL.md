---
name: tanstack-start
description: Build fullstack React apps with TanStack Start. Use when creating routes, server functions, loaders, hooks, or components for TanStack Start projects. Triggers on requests like "lag en route", "opprett server function", "lag en hook", or any TanStack Start development task. Stack includes Zod, Prisma, BetterAuth, Tailwind/Shadcn, Jotai, and TanStack Query.
---

# TanStack Start Development

## Core Principles

1. **Small, isolated files** – Split logic into focused units
2. **Dumb components** – Components render UI, nothing else
3. **Logic in hooks** – Complex logic lives in custom hooks
4. **Functions for reusability** – Extract reusable logic into pure functions
5. **Feature-based structure** – Colocate related code in feature folders

## Stack Overview

| Concern      | Tool                                |
| ------------ | ----------------------------------- |
| Routing      | TanStack Router (file-based)        |
| Server Logic | Server Functions (`createServerFn`) |
| Server State | TanStack Query                      |
| Client State | Jotai                               |
| Validation   | Zod                                 |
| Database     | Prisma                              |
| Auth         | BetterAuth                          |
| Styling      | Tailwind + Shadcn/ui                |

## Quick Patterns

### Route with Loader + Query

```tsx
// routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { postQueryOptions } from '@/features/posts/posts.queries'
import { PostDetail } from '@/features/posts/components/post-detail'

export const Route = createFileRoute('/posts/$postId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(postQueryOptions(params.postId)),
  component: PostDetail,
})
```

### Server Function with Validation

```tsx
// features/posts/server-fns.ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const createPostSchema = z.object({
  title: z.string().min(3),
  content: z.string(),
})

export const createPostFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createPostSchema.parse(data))
  .handler(async ({ data }) => {
    // DB logic here
  })
```

### Protected Route Layout

```tsx
// routes/_authenticated.tsx
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    })
    if (!session) throw redirect({ to: '/login' })
    return { user: session.user }
  },
  component: () => <Outlet />,
})
```

### Mutation Hook

```tsx
// features/posts/hooks/use-create-post.ts
export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPostFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  })
}
```

## Detailed References

- **Routes & Navigation**: See [references/routes.md](references/routes.md)
- **Server Functions**: See [references/server-functions.md](references/server-functions.md)
- **Data Loading**: See [references/data-loading.md](references/data-loading.md)
- **Authentication**: See [references/auth.md](references/auth.md)
- **Mutations & Forms**: See [references/mutations.md](references/mutations.md)
- **Project Structure**: See [references/project-structure.md](references/project-structure.md)

## Project Structure

```
src/
├── app/                    # Global config (router, providers)
├── routes/                 # File-based routes (thin!)
├── features/               # Feature modules
│   ├── posts/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── posts.queries.ts
│   │   ├── posts.store.ts  # Jotai atoms
│   │   └── server-fns.ts
│   └── auth/
├── lib/                    # Third-party configs
└── routeTree.gen.ts        # Auto-generated
```

Routes should be thin – just loader, validateSearch, and component import. Business logic lives in `features/`.
