import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  pgEnum,
  uuid,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Enums ──────────────────────────────────────────────

export const mediaTypeEnum = pgEnum("media_type", ["book", "film"]);
export const clubRoleEnum = pgEnum("club_role", ["admin", "member"]);
export const scheduleStatusEnum = pgEnum("schedule_status", [
  "upcoming",
  "current",
  "completed",
]);
export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "going",
  "maybe",
  "not_going",
]);
export const shelfStatusEnum = pgEnum("shelf_status", [
  "want",
  "reading",
  "watched",
  "finished",
]);
export const progressStatusEnum = pgEnum("progress_status", [
  "not_started",
  "in_progress",
  "finished",
]);

export const selectionModeEnum = pgEnum("selection_mode", [
  "admin_picks",
  "rotation",
  "vote",
]);

export const reviewVisibilityEnum = pgEnum("review_visibility", [
  "club_only",
  "public",
]);

// ─── Better Auth tables ─────────────────────────────────

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: "string" }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: "string" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

// ─── App tables ─────────────────────────────────────────

export const clubs = pgTable("clubs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  mediaType: mediaTypeEnum("media_type").notNull(),
  inviteCode: varchar("invite_code", { length: 20 }).notNull().unique(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  recurrenceRule: text("recurrence_rule"),
  selectionMode: selectionModeEnum("selection_mode").notNull().default("admin_picks"),
  currentRoundId: uuid("current_round_id"),
  pacingEnabled: boolean("pacing_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const clubMembers = pgTable(
  "club_members",
  {
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    role: clubRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("club_members_unique").on(t.clubId, t.userId)]
);

export const mediaItems = pgTable(
  "media_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    externalId: text("external_id").notNull(),
    mediaType: mediaTypeEnum("media_type").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    authorOrDirector: varchar("author_or_director", { length: 255 }),
    coverUrl: text("cover_url"),
    year: integer("year"),
    description: text("description"),
    pageCount: integer("page_count"),
    runtimeMinutes: integer("runtime_minutes"),
  },
  (t) => [uniqueIndex("media_items_external").on(t.externalId, t.mediaType)]
);

export const clubSchedule = pgTable("club_schedule", {
  id: uuid("id").defaultRandom().primaryKey(),
  clubId: uuid("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  mediaItemId: uuid("media_item_id")
    .notNull()
    .references(() => mediaItems.id),
  order: integer("order").notNull().default(0),
  scheduledDate: timestamp("scheduled_date", { mode: "date" }),
  status: scheduleStatusEnum("status").notNull().default("upcoming"),
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  clubId: uuid("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  scheduleItemId: uuid("schedule_item_id").references(() => clubSchedule.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  location: text("location"),
  startsAt: timestamp("starts_at", { mode: "date" }).notNull(),
  endsAt: timestamp("ends_at", { mode: "date" }),
});

export const rounds = pgTable("rounds", {
  id: uuid("id").defaultRandom().primaryKey(),
  clubId: uuid("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  mediaItemId: uuid("media_item_id").references(() => mediaItems.id),
  order: integer("order").notNull().default(0),
  selectedBy: text("selected_by").references(() => users.id),
  eventId: uuid("event_id").references(() => events.id),
  startedAt: timestamp("started_at", { mode: "date" }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { mode: "date" }),
});

export const nominations = pgTable("nominations", {
  id: uuid("id").defaultRandom().primaryKey(),
  roundId: uuid("round_id")
    .notNull()
    .references(() => rounds.id, { onDelete: "cascade" }),
  nominatedBy: text("nominated_by")
    .notNull()
    .references(() => users.id),
  mediaItemId: uuid("media_item_id")
    .notNull()
    .references(() => mediaItems.id),
  pitch: text("pitch"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const nominationVotes = pgTable(
  "nomination_votes",
  {
    nominationId: uuid("nomination_id")
      .notNull()
      .references(() => nominations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("nomination_votes_unique").on(t.nominationId, t.userId)]
);

export const rotationOrder = pgTable(
  "rotation_order",
  {
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    position: integer("position").notNull(),
    lastPickedRoundId: uuid("last_picked_round_id").references(() => rounds.id),
  },
  (t) => [uniqueIndex("rotation_order_unique").on(t.clubId, t.userId)]
);

export const rsvps = pgTable(
  "rsvps",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    status: rsvpStatusEnum("status").notNull(),
  },
  (t) => [uniqueIndex("rsvps_unique").on(t.eventId, t.userId)]
);

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  mediaItemId: uuid("media_item_id")
    .notNull()
    .references(() => mediaItems.id),
  clubId: uuid("club_id").references(() => clubs.id),
  roundId: uuid("round_id").references(() => rounds.id),
  visibility: reviewVisibilityEnum("visibility").notNull().default("club_only"),
  rating: integer("rating").notNull(),
  text: text("text"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const discussionThreads = pgTable("discussion_threads", {
  id: uuid("id").defaultRandom().primaryKey(),
  clubId: uuid("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  mediaItemId: uuid("media_item_id").references(() => mediaItems.id),
  eventId: uuid("event_id").references(() => events.id),
  title: varchar("title", { length: 255 }).notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const discussionComments = pgTable("discussion_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => discussionThreads.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const userShelves = pgTable(
  "user_shelves",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    mediaItemId: uuid("media_item_id")
      .notNull()
      .references(() => mediaItems.id),
    status: shelfStatusEnum("status").notNull(),
    addedAt: timestamp("added_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("user_shelves_unique").on(t.userId, t.mediaItemId)]
);

export const activityEvents = pgTable("activity_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  clubId: uuid("club_id").references(() => clubs.id),
  type: varchar("type", { length: 50 }).notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const clubMemberProgress = pgTable(
  "club_member_progress",
  {
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    mediaItemId: uuid("media_item_id")
      .notNull()
      .references(() => mediaItems.id),
    roundId: uuid("round_id").references(() => rounds.id),
    currentPage: integer("current_page"),
    status: progressStatusEnum("status").notNull().default("not_started"),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("club_member_progress_unique").on(t.clubId, t.userId, t.mediaItemId),
  ]
);
