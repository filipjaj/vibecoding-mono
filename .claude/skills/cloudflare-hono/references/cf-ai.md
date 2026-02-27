# Workers AI (Basic Reference)

## Binding Type

```typescript
type Bindings = {
  AI: Ai;
};
```

## Wrangler Config

```jsonc
// wrangler.jsonc
{
  "ai": {
    "binding": "AI"
  }
}
```

## Text Generation

```typescript
app.post("/api/ai/chat", async (c) => {
  const { prompt } = await c.req.json();

  const response = await c.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt },
    ],
  });

  return c.json(response);
});
```

## Streaming Response

```typescript
app.post("/api/ai/stream", async (c) => {
  const { prompt } = await c.req.json();

  const stream = await c.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });

  return new Response(stream, {
    headers: { "content-type": "text/event-stream" },
  });
});
```

## Text Embeddings

```typescript
app.post("/api/ai/embed", async (c) => {
  const { text } = await c.req.json();

  const response = await c.env.AI.run("@cf/baai/bge-base-en-v1.5", {
    text: Array.isArray(text) ? text : [text],
  });

  return c.json({ embeddings: response.data });
});
```

## Image Classification

```typescript
app.post("/api/ai/classify", async (c) => {
  const formData = await c.req.formData();
  const image = formData.get("image") as File;

  const response = await c.env.AI.run(
    "@cf/microsoft/resnet-50",
    { image: [...new Uint8Array(await image.arrayBuffer())] },
  );

  return c.json(response);
});
```

## Text Summarization

```typescript
const response = await c.env.AI.run("@cf/facebook/bart-large-cnn", {
  input_text: longArticle,
  max_length: 200,
});
```

## Popular Models

| Task              | Model                                  |
| ----------------- | -------------------------------------- |
| Chat/Instruct     | `@cf/meta/llama-3.1-8b-instruct`      |
| Embeddings        | `@cf/baai/bge-base-en-v1.5`           |
| Image Class.      | `@cf/microsoft/resnet-50`             |
| Summarization     | `@cf/facebook/bart-large-cnn`         |
| Translation       | `@cf/meta/m2m100-1.2b`               |
| Text-to-Image     | `@cf/stabilityai/stable-diffusion-xl-base-1.0` |
| Speech-to-Text    | `@cf/openai/whisper`                  |

## Gotchas

- **Cold starts** — First request to a model may be slower (model loading)
- **Token limits** — Vary by model; check model card for context window size
- **Pricing** — Free tier includes limited neurons/day; paid plans have higher limits
- **No fine-tuning** — Use pre-trained models as-is; for custom models, bring your own via Workers AI custom models
- **Streaming** — Only supported for text generation models

## Documentation

```bash
curl -H "Accept: text/markdown" https://developers.cloudflare.com/workers-ai/
```
