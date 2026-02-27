# Wrangler Configuration

## File Format

Use `wrangler.jsonc` (JSON with comments) at the project root:

```jsonc
// wrangler.jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-api",
  "main": "src/index.ts",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"]
}
```

## Basic Configuration

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "humble-api",
  "main": "src/index.ts",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  }
}
```

## All Binding Configs

### KV Namespaces

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "MY_KV",
      "id": "abc123..."
    }
  ]
}
```

### D1 Databases

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-database",
      "database_id": "abc123-def456-..."
    }
  ]
}
```

### R2 Buckets

```jsonc
{
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "my-bucket"
    }
  ]
}
```

### Durable Objects

```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "COUNTER",
        "class_name": "Counter"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["Counter"]
    }
  ]
}
```

### Queues

```jsonc
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

### Workflows

```jsonc
{
  "workflows": [
    {
      "name": "my-workflow",
      "binding": "MY_WORKFLOW",
      "class_name": "MyWorkflow"
    }
  ]
}
```

### Hyperdrive

```jsonc
{
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "abc123..."
    }
  ]
}
```

### Workers AI

```jsonc
{
  "ai": {
    "binding": "AI"
  }
}
```

### Service Bindings

```jsonc
{
  "services": [
    {
      "binding": "AUTH_SERVICE",
      "service": "auth-worker"
    }
  ]
}
```

### Analytics Engine

```jsonc
{
  "analytics_engine_datasets": [
    {
      "binding": "ANALYTICS",
      "dataset": "my-dataset"
    }
  ]
}
```

## Environment Variables

### Non-Sensitive (vars)

```jsonc
{
  "vars": {
    "ENVIRONMENT": "production",
    "API_VERSION": "v1",
    "ALLOWED_ORIGINS": "https://example.com"
  }
}
```

### Secrets

```bash
# Set a secret (interactive prompt)
wrangler secret put JWT_SECRET

# Set from stdin
echo "my-secret-value" | wrangler secret put JWT_SECRET

# List secrets
wrangler secret list
```

### Local Development Secrets

Create `.dev.vars` in the project root (must be gitignored):

```bash
# .dev.vars
JWT_SECRET=dev-secret-key
DATABASE_URL=postgres://user:pass@localhost:5432/mydb
STRIPE_API_KEY=sk_test_xxx
```

## Environments

Override settings per environment:

```jsonc
{
  "name": "humble-api",
  "main": "src/index.ts",
  "compatibility_date": "2024-12-01",
  "vars": {
    "ENVIRONMENT": "development"
  },
  "env": {
    "staging": {
      "name": "humble-api-staging",
      "vars": {
        "ENVIRONMENT": "staging"
      },
      "kv_namespaces": [
        {
          "binding": "MY_KV",
          "id": "staging-kv-id..."
        }
      ]
    },
    "production": {
      "name": "humble-api-production",
      "vars": {
        "ENVIRONMENT": "production"
      },
      "kv_namespaces": [
        {
          "binding": "MY_KV",
          "id": "production-kv-id..."
        }
      ]
    }
  }
}
```

Deploy to specific environment:

```bash
wrangler deploy --env staging
wrangler deploy --env production
```

## Routes and Custom Domains

```jsonc
{
  "routes": [
    {
      "pattern": "api.example.com/*",
      "zone_name": "example.com"
    }
  ]
}
```

Or use custom domains:

```jsonc
{
  "routes": [
    {
      "pattern": "api.example.com",
      "custom_domain": true
    }
  ]
}
```

## Cron Triggers

```jsonc
{
  "triggers": {
    "crons": [
      "0 * * * *",
      "0 0 * * *"
    ]
  }
}
```

Handle in the Worker:

```typescript
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    switch (event.cron) {
      case "0 * * * *":
        ctx.waitUntil(hourlyTask(env));
        break;
      case "0 0 * * *":
        ctx.waitUntil(dailyTask(env));
        break;
    }
  },
};
```

## Static Assets

```jsonc
{
  "assets": {
    "directory": "./public",
    "binding": "ASSETS"
  }
}
```

## CPU Limits

```jsonc
{
  "limits": {
    "cpu_ms": 100
  }
}
```

## Deploy Commands

```bash
# Deploy to production
wrangler deploy

# Deploy to specific environment
wrangler deploy --env staging

# Dry run (shows what would happen)
wrangler deploy --dry-run

# Deploy with specific config
wrangler deploy --config wrangler.jsonc

# Local development
wrangler dev

# Local dev on specific port
wrangler dev --port 8787

# Tail logs
wrangler tail
```

## Complete Example

```jsonc
// wrangler.jsonc — full project config
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "humble-api",
  "main": "src/index.ts",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  },
  "vars": {
    "ENVIRONMENT": "development"
  },
  "kv_namespaces": [
    {
      "binding": "CACHE",
      "id": "kv-namespace-id"
    }
  ],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "humble-db",
      "database_id": "d1-database-id"
    }
  ],
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "humble-uploads"
    }
  ],
  "queues": {
    "producers": [
      {
        "binding": "TASK_QUEUE",
        "queue": "humble-tasks"
      }
    ],
    "consumers": [
      {
        "queue": "humble-tasks",
        "max_batch_size": 10,
        "max_retries": 3
      }
    ]
  },
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "hyperdrive-config-id"
    }
  ],
  "ai": {
    "binding": "AI"
  }
}
```

## Documentation

```bash
curl -H "Accept: text/markdown" https://developers.cloudflare.com/workers/wrangler/configuration/
```
