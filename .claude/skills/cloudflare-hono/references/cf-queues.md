# Cloudflare Queues

## Binding Type

```typescript
type Bindings = {
  MY_QUEUE: Queue;
};
```

## Wrangler Config

```jsonc
// wrangler.jsonc
{
  "queues": {
    "producers": [
      {
        "binding": "MY_QUEUE",
        "queue": "my-queue"
      }
    ],
    "consumers": [
      {
        "queue": "my-queue",
        "max_batch_size": 10,
        "max_batch_timeout": 30,
        "max_retries": 3,
        "dead_letter_queue": "my-queue-dlq"
      }
    ]
  }
}
```

Create a queue:

```bash
wrangler queues create my-queue
wrangler queues create my-queue-dlq  # dead letter queue
```

## Producer (Sending Messages)

```typescript
// Send a single message
app.post("/api/emails/send", async (c) => {
  const { to, subject, body } = await c.req.json();

  await c.env.MY_QUEUE.send({
    type: "email",
    to,
    subject,
    body,
    timestamp: Date.now(),
  });

  return c.json({ queued: true });
});

// Send a batch of messages
app.post("/api/notifications/batch", async (c) => {
  const { notifications } = await c.req.json();

  await c.env.MY_QUEUE.sendBatch(
    notifications.map((n: any) => ({
      body: n,
    })),
  );

  return c.json({ queued: notifications.length });
});
```

## Consumer (Processing Messages)

Export a `queue` handler alongside the Hono app:

```typescript
// src/index.ts
import { Hono } from "hono";

type Bindings = {
  MY_QUEUE: Queue;
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();
// ... routes

export default {
  fetch: app.fetch,

  async queue(
    batch: MessageBatch,
    env: Bindings,
  ): Promise<void> {
    for (const message of batch.messages) {
      try {
        const data = message.body as { type: string; [key: string]: unknown };

        switch (data.type) {
          case "email":
            await sendEmail(data, env);
            message.ack();
            break;

          case "notification":
            await createNotification(data, env);
            message.ack();
            break;

          default:
            console.error(`Unknown message type: ${data.type}`);
            message.ack(); // ack to prevent infinite retry
        }
      } catch (err) {
        console.error("Failed to process message:", err);
        message.retry(); // will be retried
      }
    }
  },
};
```

## Batch Processing

Process all messages at once instead of one-by-one:

```typescript
export default {
  fetch: app.fetch,

  async queue(batch: MessageBatch, env: Bindings): Promise<void> {
    // Process entire batch
    const rows = batch.messages.map((msg) => {
      const data = msg.body as { userId: string; action: string };
      return { userId: data.userId, action: data.action };
    });

    // Batch insert into D1
    const stmt = env.DB.prepare(
      "INSERT INTO activity_log (user_id, action) VALUES (?, ?)",
    );
    await env.DB.batch(
      rows.map((r) => stmt.bind(r.userId, r.action)),
    );

    // Ack all messages at once
    batch.ackAll();
  },
};
```

## Message Operations

```typescript
for (const message of batch.messages) {
  // message.body — the message payload
  // message.id — unique message ID
  // message.timestamp — when the message was sent

  message.ack();    // successfully processed, remove from queue
  message.retry();  // failed, will be retried (up to max_retries)
}

// Ack/retry entire batch
batch.ackAll();
batch.retryAll();
```

## Content Types

```typescript
// JSON (default)
await c.env.MY_QUEUE.send({ key: "value" });

// String
await c.env.MY_QUEUE.send("plain text message");

// ArrayBuffer (binary)
const buffer = new ArrayBuffer(8);
await c.env.MY_QUEUE.send(buffer);
```

## Dead Letter Queue

Messages that fail after `max_retries` are sent to the DLQ. Configure a consumer for the DLQ to handle failed messages:

```jsonc
{
  "queues": {
    "consumers": [
      {
        "queue": "my-queue-dlq",
        "max_batch_size": 10
      }
    ]
  }
}
```

## Gotchas

- **Max 100KB per message** — Keep payloads small; store large data in R2/KV and send a reference
- **Max 100 messages per sendBatch** — Chunk larger batches
- **At-least-once delivery** — Messages may be delivered more than once; make consumers idempotent
- **Max retries** — After `max_retries`, message goes to DLQ (if configured) or is discarded
- **Batch timeout** — Consumer waits up to `max_batch_timeout` seconds to fill a batch before processing
- **Same Worker** — Producer and consumer can be in the same Worker (common pattern)
- **No FIFO guarantee** — Messages may arrive out of order

## Documentation

```bash
curl -H "Accept: text/markdown" https://developers.cloudflare.com/queues/
```
