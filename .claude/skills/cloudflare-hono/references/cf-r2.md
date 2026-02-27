# Cloudflare R2 (Object Storage)

## Binding Type

```typescript
type Bindings = {
  BUCKET: R2Bucket;
};
```

## Wrangler Config

```jsonc
// wrangler.jsonc
{
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "my-bucket"  // from `wrangler r2 bucket create`
    }
  ]
}
```

Create a bucket:

```bash
wrangler r2 bucket create my-bucket
```

## CRUD Operations

### Upload (Put)

```typescript
app.post("/api/files", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  const key = `uploads/${Date.now()}-${file.name}`;

  await c.env.BUCKET.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
    customMetadata: {
      originalName: file.name,
      uploadedBy: c.get("user")?.id || "anonymous",
    },
  });

  return c.json({ key }, 201);
});
```

### Download (Get)

```typescript
app.get("/api/files/:key{.+}", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.BUCKET.get(key);

  if (!object) {
    return c.notFound();
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  return new Response(object.body, { headers });
});
```

### Head (Metadata Only)

```typescript
app.head("/api/files/:key{.+}", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.BUCKET.head(key);

  if (!object) {
    return c.notFound();
  }

  return c.json({
    key: object.key,
    size: object.size,
    etag: object.etag,
    uploaded: object.uploaded,
    httpMetadata: object.httpMetadata,
    customMetadata: object.customMetadata,
  });
});
```

### Delete

```typescript
app.delete("/api/files/:key{.+}", async (c) => {
  const key = c.req.param("key");
  await c.env.BUCKET.delete(key);
  return c.json({ deleted: true });
});

// Delete multiple objects
await c.env.BUCKET.delete(["file1.txt", "file2.txt", "file3.txt"]);
```

### List

```typescript
app.get("/api/files", async (c) => {
  const prefix = c.req.query("prefix") || "";
  const limit = Number(c.req.query("limit") || "100");
  const cursor = c.req.query("cursor");

  const listed = await c.env.BUCKET.list({
    prefix,
    limit,
    cursor: cursor || undefined,
  });

  return c.json({
    objects: listed.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
    })),
    truncated: listed.truncated,
    cursor: listed.truncated ? listed.cursor : undefined,
  });
});
```

## Directory-Like Listing

Use prefix and delimiter for folder-like browsing:

```typescript
const listed = await c.env.BUCKET.list({
  prefix: "images/",
  delimiter: "/",
});

// listed.objects = files directly in images/
// listed.delimitedPrefixes = ["images/avatars/", "images/banners/"]
```

## Conditional Operations

Use HTTP conditional headers for efficient updates:

```typescript
app.put("/api/files/:key{.+}", async (c) => {
  const key = c.req.param("key");
  const ifMatch = c.req.header("if-match");

  await c.env.BUCKET.put(key, c.req.raw.body, {
    onlyIf: ifMatch ? { etagMatches: ifMatch } : undefined,
    httpMetadata: {
      contentType: c.req.header("content-type") || "application/octet-stream",
    },
  });

  return c.json({ updated: true });
});
```

## Streaming Large Files

```typescript
app.get("/api/files/:key{.+}/download", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.BUCKET.get(key);

  if (!object) return c.notFound();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-disposition", `attachment; filename="${key.split("/").pop()}"`);

  return new Response(object.body, { headers });
});
```

## Gotchas

- **5GB max single put** — For larger objects, use multipart upload API
- **No rename** — To rename, copy to new key then delete old key
- **Key length** — Max 1024 bytes
- **Metadata size** — Max 2048 bytes total for custom metadata
- **Egress** — Free egress (no bandwidth charges), which is R2's main advantage over S3
- **Consistency** — Strong read-after-write consistency
- **No presigned URLs in Workers** — Use `createSignedUrl()` from the S3-compatible API for presigned URLs, or use a Worker as a proxy

## Documentation

```bash
curl -H "Accept: text/markdown" https://developers.cloudflare.com/r2/
```
