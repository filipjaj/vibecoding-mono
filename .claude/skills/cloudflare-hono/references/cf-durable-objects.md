# Cloudflare Durable Objects

## Binding Type

```typescript
type Bindings = {
  COUNTER: DurableObjectNamespace;
  ROOM: DurableObjectNamespace;
};
```

## Wrangler Config

```jsonc
// wrangler.jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "COUNTER",
        "class_name": "Counter"
      },
      {
        "name": "ROOM",
        "class_name": "ChatRoom"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["Counter", "ChatRoom"]
    }
  ]
}
```

## Durable Object Class

```typescript
// src/durable-objects/counter.ts
import { DurableObject } from "cloudflare:workers";

export class Counter extends DurableObject<Bindings> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case "/increment": {
        let value = (await this.ctx.storage.get<number>("count")) || 0;
        value++;
        await this.ctx.storage.put("count", value);
        return Response.json({ count: value });
      }

      case "/get": {
        const value = (await this.ctx.storage.get<number>("count")) || 0;
        return Response.json({ count: value });
      }

      case "/reset": {
        await this.ctx.storage.delete("count");
        return Response.json({ count: 0 });
      }

      default:
        return new Response("Not found", { status: 404 });
    }
  }
}
```

## Calling a Durable Object from Hono

```typescript
app.post("/api/counters/:name/increment", async (c) => {
  const name = c.req.param("name");

  // Deterministic ID from a name (same name = same DO instance)
  const id = c.env.COUNTER.idFromName(name);
  const stub = c.env.COUNTER.get(id);

  const res = await stub.fetch(new Request("http://do/increment"));
  const data = await res.json();

  return c.json(data);
});

app.get("/api/counters/:name", async (c) => {
  const name = c.req.param("name");
  const id = c.env.COUNTER.idFromName(name);
  const stub = c.env.COUNTER.get(id);

  const res = await stub.fetch(new Request("http://do/get"));
  return new Response(res.body, res);
});
```

## ID Creation

```typescript
// Deterministic — same name always maps to same DO
const id = c.env.COUNTER.idFromName("global-counter");

// Random unique ID — for when you need a new instance
const id = c.env.COUNTER.newUniqueId();

// From string (previously stored ID)
const id = c.env.COUNTER.idFromString(storedIdString);
```

## Storage API

```typescript
export class MyDO extends DurableObject<Bindings> {
  async fetch(request: Request): Promise<Response> {
    // Get single value
    const value = await this.ctx.storage.get<string>("key");

    // Get multiple values
    const map = await this.ctx.storage.get<string>(["key1", "key2"]);

    // Put single value
    await this.ctx.storage.put("key", "value");

    // Put multiple values (atomically)
    await this.ctx.storage.put({ key1: "value1", key2: "value2" });

    // Delete
    await this.ctx.storage.delete("key");

    // List all keys with prefix
    const entries = await this.ctx.storage.list({ prefix: "user:" });

    // Transaction (all-or-nothing)
    await this.ctx.storage.transaction(async (txn) => {
      const balance = (await txn.get<number>("balance")) || 0;
      await txn.put("balance", balance - 10);
    });

    return new Response("OK");
  }
}
```

## Alarm API

Schedule work to run later:

```typescript
export class Scheduler extends DurableObject<Bindings> {
  async fetch(request: Request): Promise<Response> {
    // Set alarm to fire in 60 seconds
    await this.ctx.storage.setAlarm(Date.now() + 60_000);
    return Response.json({ scheduled: true });
  }

  // Called when the alarm fires
  async alarm(): Promise<void> {
    // Do scheduled work
    await this.ctx.storage.delete("expired-data");

    // Optionally reschedule
    await this.ctx.storage.setAlarm(Date.now() + 60_000);
  }
}
```

## WebSocket Support (Hibernatable)

```typescript
export class ChatRoom extends DurableObject<Bindings> {
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      // Accept with hibernation support
      this.ctx.acceptWebSocket(server, ["user-tag"]);

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("Expected WebSocket", { status: 400 });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    // Broadcast to all connected clients
    const sockets = this.ctx.getWebSockets();
    for (const socket of sockets) {
      if (socket !== ws) {
        socket.send(typeof message === "string" ? message : new Uint8Array(message));
      }
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    ws.close(code, reason);
  }
}
```

Connect from Hono route:

```typescript
app.get("/api/rooms/:name/ws", async (c) => {
  if (c.req.header("Upgrade") !== "websocket") {
    return c.text("Expected WebSocket", 400);
  }

  const id = c.env.ROOM.idFromName(c.req.param("name"));
  const stub = c.env.ROOM.get(id);
  return stub.fetch(c.req.raw);
});
```

## Combined Export

Export DO classes alongside Hono app:

```typescript
// src/index.ts
import { Hono } from "hono";
export { Counter } from "./durable-objects/counter";
export { ChatRoom } from "./durable-objects/chat-room";

const app = new Hono<{ Bindings: Bindings }>();
// ... routes

export default app;
```

## Use Cases

- **Rate limiters** — Track request counts per user/IP with strong consistency
- **Counters** — Atomic increment/decrement without race conditions
- **WebSocket rooms** — Chat rooms, collaborative editing, game lobbies
- **Session state** — Persistent user sessions at the edge
- **Coordination** — Distributed locking, leader election

## Gotchas

- **Single-threaded per ID** — Each DO instance processes one request at a time (serialized)
- **Global uniqueness** — A DO with a given ID exists in exactly one location globally
- **Billing** — Per request + per GB-second of duration (while active/handling requests)
- **No direct DB access** — DOs don't have bindings to other DOs or D1. Pass data via fetch.
- **Storage limits** — 128KB per value, 2048 bytes per key
- **Location** — Automatically placed near the first request; use `locationHint` for explicit placement

## Documentation

```bash
curl -H "Accept: text/markdown" https://developers.cloudflare.com/durable-objects/
```
