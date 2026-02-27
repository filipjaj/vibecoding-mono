# Mutations & Forms

The recommended pattern: **Server Function → TanStack Query Mutation → UI**

Don't call server functions directly from event handlers. Wrap them in `useMutation` for loading states, error handling, and cache invalidation.

## The Pattern

### 1. Define Schema & Server Function

```tsx
// features/posts/server-fns.ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getWebRequest } from 'vinxi/http'
import { auth } from '@/lib/auth'

// Schema (reusable for client validation)
export const createPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
})

export type CreatePostInput = z.infer<typeof createPostSchema>

// Server function
export const createPostFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createPostSchema.parse(data))
  .handler(async ({ data }) => {
    const request = getWebRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) throw new Error('Unauthorized')

    const post = await db.post.create({
      data: {
        ...data,
        userId: session.user.id,
      },
    })

    return post
  })
```

### 2. Create Mutation Hook

```tsx
// features/posts/hooks/use-create-post.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { createPostFn } from '../server-fns'

export function useCreatePost() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: createPostFn,
    onSuccess: (newPost) => {
      // Invalidate posts list
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      // Navigate to new post
      navigate({ to: '/posts/$postId', params: { postId: newPost.id } })
    },
    onError: (error) => {
      console.error('Failed to create post:', error)
    },
  })
}
```

### 3. Use in Component

```tsx
// features/posts/components/create-post-form.tsx
import { useCreatePost } from '../hooks/use-create-post'
import { createPostSchema, type CreatePostInput } from '../server-fns'

export function CreatePostForm() {
  const { mutate, isPending, error } = useCreatePost()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const payload: CreatePostInput = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
    }

    mutate({ data: payload })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          disabled={isPending}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label htmlFor="content">Content</label>
        <textarea
          id="content"
          name="content"
          disabled={isPending}
          className="w-full border rounded p-2"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isPending ? 'Creating...' : 'Create Post'}
      </button>

      {error && <p className="text-red-500">Error: {error.message}</p>}
    </form>
  )
}
```

## Optimistic Updates

Update UI immediately, rollback on error:

```tsx
export function useUpdatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updatePostFn,
    onMutate: async ({ data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts', data.id] })

      // Snapshot previous value
      const previousPost = queryClient.getQueryData(['posts', data.id])

      // Optimistically update
      queryClient.setQueryData(['posts', data.id], (old: Post) => ({
        ...old,
        ...data,
      }))

      return { previousPost }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['posts', variables.data.id],
        context?.previousPost,
      )
    },
    onSettled: (data, error, variables) => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: ['posts', variables.data.id] })
    },
  })
}
```

## Delete Mutation

```tsx
// features/posts/server-fns.ts
export const deletePostFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const request = getWebRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) throw new Error('Unauthorized')

    await db.post.delete({ where: { id: data.id } })
    return { success: true }
  })

// features/posts/hooks/use-delete-post.ts
export function useDeletePost() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: deletePostFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      navigate({ to: '/posts' })
    },
  })
}
```

## Form Libraries

For complex forms, consider React Hook Form with Zod:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPostSchema, type CreatePostInput } from '../server-fns'

export function CreatePostForm() {
  const { mutate, isPending } = useCreatePost()

  const form = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  })

  const onSubmit = (values: CreatePostInput) => {
    mutate({ data: values })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('title')} />
      {form.formState.errors.title && (
        <span>{form.formState.errors.title.message}</span>
      )}
      {/* ... */}
    </form>
  )
}
```

## Data Flow Summary

1. **User Action** → Fills out form
2. **Submit** → `mutate({ data })` triggers mutation
3. **Mutation** → Calls server function
4. **Server** → Validates with Zod, checks auth, writes to DB
5. **Success** → `onSuccess` invalidates queries
6. **Query** → Refetches data automatically
7. **UI** → Updates with fresh data
