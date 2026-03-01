# Shelf — Book & Film Club Platform

**Date:** 2026-02-28
**Status:** Approved
**Working title:** Shelf

## Overview

A web platform for creating and managing book clubs and film clubs. Combines media tracking (like Letterboxd/Hardcover) with event organizing (like Luma/Partiful) and a social layer. Clubs are the primary unit — persistent groups with members, a media schedule, recurring events, reviews, and discussions.

## Tech Stack

- **Frontend:** TanStack Start (React 19, TanStack Router, Vite) + Tailwind v4 + shadcn/base-ui
- **API:** Hono on Cloudflare Workers
- **Database:** Neon Postgres via `@neondatabase/serverless` + Drizzle ORM
- **Auth:** Better Auth (magic link email + Google OAuth)
- **Media data:** Open Library (books) + TMDB (films)
- **Monorepo:** Bun workspaces (`apps/web`, `apps/api`)
- **Template:** https://github.com/filipjaj/vibecoding-mono.git

## Data Model

### Users
- `id`, `email`, `name`, `avatar_url`, `created_at`
- Managed by Better Auth

### Clubs
- `id`, `name`, `description`, `cover_image_url`, `media_type` (book | film), `invite_code`, `created_by`, `recurrence_rule`, `created_at`
- One media type per club

### Club Members
- `club_id`, `user_id`, `role` (admin | member), `joined_at`

### Media Items
- `id`, `external_id` (Open Library/TMDB ID), `media_type`, `title`, `author_or_director`, `cover_url`, `year`, `description`
- Cached from external APIs

### Club Schedule
- `id`, `club_id`, `media_item_id`, `order`, `scheduled_date`, `status` (upcoming | current | completed)

### Events
- `id`, `club_id`, `schedule_item_id` (nullable), `title`, `description`, `location`, `starts_at`, `ends_at`

### RSVPs
- `event_id`, `user_id`, `status` (going | maybe | not_going)

### Reviews
- `id`, `user_id`, `media_item_id`, `club_id` (nullable), `rating` (1-5), `text`, `created_at`

### Discussion Threads
- `id`, `club_id`, `media_item_id` (nullable), `event_id` (nullable), `title`, `created_by`, `created_at`

### Discussion Comments
- `id`, `thread_id`, `user_id`, `text`, `created_at`

### User Shelves
- `user_id`, `media_item_id`, `status` (want | reading | watched | finished), `added_at`

### Activity Events
- `id`, `user_id`, `club_id`, `type`, `payload` (JSON), `created_at`

### Club Member Progress
- `club_id`, `user_id`, `media_item_id`, `status` (not_started | in_progress | finished), `updated_at`

## Architecture

```
apps/
  web/                          # TanStack Start frontend
    src/
      routes/
        index.tsx               # Landing / home feed
        clubs/
          $clubId.tsx           # Club detail
          $clubId.events.tsx
          $clubId.schedule.tsx
          new.tsx               # Create club
        events/
          $eventId.tsx          # Event detail + RSVP
        media/
          $mediaId.tsx          # Media detail + reviews
        join/
          $inviteCode.tsx       # Join via invite link
        users/
          $userId.tsx           # User profile + shelf
        auth/
          login.tsx
          callback.tsx
      components/
        club/                   # Club-related components
        event/                  # Event cards, RSVP buttons
        media/                  # Media cards, search, reviews
        feed/                   # Activity feed components
        layout/                 # Nav, sidebar, shells
        ui/                     # shadcn/base-ui primitives
      lib/
        api.ts                  # API client
  api/                          # Hono Worker
    src/
      index.ts                  # Main app + middleware
      routes/
        auth.ts                 # Better Auth endpoints
        clubs.ts                # CRUD, invite links, members
        events.ts               # CRUD, RSVPs
        media.ts                # Search (proxies Open Library / TMDB)
        reviews.ts              # CRUD
        discussions.ts          # Threads + comments
        users.ts                # Profiles, shelves
        feed.ts                 # Activity feed
      db/
        schema.ts               # Drizzle schema
        migrations/             # SQL migrations
      lib/
        auth.ts                 # Better Auth config
        external/               # Open Library & TMDB clients
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/*` | Better Auth (login/signup/callback) |
| GET | `/api/clubs` | List user's clubs |
| POST | `/api/clubs` | Create club |
| GET | `/api/clubs/:id` | Club detail + members |
| POST | `/api/clubs/:id/invite` | Generate invite link |
| POST | `/api/clubs/join/:code` | Join via invite code |
| GET | `/api/clubs/:id/schedule` | Club reading/watch list |
| POST | `/api/clubs/:id/schedule` | Add media to schedule |
| PATCH | `/api/clubs/:id/schedule/:itemId` | Update schedule item status |
| GET | `/api/clubs/:id/events` | List events |
| POST | `/api/clubs/:id/events` | Create event |
| POST | `/api/events/:id/rsvp` | RSVP to event |
| GET | `/api/media/search` | Search books/films |
| GET | `/api/media/:id` | Media detail |
| POST | `/api/media/:id/reviews` | Post review |
| GET | `/api/clubs/:id/discussions` | List threads |
| POST | `/api/clubs/:id/discussions` | Create thread |
| POST | `/api/discussions/:id/comments` | Add comment |
| GET | `/api/users/:id` | User profile |
| GET | `/api/users/:id/shelf` | User's personal shelf |
| POST | `/api/shelf` | Add/update shelf item |
| POST | `/api/clubs/:id/progress` | Update reading/watching progress |
| GET | `/api/feed` | Activity feed for current user |

## Key User Flows

### Create a Club
1. Sign up / log in
2. Click "Create Club" → pick media type, enter name, description
3. Set recurrence rule (e.g. "Every 2 weeks on Thursday at 19:00")
4. Get shareable invite link
5. Land on empty club page, ready to add first media item

### Join a Club
1. Receive invite link
2. Open link → see club preview (name, description, member count, upcoming media)
3. Sign up or log in if needed
4. Auto-joined → redirected to club page

### Add Media to Schedule
1. Club admin opens schedule tab
2. Search for book/film (queries Open Library or TMDB)
3. Select result → added to schedule with target date
4. Event auto-generated from recurrence rule

### Attend Event + Review
1. See upcoming event on club page or home feed
2. RSVP (going/maybe/not going)
3. After event, write review with 1-5 star rating + text
4. Review visible on media page and within club

### Track Progress
1. From club schedule, mark current media as "in progress" or "finished"
2. Progress visible to other club members on the schedule page

### Personal Shelf
1. From any media page, add to personal shelf (want/reading/watched/finished)
2. Shelf visible on user profile page

## UI Approach

- Use existing shadcn/base-ui + Tailwind v4 from template
- Clean, content-focused design (think Letterboxd's simplicity)
- Mobile-responsive from the start
- Cover art and media imagery as primary visual elements

## Not in MVP

- Push notifications / email reminders
- Public club directory / discovery
- Mobile app (PWA or native)
- Image uploads (rely on external API cover art)
- Admin moderation tools beyond basic club admin
- Real-time chat / WebSocket features
