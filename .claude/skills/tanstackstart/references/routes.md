# Routes & Navigation

## File-Based Routing

TanStack Start uses file-based routing. Files in `src/routes/` automatically become routes.

### Naming Conventions

| Pattern         | Purpose              | Example URL              |
| --------------- | -------------------- | ------------------------ |
| `index.tsx`     | Index route          | `/posts` (exact)         |
| `$param.tsx`    | Dynamic segment      | `/posts/123`             |
| `_layout.tsx`   | Pathless layout      | (wraps children, no URL) |
| `route.tsx`     | Layout with path     | `/posts` (has children)  |
| `$.tsx`         | Splat/catch-all      | `/files/any/path/here`   |
| `-filename.tsx` | Excluded from routes | (colocated helpers)      |

### Basic Route

```tsx
// routes/about.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutComponent,
})

function AboutComponent() {
  return <div>About page</div>
}
```

### Route with Params

```tsx
// routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: ({ params }) => fetchPost(params.postId),
  component: PostComponent,
})

function PostComponent() {
  const { postId } = Route.useParams()
  const post = Route.useLoaderData()
  return <h1>{post.title}</h1>
}
```

### Layout Route

```tsx
// routes/posts.tsx (layout for /posts/*)
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/posts')({
  component: PostsLayout,
})

function PostsLayout() {
  return (
    <div>
      <h1>Posts</h1>
      <Outlet /> {/* Child routes render here */}
    </div>
  )
}
```

### Pathless Layout

Use `_` prefix for layouts that wrap children without adding to the URL.

```tsx
// routes/_authenticated.tsx
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    /* auth check */
  },
  component: () => <Outlet />,
})

// routes/_authenticated/dashboard.tsx -> /dashboard
// routes/_authenticated/settings.tsx -> /settings
```

### Search Params

```tsx
// routes/posts.tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  page: z.number().optional().default(1),
  sort: z.enum(['asc', 'desc']).optional().default('asc'),
})

export const Route = createFileRoute('/posts')({
  validateSearch: (search) => searchSchema.parse(search),
  loaderDeps: ({ search }) => ({ page: search.page, sort: search.sort }),
  loader: ({ deps }) => fetchPosts(deps.page, deps.sort),
  component: PostsComponent,
})

function PostsComponent() {
  const { page, sort } = Route.useSearch()
  // ...
}
```

## Navigation

### Link Component

```tsx
import { Link } from '@tanstack/react-router'

<Link to="/posts/$postId" params={{ postId: '123' }}>
  View Post
</Link>

<Link
  to="/posts"
  search={{ page: 2 }}
  activeProps={{ className: 'font-bold' }}
>
  Posts
</Link>
```

### useNavigate Hook

```tsx
import { useNavigate } from '@tanstack/react-router'

function Component() {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate({ to: '/posts', search: { page: 1 } })
  }
}
```

### Redirect (in loaders/beforeLoad)

```tsx
import { redirect } from '@tanstack/react-router'

beforeLoad: () => {
  if (!user) throw redirect({ to: '/login' })
}
```

## Useful Hooks

- `Route.useParams()` – Get typed path params
- `Route.useSearch()` – Get typed search params
- `Route.useLoaderData()` – Get loader data
- `useLocation()` – Get current location
- `useRouter()` – Access router instance
- `getRouteApi('/path')` – Access route hooks without importing route (avoids circular deps)
