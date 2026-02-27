# Hono Error Handling

## HTTPException

Throw typed HTTP errors from any route or middleware:

```typescript
import { HTTPException } from "hono/http-exception";

app.get("/api/users/:id", async (c) => {
  const user = await c.env.DB
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(c.req.param("id"))
    .first();

  if (!user) {
    throw new HTTPException(404, { message: "User not found" });
  }

  return c.json(user);
});
```

With a `cause` for debugging:

```typescript
try {
  const data = await externalApi.fetch();
} catch (err) {
  throw new HTTPException(502, {
    message: "Upstream service failed",
    cause: err,
  });
}
```

## Global Error Handler

```typescript
import { HTTPException } from "hono/http-exception";

app.onError((err, c) => {
  // Handle known HTTP exceptions
  if (err instanceof HTTPException) {
    return c.json(
      { error: err.message },
      err.status,
    );
  }

  // Log unexpected errors in background
  c.executionCtx.waitUntil(
    logError(err, c.req.url, c.req.method),
  );

  // Return generic 500 for unexpected errors
  return c.json(
    { error: "Internal server error" },
    500,
  );
});
```

## Not Found Handler

```typescript
app.notFound((c) => {
  return c.json(
    { error: "Not found", path: c.req.path },
    404,
  );
});
```

## Structured Error Responses

Consistent error format across all endpoints:

```typescript
type ErrorResponse = {
  error: string;
  details?: Array<{ path: string; message: string }>;
  requestId?: string;
};

app.onError((err, c) => {
  const requestId = c.get("requestId"); // from request ID middleware

  if (err instanceof HTTPException) {
    const response: ErrorResponse = {
      error: err.message,
      requestId,
    };
    return c.json(response, err.status);
  }

  const response: ErrorResponse = {
    error: "Internal server error",
    requestId,
  };

  c.executionCtx.waitUntil(logError(err, requestId));
  return c.json(response, 500);
});
```

## Zod Validation Errors

Format ZodError into user-friendly responses (used with `@hono/zod-validator`):

```typescript
import { ZodError } from "zod";
import { HTTPException } from "hono/http-exception";

app.onError((err, c) => {
  if (err instanceof ZodError) {
    return c.json(
      {
        error: "Validation failed",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      400,
    );
  }

  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  return c.json({ error: "Internal server error" }, 500);
});
```

Or handle it inline in the `zValidator` hook (see `hono-validation.md`).

## Error Middleware

Catch errors in the middleware chain to add context:

```typescript
import { createMiddleware } from "hono/factory";

const errorContextMiddleware = createMiddleware(async (c, next) => {
  try {
    await next();
  } catch (err) {
    // Enrich error with request context before it reaches onError
    console.error(`Error in ${c.req.method} ${c.req.path}:`, err);
    throw err; // re-throw to reach app.onError
  }
});

app.use("*", errorContextMiddleware);
```

## Background Error Logging

Use `waitUntil()` to report errors without blocking the response:

```typescript
async function logError(
  err: Error,
  requestId?: string,
): Promise<void> {
  // Send to external error tracking service
  await fetch("https://errors.example.com/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: err.message,
      stack: err.stack,
      requestId,
      timestamp: new Date().toISOString(),
    }),
  });
}

app.onError((err, c) => {
  // Fire-and-forget error reporting
  c.executionCtx.waitUntil(logError(err, c.get("requestId")));

  return c.json({ error: "Internal server error" }, 500);
});
```

## Documentation

```bash
curl -H "Accept: text/markdown" https://hono.dev/docs/api/hono#error-handling
```
