# Cloudflare Workflows

## Imports

```typescript
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers";
```

## Binding Type

```typescript
type Bindings = {
  MY_WORKFLOW: Workflow;
};
```

## Wrangler Config

```jsonc
// wrangler.jsonc
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

## Workflow Class

```typescript
// src/workflows/order-processing.ts
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers";

type OrderParams = {
  orderId: string;
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
};

export class OrderWorkflow extends WorkflowEntrypoint<Bindings, OrderParams> {
  async run(event: WorkflowEvent<OrderParams>, step: WorkflowStep) {
    const { orderId, userId, items } = event.payload;

    // Step 1: Validate inventory
    const inventory = await step.do("validate-inventory", async () => {
      // Check stock for all items
      const results = await Promise.all(
        items.map(async (item) => {
          const res = await fetch(`https://inventory.example.com/check/${item.productId}`);
          return res.json() as Promise<{ available: boolean }>;
        }),
      );
      return results.every((r) => r.available);
    });

    if (!inventory) {
      await step.do("notify-out-of-stock", async () => {
        await fetch("https://notifications.example.com/send", {
          method: "POST",
          body: JSON.stringify({ userId, message: "Items out of stock" }),
        });
      });
      return { status: "cancelled", reason: "out_of_stock" };
    }

    // Step 2: Process payment
    const payment = await step.do("process-payment", async () => {
      const res = await fetch("https://payments.example.com/charge", {
        method: "POST",
        body: JSON.stringify({ orderId, userId }),
      });
      return res.json() as Promise<{ transactionId: string }>;
    });

    // Step 3: Wait for fulfillment (external signal)
    await step.sleep("wait-before-fulfillment", "5 seconds");

    // Step 4: Create shipment
    const shipment = await step.do("create-shipment", async () => {
      const res = await fetch("https://shipping.example.com/create", {
        method: "POST",
        body: JSON.stringify({ orderId, items }),
      });
      return res.json() as Promise<{ trackingNumber: string }>;
    });

    // Step 5: Send confirmation
    await step.do("send-confirmation", async () => {
      await fetch("https://notifications.example.com/send", {
        method: "POST",
        body: JSON.stringify({
          userId,
          message: `Order ${orderId} shipped! Tracking: ${shipment.trackingNumber}`,
        }),
      });
    });

    return {
      status: "completed",
      transactionId: payment.transactionId,
      trackingNumber: shipment.trackingNumber,
    };
  }
}
```

## Steps

Each `step.do()` is durably executed — if the Worker crashes, execution resumes from the last completed step:

```typescript
// Named step with return value
const result = await step.do("step-name", async () => {
  // This code runs at most once (durably)
  return { data: "value" };
});

// Step with retry configuration
const result = await step.do(
  "flaky-api-call",
  {
    retries: { limit: 3, delay: "5 seconds", backoff: "exponential" },
    timeout: "30 seconds",
  },
  async () => {
    const res = await fetch("https://flaky-api.example.com/data");
    if (!res.ok) throw new Error("API failed");
    return res.json();
  },
);
```

## Sleep

Pause workflow execution for a duration:

```typescript
await step.sleep("wait-for-processing", "1 hour");
await step.sleep("short-delay", "30 seconds");
await step.sleep("daily-check", "1 day");
```

## Wait for Event

Wait for an external signal (e.g., human approval):

```typescript
// In workflow
const approval = await step.waitForEvent<{ approved: boolean }>(
  "wait-for-approval",
  { timeout: "24 hours" },
);

if (approval.payload.approved) {
  // Continue with approved flow
} else {
  // Handle rejection
}
```

## Triggering a Workflow from Hono

```typescript
app.post("/api/orders", async (c) => {
  const orderData = await c.req.json();

  // Create a new workflow instance
  const instance = await c.env.MY_WORKFLOW.create({
    params: orderData,
  });

  return c.json({ instanceId: instance.id }, 201);
});
```

## Getting Workflow Status

```typescript
app.get("/api/workflows/:id", async (c) => {
  const instanceId = c.req.param("id");

  const instance = await c.env.MY_WORKFLOW.get(instanceId);
  const status = await instance.status();

  return c.json(status);
});
```

## Sending Events to a Running Workflow

```typescript
app.post("/api/workflows/:id/approve", async (c) => {
  const instanceId = c.req.param("id");

  const instance = await c.env.MY_WORKFLOW.get(instanceId);
  await instance.sendEvent({ payload: { approved: true } });

  return c.json({ sent: true });
});
```

## Combined Export

Export workflow class alongside Hono app:

```typescript
// src/index.ts
import { Hono } from "hono";
export { OrderWorkflow } from "./workflows/order-processing";

const app = new Hono<{ Bindings: Bindings }>();
// ... routes

export default app;
```

## Use Cases

- **Order processing** — Multi-step checkout with payment, inventory, shipping
- **Approval flows** — Human-in-the-loop workflows with `waitForEvent`
- **Data pipelines** — ETL with durable steps and retries
- **Scheduled tasks** — Complex cron-like flows with `sleep`
- **Onboarding** — Multi-day user onboarding sequences

## Gotchas

- **Steps must be idempotent** — Steps may re-execute on failure/recovery
- **1MB step output limit** — Keep step return values small
- **Step names must be unique** — Each step in a workflow needs a distinct name
- **No binding access in steps** — Use `fetch()` or pass env data through params
- **Execution duration** — Workflows can run for days/weeks (not limited by Worker CPU time)
- **Beta** — Some features may change; check Cloudflare docs for latest

## Documentation

```bash
curl -H "Accept: text/markdown" https://developers.cloudflare.com/workflows/
```
